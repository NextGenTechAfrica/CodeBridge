// src/app/api/payments/flutterwave/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession, recordAuditLog } from '@/lib/auth/session';
import { queryOne, execute } from '@/lib/db/connection';
import { generateFlutterwaveReference, initiateFlutterwaveCheckout } from '@/lib/payments/flutterwave';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required.' }, { status: 400 });
    }

    // 1. Authoritative Invoice Lookup
    const invoice = await queryOne<any>('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    // 2. Strict RBAC & Ownership Verification
    if (session.role === 'CLIENT') {
      const client = await queryOne<any>('SELECT id FROM clients WHERE user_id = ?', [session.userId]);
      if (!client || client.id !== invoice.client_id) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot initiate payment for an invoice belonging to another client.' },
          { status: 403 }
        );
      }
    } else if (!['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 });
    }

    // 3. Status & Balance Verification (Never trust client-side amounts)
    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice has already been paid in full.' }, { status: 400 });
    }
    if (invoice.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot pay a cancelled invoice.' }, { status: 400 });
    }

    const cleanInvoiceAmountMinor = Number(invoice.amount_minor);
    const cleanInvoiceAmountPaidMinor = Number(invoice.amount_paid_minor || 0);
    const unpaidBalanceMinor = cleanInvoiceAmountMinor - cleanInvoiceAmountPaidMinor;

    if (unpaidBalanceMinor <= 0) {
      return NextResponse.json({ error: 'Invoice has zero outstanding balance.' }, { status: 400 });
    }

    // 4. Fetch Client & Contact Details
    const clientRecord = await queryOne<any>(`
      SELECT c.company_name, u.email, up.first_name, up.last_name, up.phone
      FROM clients c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.id = ?
    `, [invoice.client_id]);

    const customerEmail = clientRecord?.email || session.email;
    const customerName = clientRecord
      ? `${clientRecord.first_name || ''} ${clientRecord.last_name || ''}`.trim() || clientRecord.company_name
      : 'CodeBridge Client';
    const customerPhone = clientRecord?.phone || undefined;

    // 5. Generate Unique Idempotent Reference
    const txRef = generateFlutterwaveReference(invoice.id);

    // 6. Base URL resolution for redirect
    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
    const host = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (host && host.includes('localhost') ? 'http' : 'https');
    const hostBaseUrl = host ? `${proto}://${host}` : 'https://code-bridge-rosy.vercel.app';
    const appBaseUrl = envAppUrl || (hostBaseUrl.includes('localhost') ? hostBaseUrl : 'https://code-bridge-rosy.vercel.app');
    const redirectUrl = `${appBaseUrl}/dashboard/client/payment/verify?invoice_id=${encodeURIComponent(invoice.id)}&tx_ref=${encodeURIComponent(txRef)}`;

    // 7. Call Flutterwave Standard Checkout API
    const checkoutResult = await initiateFlutterwaveCheckout({
      txRef,
      amountMinor: unpaidBalanceMinor,
      currency: invoice.currency,
      redirectUrl,
      customer: {
        email: customerEmail,
        name: customerName,
        phoneNumber: customerPhone,
      },
      customizations: {
        title: `CodeBridge - Invoice ${invoice.invoice_number}`,
        description: `Payment of ${invoice.currency} ${(unpaidBalanceMinor / 100).toLocaleString()} for ${invoice.title}`,
        logo: `${appBaseUrl}/codebridge-logo.png`,
      },
      meta: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        project_id: invoice.project_id,
        client_id: invoice.client_id,
        user_id: session.userId,
      },
    });

    // 8. Idempotently record initial PENDING payment in database
    const paymentId = `pay_flw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    await execute(`
      INSERT INTO payments (
        id, invoice_id, project_id, amount_minor, currency, payment_method,
        verification_source, status, reference, gateway, gateway_reference,
        gross_amount_minor, verified_at, verified_by, verification_notes, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'FLUTTERWAVE_WEBHOOK', 'PENDING', ?, 'flutterwave', ?, ?, ?, ?, ?, datetime('now'))
    `, [
      paymentId,
      invoice.id,
      invoice.project_id,
      unpaidBalanceMinor,
      invoice.currency,
      invoice.currency === 'KES' ? 'MPESA' : 'FLUTTERWAVE',
      txRef,
      txRef,
      unpaidBalanceMinor,
      now,
      session.userId,
      `Flutterwave checkout initiated (${checkoutResult.isSimulated ? 'Simulated' : 'Live'})`,
    ]);

    // 9. Record Audit Log
    await recordAuditLog({
      userId: session.userId,
      action: 'PAYMENT_CREATED',
      entity: 'payments',
      entityId: paymentId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        txRef,
        amountMinor: unpaidBalanceMinor,
        currency: invoice.currency,
        isSimulated: checkoutResult.isSimulated || false,
      },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutResult.checkoutUrl,
      txRef,
      currency: invoice.currency,
      amountMinor: unpaidBalanceMinor,
    });
  } catch (err: any) {
    console.error('Failed to initiate Flutterwave checkout:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initiate payment gateway checkout.' },
      { status: 500 }
    );
  }
}
