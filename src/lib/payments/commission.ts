// src/lib/payments/commission.ts
import { DbExecutor, recordCommissionAccrualLedgerEntry, recordPayoutSuccessLedgerEntry, recordRecoveryOffsetLedgerEntry } from './ledger';
import { initiateFlutterwaveTransfer, verifyFlutterwaveTransfer } from './flutterwave';
import { query, queryOne, execute, transaction } from '../db/connection';

export interface CommissionCalculationResult {
  eligibleServiceMinor: number;
  rateBps: number;
  commissionAmountMinor: number;
  cumulativePreviousMinor: number;
  maxTotalCommissionMinor: number;
}

/**
 * Calculates sales commission strictly based on CODEBRIDGE_SERVICE revenue,
 * excluding third-party fees ($25 Google, $99 Apple, cloud infrastructure, SMS) and reimbursable expenses.
 * Uses deterministic Math.floor and caps cumulative partial payment commission.
 */
export async function calculateCommissionForPayment(
  db: DbExecutor,
  params: {
    invoice: any;
    verifiedPaymentAmountMinor: number;
    rateBps: number;
  }
): Promise<CommissionCalculationResult> {
  const { invoice, verifiedPaymentAmountMinor, rateBps } = params;
  const invoiceTotalMinor = Number(invoice.amount_minor);

  // 1. Determine eligible CodeBridge Service Revenue
  let eligibleServiceTotalMinor = invoiceTotalMinor;

  if (invoice.codebridge_amount_minor && Number(invoice.codebridge_amount_minor) > 0) {
    eligibleServiceTotalMinor = Number(invoice.codebridge_amount_minor);
  } else if (invoice.line_items_json) {
    try {
      const items = JSON.parse(invoice.line_items_json);
      if (Array.isArray(items) && items.length > 0) {
        let serviceSum = 0;
        let hasItemTypes = false;
        for (const it of items) {
          const itemType = it.item_type || it.itemType;
          if (itemType) {
            hasItemTypes = true;
            if (itemType === 'CODEBRIDGE_SERVICE') {
              serviceSum += Number(it.amount_minor || (it.amount ? Math.floor(it.amount * 100) : 0));
            }
          }
        }
        if (hasItemTypes) {
          eligibleServiceTotalMinor = serviceSum;
        }
      }
    } catch (e) {
      // Fallback to invoice.codebridge_amount_minor or invoiceTotalMinor
    }
  }

  // 2. Maximum possible commission on this invoice
  const maxTotalCommissionMinor = Math.floor((eligibleServiceTotalMinor * rateBps) / 10000);

  // 3. Cumulative commission previously accrued on this invoice
  const previousEvents = await db.query<any>(`
    SELECT calculated_commission_amount_minor
    FROM commission_events
    WHERE invoice_id = ? AND status != 'CANCELLED'
  `, [invoice.id]);

  let cumulativePreviousMinor = 0;
  for (const ev of previousEvents) {
    cumulativePreviousMinor += Number(ev.calculated_commission_amount_minor);
  }

  // 4. Prorate for this payment
  const paymentRatio = verifiedPaymentAmountMinor / invoiceTotalMinor;
  const eligibleForThisPayment = Math.floor(eligibleServiceTotalMinor * Math.min(1, paymentRatio));
  const rawCommissionMinor = Math.floor((eligibleForThisPayment * rateBps) / 10000);

  // Cap so total commission does not exceed max total commission
  const remainingAllowance = Math.max(0, maxTotalCommissionMinor - cumulativePreviousMinor);
  const finalCommissionAmountMinor = Math.min(rawCommissionMinor, remainingAllowance);

  return {
    eligibleServiceMinor: eligibleForThisPayment,
    rateBps,
    commissionAmountMinor: finalCommissionAmountMinor,
    cumulativePreviousMinor,
    maxTotalCommissionMinor,
  };
}

/**
 * Transactional creation of commission, ledger accrual, recovery balance offset,
 * and queued payout record.
 * Does NOT call external APIs inside this database transaction!
 */
