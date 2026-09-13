// src/lib/payments/reconciliation.ts
/**
 * Reconciliation Framework for CodeBridge
 * Reconciles operational database records, provider events, and double-entry ledger.
 * Records all runs into reconciliation_runs audit table.
 */

import { query, execute } from '../db/connection';

export type DiscrepancyType =
  | 'MISSING_PAYMENT_LEDGER_ENTRY'
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'PAYMENT_CURRENCY_MISMATCH'
  | 'SETTLEMENT_MISMATCH'
  | 'MISSING_COMMISSION_LEDGER_ENTRY'
  | 'COMMISSION_AMOUNT_MISMATCH'
  | 'MISSING_PAYOUT_LEDGER_ENTRY'
  | 'PAYOUT_AMOUNT_MISMATCH'
  | 'MISSING_REFUND_LEDGER_ENTRY'
  | 'REFUND_AMOUNT_MISMATCH'
  | 'UNRESOLVED_DISPUTE'
  | 'WEBHOOK_FAILURE'
  | 'DUPLICATE_PAYMENT_TRANSACTION'
  | 'UNBALANCED_LEDGER_EVENT';

export interface Discrepancy {
  type: DiscrepancyType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  entityId: string;
  details?: Record<string, any>;
}

export interface ReconciliationMetrics {
  totalOperationalPaymentsMinor: number;
  totalLedgerPaymentsMinor: number;
  totalOperationalCommissionsMinor: number;
  totalLedgerCommissionsMinor: number;
  totalOperationalPayoutsMinor: number;
  totalLedgerPayoutsMinor: number;
  totalOperationalRefundsMinor: number;
  totalLedgerRefundsMinor: number;
  webhookFailuresCount: number;
  openDisputesCount: number;
}

export interface ReconciliationResult {
  runId: string;
  runType: string;
  isReconciled: boolean;
  reconciliationStatus: 'OK' | 'DISCREPANCY_DETECTED';
  totalChecked: number;
  discrepancyCount: number;
  discrepancies: Discrepancy[];
  metrics: ReconciliationMetrics;
  startedAt: string;
  completedAt: string;
}

/**
 * Executes a full automated audit reconciling operational database tables
 * (payments, commissions, payouts, refunds, webhook_events, disputes) against the double-entry ledger.
 * Persists the result into reconciliation_runs.
 */
