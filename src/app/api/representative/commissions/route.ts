// src/app/api/representative/commissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db/connection';
import { deriveRepFinancialSummary } from '@/lib/payments/ledger';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Locate representative profile with territory country details
    const rep = await queryOne<any>(`
      SELECT r.*, c.code as country_code, c.name as country_name, c.currency as country_currency
      FROM representatives r
      LEFT JOIN countries c ON r.country_id = c.id
      WHERE r.user_id = ?
    `, [session.userId]);

    if (!rep) {
      return NextResponse.json({ error: 'Sales representative profile not found.' }, { status: 404 });
    }

    const isNigeria = rep.country_code === 'NG' || rep.country_id === 'c_ng';
    const repCurrency = isNigeria ? 'NGN' : (rep.country_currency || rep.payout_currency || 'KES');
    const repMethod = rep.payout_method || (isNigeria ? 'BANK_TRANSFER' : 'MPESA');

    // 1. Authoritative financial summary derived directly from immutable ledger
    const rawSummary = await deriveRepFinancialSummary(rep.id);
    const summary = {
      ...rawSummary,
      currency: repCurrency,
    };

    // 2. Commission events
    const commissionEvents = await query<any>(`
      SELECT ce.*, i.invoice_number, i.title as invoice_title
      FROM commission_events ce
      LEFT JOIN invoices i ON ce.invoice_id = i.id
      WHERE ce.representative_id = ?
      ORDER BY ce.created_at DESC
    `, [rep.id]);

    // 3. Commission payouts
    const payouts = await query<any>(`
      SELECT cp.*, c.rate_bps
      FROM commission_payouts cp
      LEFT JOIN commissions c ON cp.commission_id = c.id
      WHERE cp.sales_rep_id = ?
      ORDER BY cp.created_at DESC
    `, [rep.id]);

    // 4. Commission adjustments / recoveries
    const adjustments = await query<any>(`
      SELECT ca.*, r.refund_reference
      FROM commission_adjustments ca
      LEFT JOIN refunds r ON ca.refund_id = r.id
      WHERE ca.sales_rep_id = ?
      ORDER BY ca.created_at DESC
    `, [rep.id]);

    // 5. Recent ledger entries
    const ledger = await query<any>(`
      SELECT *
      FROM ledger_entries
      WHERE sales_rep_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [rep.id]);

    return NextResponse.json({
      summary,
      commissionEvents,
      payouts,
      adjustments,
      ledger,
      payoutSettings: {
        currency: repCurrency,
        method: repMethod,
        destination: rep.payout_destination || '',
        bankCode: rep.payout_bank_code || (isNigeria ? 'NG_BANK' : 'MPS'),
        accountName: rep.payout_account_name || '',
        referralCode: rep.referral_code || (isNigeria ? 'NGA-001' : 'KEN-001'),
      },
    }, { status: 200 });
  } catch (err: any) {
    console.error('[Representative Commissions API Error]', err);
    return NextResponse.json({ error: 'Failed to retrieve commission records.' }, { status: 500 });
  }
}