export async function recordCommissionAndQueuePayout(
  tx: DbExecutor,
  params: {
    invoice: any;
    paymentId: string;
    verifiedPaymentAmountMinor: number;
    salesRepId: string;
    gatewayTransactionId: string | number;
  }
): Promise<{
  commissionId: string | null;
  payoutId: string | null;
  commissionAmountMinor: number;
  payableAmountMinor: number;
  offsetAmountMinor: number;
}> {
  const { invoice, paymentId, verifiedPaymentAmountMinor, salesRepId, gatewayTransactionId } = params;

  // 1. Fetch Representative Profile & Payout Settings
  const rep = await tx.queryOne<any>(`
    SELECT r.id, r.user_id, r.commission_rate_bps, r.payout_currency, r.payout_method,
           r.payout_destination, r.payout_bank_code, r.payout_account_name,
           t.currency as territory_currency, t.default_payout_method
    FROM representatives r
    LEFT JOIN territories t ON r.territory_id = t.id
    WHERE r.id = ?
  `, [salesRepId]);

  if (!rep) {
    console.warn(`[Commission Engine] Representative ${salesRepId} not found.`);
    return { commissionId: null, payoutId: null, commissionAmountMinor: 0, payableAmountMinor: 0, offsetAmountMinor: 0 };
  }

  const rateBps = Number(rep.commission_rate_bps || 2000); // 20% default

  // 2. Calculate Commission using Math.floor
  const calc = await calculateCommissionForPayment(tx, {
    invoice,
    verifiedPaymentAmountMinor,
    rateBps,
  });

  if (calc.commissionAmountMinor <= 0) {
    return { commissionId: null, payoutId: null, commissionAmountMinor: 0, payableAmountMinor: 0, offsetAmountMinor: 0 };
  }

  const commissionId = `comm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const idempotencyKey = `COMMISSION_FLW_${gatewayTransactionId}`;

  // Check idempotency for commission event
  const existingEvent = await tx.queryOne<any>('SELECT id FROM commission_events WHERE idempotency_key = ?', [idempotencyKey]);
  if (existingEvent) {
    console.log(`[Commission Engine] Commission event already recorded for key ${idempotencyKey}.`);
    return { commissionId: null, payoutId: null, commissionAmountMinor: 0, payableAmountMinor: 0, offsetAmountMinor: 0 };
  }

  // (a) Record Commission Event (Immutable fact)
  await tx.execute(`
    INSERT INTO commission_events (
      id, payment_id, invoice_id, project_id, proposal_id, representative_id,
      currency, verified_amount_minor, commission_rate_bps_at_time_of_payment,
      calculated_commission_amount_minor, verified_at, idempotency_key, status, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 'RECORDED', datetime('now'))
  `, [
    `cev_${commissionId}`,
    paymentId,
    invoice.id,
    invoice.project_id,
    invoice.proposal_id || null,
    salesRepId,
    invoice.currency,
    calc.eligibleServiceMinor,
    rateBps,
    calc.commissionAmountMinor,
    idempotencyKey,
  ]);

  // (b) Record Commissions Master Table
  await tx.execute(`
    INSERT INTO commissions (
      id, project_id, representative_id, rate_bps, base_amount_minor,
      commission_amount_minor, currency, status, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'), datetime('now'))
  `, [
    commissionId,
    invoice.project_id,
    salesRepId,
    rateBps,
    calc.eligibleServiceMinor,
    calc.commissionAmountMinor,
    invoice.currency,
  ]);

  // (c) Record Double-Entry Ledger Entry: Debit COMMISSION_EXPENSE, Credit COMMISSION_PAYABLE
  await recordCommissionAccrualLedgerEntry(tx, {
    commissionId,
    salesRepId,
    paymentId,
    invoiceId: invoice.id,
    projectId: invoice.project_id,
    clientId: invoice.client_id,
    currency: invoice.currency,
    amountMinor: calc.commissionAmountMinor,
    rateBps,
    reference: `COMM-${invoice.invoice_number || invoice.id}`,
  });

  // (d) Recovery Balance Offset Check: Check if Representative has outstanding recovery obligations
  const pendingRecoveries = await tx.query<any>(`
    SELECT id, amount_minor
    FROM commission_adjustments
    WHERE sales_rep_id = ? AND recovery_status = 'RECOVERY_PENDING'
    ORDER BY created_at ASC
  `, [salesRepId]);

  let totalRecoveryOwed = 0;
  for (const rec of pendingRecoveries) {
    totalRecoveryOwed += Number(rec.amount_minor);
  }

  const offsetAmountMinor = Math.min(calc.commissionAmountMinor, totalRecoveryOwed);
  const payableAmountMinor = calc.commissionAmountMinor - offsetAmountMinor;

  if (offsetAmountMinor > 0) {
    // Record explicit recovery offset adjustment
    await tx.execute(`
      INSERT INTO commission_adjustments (
        id, sales_rep_id, commission_id, adjustment_type, currency,
        amount_minor, recovery_status, notes, created_at
      )
      VALUES (?, ?, ?, 'RECOVERY_OFFSET', ?, ?, 'RECOVERED', ?, datetime('now'))
    `, [
      `adj_off_${Date.now()}`,
      salesRepId,
      commissionId,
      invoice.currency,
      offsetAmountMinor,
      `Offsetting recovery balance of ${offsetAmountMinor / 100} against new commission ${commissionId}`,
    ]);

    // Record Double-Entry Ledger: Debit COMMISSION_PAYABLE, Credit RECOVERY_RECEIVABLE
    await recordRecoveryOffsetLedgerEntry(tx, {
      salesRepId,
      newCommissionId: commissionId,
      currency: invoice.currency,
      amountMinor: offsetAmountMinor,
      reference: `REC-OFFSET-${commissionId}`,
      notes: `Recovery offset against commission ${commissionId}`,
    });

    // Mark completed recoveries
    let remainingToClear = offsetAmountMinor;
    for (const rec of pendingRecoveries) {
      if (remainingToClear <= 0) break;
      const recAmt = Number(rec.amount_minor);
      if (remainingToClear >= recAmt) {
        await tx.execute("UPDATE commission_adjustments SET recovery_status = 'RECOVERED' WHERE id = ?", [rec.id]);
        remainingToClear -= recAmt;
      }
    }
  }

    // (e) If remaining net payable > 0, Record Commission Payout in NOT_ELIGIBLE status (Funds remain reserved!)
  let payoutId: string | null = null;
  if (payableAmountMinor > 0) {
    payoutId = `payout_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const payoutIdempotencyKey = `CB-PAYOUT-${commissionId}-ATT-1`;
    const payoutCurrency = rep.payout_currency || rep.territory_currency || invoice.currency;
    const payoutMethod = rep.payout_method || rep.default_payout_method || (payoutCurrency === 'KES' ? 'MPESA' : 'BANK');
    const payoutDest = rep.payout_destination || '254700000000';
    const metadataJson = JSON.stringify({
      basis: 'CODEBRIDGE_SERVICE_GROSS',
      rateBps,
      basisSnapshotMinor: calc.eligibleServiceMinor,
    });

    await tx.execute(`
      INSERT INTO commission_payouts (
        id, sales_rep_id, commission_id, currency, amount_minor,
        payout_method, payout_destination, status, idempotency_key,
        provider, retry_count, metadata_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'NOT_ELIGIBLE', ?, 'flutterwave', 0, ?, datetime('now'), datetime('now'))
    `, [
      payoutId,
      salesRepId,
      commissionId,
      payoutCurrency,
      payableAmountMinor,
      payoutMethod,
      payoutDest,
      payoutIdempotencyKey,
      metadataJson,
    ]);
  }

  return {
    commissionId,
    payoutId,
    commissionAmountMinor: calc.commissionAmountMinor,
    payableAmountMinor,
    offsetAmountMinor,
  };
}