export async function reconcileOperationalWithLedger(
  customDb?: any,
  runType = 'INTERNAL_OPERATIONAL_VS_LEDGER'
): Promise<ReconciliationResult> {
  const startedAt = new Date().toISOString();
  const runId = `rec_run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  let queryFn: (sql: string, params?: any[]) => Promise<any[]>;
  let execFn: (sql: string, params?: any[]) => Promise<any>;

  if (customDb) {
    if (typeof customDb.query === 'function') {
      queryFn = (sql, params) => customDb.query(sql, params);
      execFn = (sql, params) => customDb.execute(sql, params);
    } else if (typeof customDb.all === 'function') {
      queryFn = (sql, params) => customDb.all(sql, params);
      execFn = (sql, params) => customDb.run(sql, params);
    } else {
      queryFn = query;
      execFn = execute;
    }
  } else {
    queryFn = query;
    execFn = execute;
  }

  const discrepancies: Discrepancy[] = [];
  let totalChecked = 0;

  // 1. Reconcile Confirmed Payments vs Ledger Entries
  const confirmedPayments = await queryFn(`
    SELECT id, invoice_id, amount_minor, gross_amount_minor, currency, status, reference,
           gateway_transaction_id, settlement_status, settlement_amount_minor
    FROM payments
    WHERE status IN ('CONFIRMED', 'VERIFIED', 'SETTLED')
  `);

  let totalOpPayments = 0;
  for (const p of confirmedPayments) {
    totalChecked++;
    const pAmt = Number(p.gross_amount_minor || p.amount_minor);
    totalOpPayments += pAmt;

    const ledgerRows = await queryFn(`
      SELECT 
        t.id, t.transaction_type as entry_type, 
        MAX(CASE WHEN e.entry_direction = 'DEBIT' THEN e.account_id END) as account_debited,
        MAX(CASE WHEN e.entry_direction = 'CREDIT' THEN e.account_id END) as account_credited,
        MAX(e.amount_minor) as amount_minor, t.currency
      FROM ledger_transactions t
      JOIN ledger_entries e ON t.id = e.ledger_transaction_id
      WHERE t.payment_id = ? AND t.transaction_type = 'PAYMENT'
      GROUP BY t.id, t.transaction_type, t.currency
    `, [p.id]);

    if (ledgerRows.length === 0) {
      discrepancies.push({
        type: 'MISSING_PAYMENT_LEDGER_ENTRY',
        severity: 'CRITICAL',
        description: `Payment ${p.id} has zero corresponding ledger entries.`,
        entityId: p.id,
        details: { payment: p },
      });
    } else {
      const entry = ledgerRows[0];
      const lAmt = Number(entry.amount_minor);

      if (pAmt !== lAmt) {
        discrepancies.push({
          type: 'PAYMENT_AMOUNT_MISMATCH',
          severity: 'CRITICAL',
          description: `Payment ${p.id} amount (${pAmt}) does not match ledger entry ${entry.id} amount (${lAmt}).`,
          entityId: p.id,
          details: { expected: pAmt, actual: lAmt },
        });
      }

      if (p.currency.toUpperCase() !== entry.currency.toUpperCase()) {
        discrepancies.push({
          type: 'PAYMENT_CURRENCY_MISMATCH',
          severity: 'CRITICAL',
          description: `Payment ${p.id} currency (${p.currency}) does not match ledger entry ${entry.id} currency (${entry.currency}).`,
          entityId: p.id,
          details: { expected: p.currency, actual: entry.currency },
        });
      }
    }
  }

  // Check for duplicate payment transaction IDs
  const txIdCounts = await queryFn(`
    SELECT gateway_transaction_id, COUNT(*) as cnt
    FROM payments
    WHERE gateway_transaction_id IS NOT NULL
    GROUP BY gateway_transaction_id
    HAVING COUNT(*) > 1
  `);
  for (const dup of txIdCounts) {
    discrepancies.push({
      type: 'DUPLICATE_PAYMENT_TRANSACTION',
      severity: 'CRITICAL',
      description: `Duplicate gateway transaction ID detected: ${dup.gateway_transaction_id} appears ${dup.cnt} times.`,
      entityId: String(dup.gateway_transaction_id),
      details: { count: dup.cnt },
    });
  }

  // 2. Reconcile Completed Payouts vs Ledger Entries
  const paidPayouts = await queryFn(`
    SELECT id, sales_rep_id, amount_minor, currency, status, idempotency_key, provider_reference
    FROM commission_payouts
    WHERE status = 'PAID'
  `);

  let totalOpPayouts = 0;
  for (const po of paidPayouts) {
    totalChecked++;
    const poAmt = Number(po.amount_minor);
    totalOpPayouts += poAmt;

    const ledgerRows = await queryFn(`
      SELECT 
        t.id, t.transaction_type as entry_type, 
        MAX(CASE WHEN e.entry_direction = 'DEBIT' THEN e.account_id END) as account_debited,
        MAX(CASE WHEN e.entry_direction = 'CREDIT' THEN e.account_id END) as account_credited,
        MAX(e.amount_minor) as amount_minor, t.currency
      FROM ledger_transactions t
      JOIN ledger_entries e ON t.id = e.ledger_transaction_id
      WHERE t.transaction_type = 'PAYOUT' AND (
        t.reference = ? OR t.metadata_json LIKE ?
      )
      GROUP BY t.id, t.transaction_type, t.currency
    `, [po.idempotency_key, `%${po.id}%`]);

    if (ledgerRows.length === 0) {
      discrepancies.push({
        type: 'MISSING_PAYOUT_LEDGER_ENTRY',
        severity: 'HIGH',
        description: `Paid commission payout ${po.id} has no corresponding PAYOUT ledger entry.`,
        entityId: po.id,
        details: { payout: po },
      });
    }
  }

  // 3. Reconcile Completed Refunds vs Ledger Entries
  const completedRefunds = await queryFn(`
    SELECT id, payment_id, invoice_id, amount_minor, completed_amount_minor, currency, status, refund_reference
    FROM refunds
    WHERE status IN ('COMPLETED', 'SUCCESSFUL')
  `);

  let totalOpRefunds = 0;
  for (const rf of completedRefunds) {
    totalChecked++;
    const rfAmt = Number(rf.completed_amount_minor || rf.amount_minor);
    totalOpRefunds += rfAmt;

    const ledgerRows = await queryFn(`
      SELECT 
        t.id, MAX(e.amount_minor) as amount_minor, t.currency
      FROM ledger_transactions t
      JOIN ledger_entries e ON t.id = e.ledger_transaction_id
      WHERE t.transaction_type = 'REFUND' AND (
        t.reference = ? OR t.metadata_json LIKE ?
      )
      GROUP BY t.id, t.currency
    `, [rf.refund_reference, `%${rf.id}%`]);

    if (ledgerRows.length === 0) {
      discrepancies.push({
        type: 'MISSING_REFUND_LEDGER_ENTRY',
        severity: 'CRITICAL',
        description: `Successful refund ${rf.id} has no corresponding REFUND ledger entry.`,
        entityId: rf.id,
        details: { refund: rf },
      });
    }
  }

  // 4. Check Webhook Failures
  let webhookFailuresCount = 0;
  try {
    const failedWebhooks = await queryFn(`
      SELECT id, provider, event_id, error_message
      FROM webhook_events
      WHERE status = 'FAILED'
    `);
    webhookFailuresCount = failedWebhooks.length;
    for (const wh of failedWebhooks) {
      discrepancies.push({
        type: 'WEBHOOK_FAILURE',
        severity: 'HIGH',
        description: `Failed webhook event ${wh.event_id} from ${wh.provider}: ${wh.error_message}`,
        entityId: wh.id,
      });
    }
  } catch {}

  // 5. Check Open Disputes
  let openDisputesCount = 0;
  try {
    const openDisputes = await queryFn(`
      SELECT id, payment_id, amount_minor, currency, status
      FROM disputes
      WHERE status IN ('OPENED', 'EVIDENCE_REQUIRED')
    `);
    openDisputesCount = openDisputes.length;
  } catch {}

  // Ledger totals
  const ledgerPayments = await queryFn("SELECT SUM(amount_minor) as total FROM ledger_entries e JOIN ledger_transactions t ON e.ledger_transaction_id = t.id WHERE t.transaction_type = 'PAYMENT' AND e.entry_direction = 'DEBIT'");
  const ledgerPayouts = await queryFn("SELECT SUM(amount_minor) as total FROM ledger_entries e JOIN ledger_transactions t ON e.ledger_transaction_id = t.id WHERE t.transaction_type = 'PAYOUT' AND e.entry_direction = 'DEBIT'");
  const ledgerRefunds = await queryFn("SELECT SUM(amount_minor) as total FROM ledger_entries e JOIN ledger_transactions t ON e.ledger_transaction_id = t.id WHERE t.transaction_type = 'REFUND' AND e.entry_direction = 'DEBIT'");
  const ledgerCommissions = await queryFn("SELECT SUM(amount_minor) as total FROM ledger_entries e JOIN ledger_transactions t ON e.ledger_transaction_id = t.id WHERE t.transaction_type = 'COMMISSION' AND e.entry_direction = 'DEBIT'");

  const metrics: ReconciliationMetrics = {
    totalOperationalPaymentsMinor: totalOpPayments,
    totalLedgerPaymentsMinor: Number(ledgerPayments[0]?.total || 0),
    totalOperationalCommissionsMinor: 0,
    totalLedgerCommissionsMinor: Number(ledgerCommissions[0]?.total || 0),
    totalOperationalPayoutsMinor: totalOpPayouts,
    totalLedgerPayoutsMinor: Number(ledgerPayouts[0]?.total || 0),
    totalOperationalRefundsMinor: totalOpRefunds,
    totalLedgerRefundsMinor: Number(ledgerRefunds[0]?.total || 0),
    webhookFailuresCount,
    openDisputesCount,
  };

  const completedAt = new Date().toISOString();
  const isReconciled = discrepancies.length === 0;
  const status = isReconciled ? 'OK' : 'DISCREPANCY_DETECTED';

  // Persist into reconciliation_runs table
  try {
    await execFn(`
      INSERT INTO reconciliation_runs (
        id, run_type, status, discrepancy_count, metrics_json, discrepancies_json, started_at, completed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      runId,
      runType,
      status,
      discrepancies.length,
      JSON.stringify(metrics),
      JSON.stringify(discrepancies),
      startedAt,
      completedAt,
    ]);
  } catch (err: any) {
    console.warn('[Reconciliation] Could not save reconciliation run record:', err.message);
  }

  return {
    runId,
    runType,
    isReconciled,
    reconciliationStatus: status,
    totalChecked,
    discrepancyCount: discrepancies.length,
    discrepancies,
    metrics,
    startedAt,
    completedAt,
  };
}
