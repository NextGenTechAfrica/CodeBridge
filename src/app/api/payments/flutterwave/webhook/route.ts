// src/app/api/payments/flutterwave/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, transaction, execute } from '@/lib/db/connection';
import { recordAuditLog } from '@/lib/auth/session';
import { verifyWebhookSignature, verifyFlutterwaveTransaction } from '@/lib/payments/flutterwave';
import { sendPaymentConfirmationNotification } from '@/lib/notifications/email';
import { recordPaymentLedgerEntry, recordPayoutSuccessLedgerEntry } from '@/lib/payments/ledger';
import { recordCommissionAndQueuePayout } from '@/lib/payments/commission';
import { confirmRefundSuccess } from '@/lib/payments/refund';

export async function POST(req: NextRequest) {
  let webhookEventId: string | null = null;
  try {
    const rawBody = await req.text();
    const verifHash = req.headers.get('verif-hash');
    const flutterwaveSignature = req.headers.get('flutterwave-signature');

    // 1. Authenticate / Validate Webhook Signature (Dual Mechanism: verif-hash OR flutterwave-signature HMAC)
    const isSignatureValid = verifyWebhookSignature(
      { verifHash, flutterwaveSignature },
      rawBody
    );

    if (!isSignatureValid) {
      console.warn('[Flutterwave Webhook] Unauthorized request: Signature validation failed.');
      return NextResponse.json(
        { error: 'Webhook signature validation failed.' },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const { event, data } = payload;
    const eventId = String(data?.id || payload?.id || data?.tx_ref || data?.reference || `${event}_${Date.now()}`);
    const eventType = String(event || 'unknown');

    // 2. Webhook Architecture: Store raw event with DB uniqueness constraint on (provider, event_id)
    webhookEventId = `whe_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await execute(`
        INSERT INTO webhook_events (
          id, provider, event_id, event_type, payload_json, signature, status, created_at
        )
        VALUES (?, 'flutterwave', ?, ?, ?, ?, 'RECEIVED', datetime('now'))
      `, [
        webhookEventId,
        eventId,
        eventType,
        rawBody,
        flutterwaveSignature || verifHash || null,
      ]);
    } catch (dupErr: any) {
      const errMsg = String(dupErr?.message || '');
      const isDuplicate = errMsg.includes('UNIQUE') || errMsg.includes('duplicate key') || dupErr?.code === '23505';
      if (isDuplicate) {
        console.log(`[Flutterwave Webhook] Idempotent skip: event ${eventId} already received and processed.`);
        return NextResponse.json(
          { status: 'already_processed', message: 'Webhook event already recorded and deduplicated.' },
          { status: 200 }
        );
      }
      throw dupErr;
    }

    console.log(`[Flutterwave Webhook] Authenticated event: '${event}', eventId: '${eventId}', tx_ref: '${data?.tx_ref}'`);

    // =========================================================================
    // BRANCH 1: TRANSFER COMPLETED (Commission Payout Webhook)
    // =========================================================================
    if (event === 'transfer.completed') {
      const trfRef = data?.reference;
      const trfId = data?.id;
      const transferStatus = (data?.status || '').toUpperCase();
      console.log(`[Flutterwave Webhook] Transfer status '${transferStatus}' for reference: ${trfRef}, id: ${trfId}`);

      if (!trfRef && !trfId) {
        return NextResponse.json({ error: 'Missing transfer reference or id.' }, { status: 400 });
      }

      const payout = await queryOne<any>(
        'SELECT * FROM commission_payouts WHERE idempotency_key = ? OR provider_transfer_id = ?',
        [trfRef || '', String(trfId || '')]
      );

      if (!payout) {
        console.warn(`[Flutterwave Webhook] Transfer event received for unknown payout reference: ${trfRef}`);
        await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);
        return NextResponse.json({ message: 'Payout record not found.' }, { status: 200 });
      }

      // Idempotency: If already finalized as PAID, return 200 immediately
      if (payout.status === 'PAID') {
        await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);
        return NextResponse.json({ status: 'already_processed', message: 'Payout already marked PAID.' }, { status: 200 });
      }

      if (transferStatus === 'SUCCESSFUL') {
        await transaction(async (tx) => {
          await tx.execute(`
            UPDATE commission_payouts
            SET status = 'PAID',
                provider_transfer_id = COALESCE(provider_transfer_id, ?),
                paid_at = datetime('now'),
                updated_at = datetime('now')
            WHERE id = ?
          `, [String(trfId), payout.id]);

          if (payout.commission_id) {
            await tx.execute("UPDATE commissions SET status = 'PAID', updated_at = datetime('now') WHERE id = ?", [payout.commission_id]);
          }

          // Double-Entry Ledger: Debit REPRESENTATIVE_COMMISSION_PAYABLE, Credit GATEWAY_BALANCE
          await recordPayoutSuccessLedgerEntry(tx, {
            payoutId: payout.id,
            salesRepId: payout.sales_rep_id,
            currency: payout.currency,
            amountMinor: Number(payout.amount_minor),
            reference: trfRef || payout.idempotency_key,
            providerTransferId: String(trfId),
          });
        });

        await recordAuditLog({
          userId: 'system_flutterwave',
          action: 'PAYOUT_COMPLETED',
          entity: 'commission_payouts',
          entityId: payout.id,
          metadata: {
            salesRepId: payout.sales_rep_id,
            amountMinor: payout.amount_minor,
            currency: payout.currency,
            reference: trfRef,
            providerTransferId: trfId,
          },
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        });

        await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);
        return NextResponse.json({ status: 'success', message: 'Payout marked PAID and ledger updated.' }, { status: 200 });
      } else if (transferStatus === 'FAILED') {
        await execute(`
          UPDATE commission_payouts
          SET status = 'FAILED',
              failure_reason = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `, [data?.complete_message || 'Transfer failed at provider', payout.id]);

        await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);
        return NextResponse.json({ status: 'failed', message: 'Payout marked FAILED.' }, { status: 200 });
      }

      await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);
      return NextResponse.json({ message: `Transfer event acknowledged with status ${transferStatus}.` }, { status: 200 });
    }

    // =========================================================================
    // BRANCH 2: REFUND COMPLETED (Client Refund Confirmation Webhook)
    // =========================================================================
    if (event === 'refund.completed') {
      const refundId = data?.id;
      const txId = data?.tx_id;
      const refundStatus = (data?.status || '').toUpperCase();
      console.log(`[Flutterwave Webhook] Refund status '${refundStatus}' for refund id: ${refundId}, tx_id: ${txId}`);

      const refund = await queryOne<any>(
        'SELECT * FROM refunds WHERE provider_refund_id = ? OR payment_id IN (SELECT id FROM payments WHERE gateway_transaction_id = ?)',
        [String(refundId || ''), String(txId || '')]
      );

      if (refund && (refundStatus === 'COMPLETED' || refundStatus === 'SUCCESSFUL')) {
        await confirmRefundSuccess({
          refundId: refund.id,
          providerRefundId: String(refundId || ''),
          providerReference: data?.flw_ref,
        });
      }

      await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);
      return NextResponse.json({ message: 'Refund webhook acknowledged.' }, { status: 200 });
    }

    // =========================================================================
    // BRANCH 3: CHARGE COMPLETED (Client Collection Webhook)
    // =========================================================================
    if (event !== 'charge.completed' && data?.status !== 'successful') {
      await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);
      return NextResponse.json({ message: 'Event acknowledged (non-charge event).' }, { status: 200 });
    }

    const transactionId = data?.id;
    const txRef = data?.tx_ref;

    if (!transactionId || !txRef) {
      await execute("UPDATE webhook_events SET status = 'FAILED', error_message = 'Missing transaction id or tx_ref' WHERE id = ?", [webhookEventId]);
      return NextResponse.json({ error: 'Missing transaction id or tx_ref in webhook payload.' }, { status: 400 });
    }

    // 3. Authoritative Verification via Flutterwave API
    const verifyRes = await verifyFlutterwaveTransaction(transactionId);
    if (verifyRes.status !== 'success' || !verifyRes.data) {
      console.error(`[Flutterwave Webhook] API verification failed for transaction ID ${transactionId}:`, verifyRes.message);
      await execute("UPDATE webhook_events SET status = 'FAILED', error_message = 'Flutterwave API verification failed' WHERE id = ?", [webhookEventId]);
      return NextResponse.json({ error: 'Authoritative transaction verification failed.' }, { status: 400 });
    }

    const verifyData = verifyRes.data;
    if (verifyData.status?.toLowerCase() !== 'successful') {
      console.warn(`[Flutterwave Webhook] Transaction ${transactionId} status was '${verifyData.status}', not successful.`);
      await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);
      return NextResponse.json({ message: `Transaction verified with status '${verifyData.status}'. No state change needed.` }, { status: 200 });
    }

    // Resolve Invoice
    const existingPayment = await queryOne<any>(
      'SELECT * FROM payments WHERE gateway_transaction_id = ? OR reference = ?',
      [String(transactionId), txRef]
    );

    let invoiceId: string | null = null;
    if (existingPayment?.invoice_id) {
      invoiceId = existingPayment.invoice_id;
    } else {
      const match = txRef.match(/^CB-INV-([a-zA-Z0-9_-]+)-\d+$/);
      if (match) {
        invoiceId = match[1];
      } else {
        const invByNum = await queryOne<any>('SELECT id FROM invoices WHERE invoice_number = ?', [txRef]);
        if (invByNum) {
          invoiceId = invByNum.id;
        }
      }
    }

    if (!invoiceId) {
      console.error(`[Flutterwave Webhook] Could not resolve invoice ID for tx_ref: ${txRef}`);
      await execute("UPDATE webhook_events SET status = 'FAILED', error_message = 'Unresolvable invoice ID' WHERE id = ?", [webhookEventId]);
      return NextResponse.json({ error: 'Unresolvable invoice ID from tx_ref.' }, { status: 400 });
    }

    const invoice = await queryOne<any>('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    if (!invoice) {
      await execute("UPDATE webhook_events SET status = 'FAILED', error_message = 'Invoice not found' WHERE id = ?", [webhookEventId]);
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    // 4. Idempotency Protection: If already confirmed/paid, return HTTP 200 immediately
    if (existingPayment && ['CONFIRMED', 'SUCCESSFUL', 'VERIFIED', 'SETTLED'].includes(existingPayment.status)) {
      console.log(`[Flutterwave Webhook] Idempotent skip: Transaction ${transactionId} (tx_ref: ${txRef}) is already confirmed.`);
      await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);
      return NextResponse.json({ status: 'already_processed', message: 'Payment previously verified.' }, { status: 200 });
    }

    if (invoice.status === 'PAID') {
      console.log(`[Flutterwave Webhook] Idempotent skip: Invoice ${invoice.invoice_number} is already paid in full.`);
      await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);
      return NextResponse.json({ status: 'already_processed', message: 'Invoice already marked PAID.' }, { status: 200 });
    }

    // 5. Verification Integrity Checks: Currency & Amount Matching
    if (verifyData.currency.toUpperCase() !== invoice.currency.toUpperCase()) {
      console.error(`[Flutterwave Webhook] Currency mismatch: Invoice expects ${invoice.currency}, Flutterwave transaction was ${verifyData.currency}`);
      await execute("UPDATE webhook_events SET status = 'FAILED', error_message = 'Currency mismatch' WHERE id = ?", [webhookEventId]);
      return NextResponse.json({
        error: `Currency mismatch: Expected ${invoice.currency}, received ${verifyData.currency}.`,
      }, { status: 400 });
    }

    const verifiedAmountMinor = Math.round(Number(verifyData.amount) * 100);
    if (verifiedAmountMinor <= 0) {
      return NextResponse.json({ error: 'Invalid transaction amount.' }, { status: 400 });
    }

    const invoiceTotalMinor = Number(invoice.amount_minor);
    const previousPaidMinor = Number(invoice.amount_paid_minor || 0);
    const unpaidOutstandingMinor = invoiceTotalMinor - previousPaidMinor;

    // Reject overpayments safely
    if (verifiedAmountMinor > unpaidOutstandingMinor) {
      console.error(`[Flutterwave Webhook] Overpayment rejected: Paid amount (${verifiedAmountMinor} minor) exceeds remaining balance (${unpaidOutstandingMinor} minor) for invoice ${invoice.id}.`);
      await execute("UPDATE webhook_events SET status = 'FAILED', error_message = 'Overpayment rejected' WHERE id = ?", [webhookEventId]);
      return NextResponse.json({
        error: `Overpayment violation: Paid amount exceeds outstanding balance. Expected at most ${unpaidOutstandingMinor / 100} ${invoice.currency}.`,
      }, { status: 400 });
    }

    const newTotalPaidMinor = previousPaidMinor + verifiedAmountMinor;
    const remainingAfterThisMinor = Math.max(0, invoiceTotalMinor - newTotalPaidMinor);
    const isFullyPaid = newTotalPaidMinor >= invoiceTotalMinor;
    const newInvoiceStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    // Gateway Fee and Settlement calculations
    const gatewayFeeMinor = Math.round(Number(verifyData.app_fee || 0) * 100);
    const netAmountMinor = verifyData.amount_settled
      ? Math.round(Number(verifyData.amount_settled) * 100)
      : Math.max(0, verifiedAmountMinor - gatewayFeeMinor);

    // Hardened distinction: VERIFIED vs SETTLED
    const settlementStatus = verifyData.amount_settled ? 'SETTLED' : 'PENDING';
    const settlementCurrency = verifyData.currency;
    const settlementAmountMinor = verifyData.amount_settled ? Math.round(Number(verifyData.amount_settled) * 100) : null;

    let paymentMethod = 'FLUTTERWAVE';
    if (verifyData.payment_type) {
      const pt = verifyData.payment_type.toLowerCase();
      if (pt.includes('mpesa') || pt.includes('mobilemoney')) {
        paymentMethod = 'MPESA';
      } else if (pt.includes('card')) {
        paymentMethod = 'CARD';
      } else if (pt.includes('bank') || pt.includes('transfer')) {
        paymentMethod = 'BANK_TRANSFER';
      } else if (pt.includes('ussd')) {
        paymentMethod = 'USSD';
      } else {
        paymentMethod = verifyData.payment_type.toUpperCase();
      }
    } else if (invoice.currency === 'KES') {
      paymentMethod = 'MPESA';
    } else {
      paymentMethod = 'CARD';
    }

    const paymentId = existingPayment?.id || `pay_flw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    // 6. Atomic Database State Transition
    await transaction(async (tx) => {
      // (a) Upsert confirmed Payment record: payout_status is strictly RESERVED
      if (existingPayment) {
        await tx.execute(`
          UPDATE payments
          SET status = 'CONFIRMED',
              gateway = 'flutterwave',
              gateway_transaction_id = ?,
              gateway_reference = ?,
              payment_method = ?,
              gross_amount_minor = ?,
              gateway_fee_minor = ?,
              net_amount_minor = ?,
              settlement_status = ?,
              settlement_currency = ?,
              settlement_amount_minor = ?,
              payout_status = 'RESERVED',
              settlement_destination = 'Configured Flutterwave Merchant Settlement',
              metadata_json = ?,
              paid_at = ?,
              verified_at = ?,
              verified_by = 'system_flutterwave',
              verification_notes = 'Verified authoritatively via Flutterwave Webhook'
          WHERE id = ?
        `, [
          String(transactionId),
          txRef,
          paymentMethod,
          verifiedAmountMinor,
          gatewayFeeMinor,
          netAmountMinor,
          settlementStatus,
          settlementCurrency,
          settlementAmountMinor,
          JSON.stringify(verifyData),
          now,
          now,
          existingPayment.id,
        ]);
      } else {
        await tx.execute(`
          INSERT INTO payments (
            id, invoice_id, project_id, amount_minor, currency, payment_method,
            verification_source, status, reference, gateway, gateway_transaction_id,
            gateway_reference, gross_amount_minor, gateway_fee_minor, net_amount_minor,
            settlement_status, settlement_currency, settlement_amount_minor,
            settlement_destination, payout_status, metadata_json, paid_at, verified_at, verified_by,
            verification_notes, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, 'FLUTTERWAVE_WEBHOOK', 'CONFIRMED', ?, 'flutterwave', ?, ?, ?, ?, ?, ?, ?, ?, 'Configured Flutterwave Merchant Settlement', 'RESERVED', ?, ?, ?, 'system_flutterwave', 'Verified authoritatively via Flutterwave Webhook', datetime('now'))
        `, [
          paymentId,
          invoice.id,
          invoice.project_id,
          verifiedAmountMinor,
          invoice.currency,
          paymentMethod,
          txRef,
          String(transactionId),
          txRef,
          verifiedAmountMinor,
          gatewayFeeMinor,
          netAmountMinor,
          settlementStatus,
          settlementCurrency,
          settlementAmountMinor,
          JSON.stringify(verifyData),
          now,
          now,
        ]);
      }

      // (b) Update Invoice Balance and Status (PAID or PARTIALLY_PAID)
      await tx.execute(`
        UPDATE invoices
        SET amount_paid_minor = ?,
            status = ?,
            paid_at = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `, [
        newTotalPaidMinor,
        newInvoiceStatus,
        isFullyPaid ? now : invoice.paid_at,
        invoice.id,
      ]);

      // (c) Update Payment Schedule & Project Automation
      if (invoice.payment_schedule_id) {
        await tx.execute(`
          UPDATE payment_schedules
          SET status = ?,
              paid_at = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `, [isFullyPaid ? 'PAID' : 'PARTIALLY_PAID', now, invoice.payment_schedule_id]);

        const schedule = await tx.queryOne<any>('SELECT is_required_to_start FROM payment_schedules WHERE id = ?', [invoice.payment_schedule_id]);
        if (schedule?.is_required_to_start === 1) {
          const project = await tx.queryOne<any>('SELECT status FROM projects WHERE id = ?', [invoice.project_id]);
          if (project?.status === 'AWAITING_PAYMENT') {
            await tx.execute(`
              UPDATE projects
              SET status = 'IN_PROGRESS',
                  payment_status = ?,
                  started_at = COALESCE(started_at, ?),
                  updated_at = datetime('now')
              WHERE id = ?
            `, [isFullyPaid ? 'PAID' : 'PARTIALLY_PAID', now, invoice.project_id]);
          }
        }
      } else if (isFullyPaid) {
        const project = await tx.queryOne<any>('SELECT status FROM projects WHERE id = ?', [invoice.project_id]);
        if (project?.status === 'AWAITING_PAYMENT') {
          await tx.execute(`
            UPDATE projects
            SET status = 'IN_PROGRESS',
                payment_status = 'PAID',
                started_at = COALESCE(started_at, ?),
                updated_at = datetime('now')
            WHERE id = ?
          `, [now, invoice.project_id]);
        }
      }

      // (d) Record Immutable Double-Entry Ledger Entry: Debit GATEWAY_BALANCE, Credit CLIENT_FUNDS_LIABILITY
      await recordPaymentLedgerEntry(tx, {
        paymentId,
        invoiceId: invoice.id,
        projectId: invoice.project_id,
        clientId: invoice.client_id,
        salesRepId: invoice.representative_id || null,
        currency: invoice.currency,
        amountMinor: verifiedAmountMinor,
        reference: txRef,
      });

      // (e) Partner Commission Calculation: Preserves 20% rate; Payout in NOT_ELIGIBLE status (NO AUTO-DISBURSEMENT)
      const project = await tx.queryOne<any>('SELECT representative_id FROM projects WHERE id = ?', [invoice.project_id]);
      const repId = project?.representative_id || invoice.representative_id;

      if (repId) {
        await recordCommissionAndQueuePayout(tx, {
          invoice,
          paymentId,
          verifiedPaymentAmountMinor: verifiedAmountMinor,
          salesRepId: repId,
          gatewayTransactionId: transactionId,
        });
      }
    });

    // NOTE: Decoupled payout architecture: NO executeQueuedPayoutAsync is called here!
    // Payouts remain strictly locked in RESERVED / NOT_ELIGIBLE until milestone clearance.

    // 7. Audit Logging
    await recordAuditLog({
      userId: 'system_flutterwave',
      action: 'PAYMENT_VERIFIED',
      entity: 'payments',
      entityId: paymentId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        transactionId,
        txRef,
        verifiedAmountMinor,
        currency: invoice.currency,
        settlementStatus,
        paymentMethod,
        isFullyPaid,
        source: 'FLUTTERWAVE_WEBHOOK',
      },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    // 8. Mark webhook_events record as PROCESSED
    await execute("UPDATE webhook_events SET status = 'PROCESSED', processed_at = datetime('now') WHERE id = ?", [webhookEventId]);

    // 9. Automated Non-blocking Email and In-App Notification Dispatch
    try {
      const client = await queryOne<any>(`
        SELECT c.id, c.company_name, u.id as user_id, u.email, up.first_name, up.last_name
        FROM clients c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE c.id = ?
      `, [invoice.client_id]);

      if (client?.email) {
        const clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.company_name;
        await sendPaymentConfirmationNotification({
          recipientEmail: client.email,
          recipientName: clientName,
          recipientUserId: client.user_id,
          invoiceNumber: invoice.invoice_number,
          invoiceTitle: invoice.title,
          amountMinor: verifiedAmountMinor,
          currency: invoice.currency,
          paymentMethod,
          transactionReference: txRef,
          paidAt: now,
          isFullPayment: isFullyPaid,
          remainingMinor: remainingAfterThisMinor,
        });
      }
    } catch (notifErr: any) {
      console.error('[Flutterwave Webhook] Notification dispatch error (non-fatal):', notifErr.message);
    }

    console.log(`[Flutterwave Webhook] Successfully processed payment for invoice ${invoice.invoice_number}: ${invoice.currency} ${verifiedAmountMinor / 100} (${newInvoiceStatus}).`);
    return NextResponse.json({
      status: 'success',
      message: `Payment verified. Invoice status is now ${newInvoiceStatus}.`,
      invoiceStatus: newInvoiceStatus,
      amountPaidMinor: newTotalPaidMinor,
      remainingMinor: remainingAfterThisMinor,
    }, { status: 200 });
  } catch (err: any) {
    console.error('[Flutterwave Webhook] Fatal processing error:', err);
    if (webhookEventId) {
      await execute("UPDATE webhook_events SET status = 'FAILED', error_message = ? WHERE id = ?", [err.message || 'Fatal error', webhookEventId]).catch(() => {});
    }
    return NextResponse.json({ error: 'Webhook processing error.' }, { status: 500 });
  }
}