/**
 * Asynchronously processes a queued commission payout via Flutterwave Transfer API.
 * Runs completely OUTSIDE the payment confirmation database transaction!
 */
export async function executeQueuedPayoutAsync(
  payoutId: string
): Promise<{ success: boolean; status: string; message?: string }> {
  try {
    const payout = await queryOne<any>(`
      SELECT cp.*, r.payout_bank_code, r.payout_account_name, r.referral_code
      FROM commission_payouts cp
      JOIN representatives r ON cp.sales_rep_id = r.id
      WHERE cp.id = ?
    `, [payoutId]);

    if (!payout) {
      return { success: false, status: 'NOT_FOUND', message: 'Payout record not found.' };
    }

    if (payout.status === 'PAID') {
      return { success: true, status: 'PAID', message: 'Payout already completed.' };
    }

    if (payout.status === 'NOT_ELIGIBLE') {
      return {
        success: false,
        status: 'NOT_ELIGIBLE',
        message: 'Payout is NOT_ELIGIBLE for disbursement. Milestone completion and hold period clearance required.',
      };
    }

    // Deterministic provider reference
    const transferRef = payout.idempotency_key;
    const majorAmount = Number(payout.amount_minor) / 100;
    const bankCode = payout.payout_bank_code || (payout.payout_method === 'MPESA' ? 'MPS' : '044');

    // Mark PROCESSING in DB before calling external provider
    await execute("UPDATE commission_payouts SET status = 'PROCESSING', updated_at = datetime('now') WHERE id = ?", [payoutId]);

    // Call Flutterwave Transfer API
    const transferResult = await initiateFlutterwaveTransfer({
      accountBank: bankCode,
      accountNumber: payout.payout_destination,
      amount: majorAmount,
      narration: `CodeBridge Commission - Payout ${payout.id}`,
      currency: payout.currency,
      reference: transferRef,
    });

    if (!transferResult.success) {
      const newStatus = transferResult.status === 'ACTION_REQUIRED' ? 'ACTION_REQUIRED' : 'FAILED';
      await execute(`
        UPDATE commission_payouts
        SET status = ?,
            failure_reason = ?,
            retry_count = retry_count + 1,
            last_attempt_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `, [newStatus, transferResult.message || 'Transfer initiation failed', payoutId]);

      return { success: false, status: newStatus, message: transferResult.message };
    }

    // Transfer initiated/accepted by Flutterwave
    const isInstantSuccess = transferResult.status === 'SUCCESSFUL';
    const finalStatus = isInstantSuccess ? 'PAID' : 'PROCESSING';

    await transaction(async (tx) => {
      await tx.execute(`
        UPDATE commission_payouts
        SET status = ?,
            provider_transfer_id = ?,
            provider_reference = ?,
            paid_at = CASE WHEN ? = 'PAID' THEN datetime('now') ELSE paid_at END,
            last_attempt_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `, [finalStatus, String(transferResult.transferId || ''), transferResult.reference, finalStatus, payoutId]);

      if (isInstantSuccess) {
        // Mark Commission Master Table as PAID
        if (payout.commission_id) {
          await tx.execute("UPDATE commissions SET status = 'PAID', updated_at = datetime('now') WHERE id = ?", [payout.commission_id]);
        }

        // Record Double-Entry Ledger: Debit COMMISSION_PAYABLE, Credit BUSINESS_CASH
        await recordPayoutSuccessLedgerEntry(tx, {
          payoutId,
          salesRepId: payout.sales_rep_id,
          currency: payout.currency,
          amountMinor: Number(payout.amount_minor),
          reference: transferRef,
          providerTransferId: String(transferResult.transferId || ''),
        });
      }
    });

    return { success: true, status: finalStatus, message: transferResult.message };
  } catch (err: any) {
    console.error('[Async Payout Error]', err);
    return { success: false, status: 'FAILED', message: err.message };
  }
}
