// src/lib/payments/ledger.ts
import type { LedgerEntry, LedgerEntryType, DoubleEntryAccount } from '../db/types';
import { query } from '../db/connection';

export interface DbExecutor {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid?: number | bigint }>;
}

export interface RecordEntryParams {
  entryType: LedgerEntryType;
  accountDebited: DoubleEntryAccount | string;
  accountCredited: DoubleEntryAccount | string;
  currency: string;
  amountMinor: number;
  invoiceId?: string | null;
  paymentId?: string | null;
  salesRepId?: string | null;
  projectId?: string | null;
  clientId?: string | null;
  reference: string;
  notes?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Validates and records an immutable double-entry ledger record.
 * This table is strictly append-only. Zero UPDATE or DELETE operations are permitted.
 * Every ledger transaction strictly balances: Debits = Credits.
 */
export async function recordDoubleEntry(
  db: DbExecutor,
  params: RecordEntryParams
): Promise<LedgerEntry> {
  const amountMinor = Math.floor(params.amountMinor);

  if (amountMinor <= 0) {
    throw new Error(`[Financial Ledger Error] Invalid amount: ${params.amountMinor}. Ledger entries must be positive integer minor units.`);
  }

  if (!params.accountDebited || !params.accountCredited) {
    throw new Error('[Financial Ledger Error] Both accountDebited and accountCredited are mandatory for double-entry records.');
  }

  if (params.accountDebited === params.accountCredited) {
    throw new Error(`[Financial Ledger Error] Circular booking violation: account ${params.accountDebited} cannot be debited and credited simultaneously.`);
  }

  if (!params.currency) {
    throw new Error('[Financial Ledger Error] Currency code is mandatory.');
  }

  if (!params.reference) {
    throw new Error('[Financial Ledger Error] Reference is mandatory for audit traceability.');
  }

  const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const debitId = `ent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_d`;
  const creditId = `ent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_c`;
  const metadataJson = params.metadata ? JSON.stringify(params.metadata) : null;
  const currency = params.currency.toUpperCase();

  await db.execute(`
    INSERT INTO ledger_transactions (
      id, transaction_type, currency, reference, invoice_id, payment_id,
      sales_rep_id, project_id, client_id, notes, metadata_json, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `, [
    txId,
    params.entryType,
    currency,
    params.reference,
    params.invoiceId || null,
    params.paymentId || null,
    params.salesRepId || null,
    params.projectId || null,
    params.clientId || null,
    params.notes || null,
    metadataJson,
  ]);

  await db.execute(`
    INSERT INTO ledger_entries (
      id, ledger_transaction_id, account_id, entry_direction, amount_minor, created_at
    )
    VALUES 
    (?, ?, ?, 'DEBIT', ?, datetime('now')),
    (?, ?, ?, 'CREDIT', ?, datetime('now'))
  `, [
    debitId, txId, params.accountDebited, amountMinor,
    creditId, txId, params.accountCredited, amountMinor
  ]);

  return {
    id: txId,
    entry_type: params.entryType,
    account_debited: params.accountDebited,
    account_credited: params.accountCredited,
    currency,
    amount_minor: amountMinor,
    invoice_id: params.invoiceId || null,
    payment_id: params.paymentId || null,
    sales_rep_id: params.salesRepId || null,
    project_id: params.projectId || null,
    client_id: params.clientId || null,
    reference: params.reference,
    notes: params.notes || null,
    metadata_json: metadataJson,
    created_at: new Date().toISOString(),
  };
}

/**
 * Multi-leg balanced ledger transaction.
 * Verifies that sum of debits = sum of credits across each currency book before writing.
 */
export async function recordBalancedTransaction(
  db: DbExecutor,
  params: {
    reference: string;
    notes?: string;
    legs: Array<{
      entryType: LedgerEntryType;
      accountDebited: DoubleEntryAccount | string;
      accountCredited: DoubleEntryAccount | string;
      currency: string;
      amountMinor: number;
      invoiceId?: string | null;
      paymentId?: string | null;
      salesRepId?: string | null;
      projectId?: string | null;
      clientId?: string | null;
      metadata?: Record<string, any> | null;
    }>;
  }
): Promise<LedgerEntry[]> {
  if (!params.legs || params.legs.length === 0) {
    throw new Error('[Financial Ledger Error] Transaction must contain at least one balanced leg.');
  }

  // Validate currency balance across legs
  const balanceCheck: Record<string, { debits: number; credits: number }> = {};
  for (const leg of params.legs) {
    const cur = leg.currency.toUpperCase();
    if (!balanceCheck[cur]) {
      balanceCheck[cur] = { debits: 0, credits: 0 };
    }
    const amt = Math.floor(leg.amountMinor);
    if (amt <= 0) {
      throw new Error(`[Financial Ledger Error] Non-positive amount in ledger leg: ${leg.amountMinor}`);
    }
    balanceCheck[cur].debits += amt;
    balanceCheck[cur].credits += amt;
  }

  for (const [cur, totals] of Object.entries(balanceCheck)) {
    if (totals.debits !== totals.credits) {
      throw new Error(
        `[Financial Ledger Error] Imbalanced transaction in currency ${cur}: Debits (${totals.debits}) != Credits (${totals.credits})`
      );
    }
  }

  const results: LedgerEntry[] = [];
  for (const leg of params.legs) {
    const entry = await recordDoubleEntry(db, {
      ...leg,
      reference: params.reference,
      notes: params.notes || leg.entryType,
    });
    results.push(entry);
  }

  return results;
}

/**
 * Standard Double-Entry Event: Client Payment Confirmed
 * Debit: GATEWAY_[KES|NGN]_BALANCE (+Asset cash at gateway)
 * Credit: CLIENT_FUNDS_LIABILITY (+Liability unearned client funds)
 * Crucial: Does NOT credit CLIENT_RECEIVABLE as paid cash, and does NOT recognize immediate revenue.
 */
export async function recordPaymentLedgerEntry(
  db: DbExecutor,
  params: {
    paymentId: string;
    invoiceId: string;
    projectId?: string | null;
    clientId?: string | null;
    salesRepId?: string | null;
    currency: string;
    amountMinor: number;
    reference: string;
    notes?: string;
  }
): Promise<LedgerEntry> {
  const currency = params.currency.toUpperCase();
  const gatewayAccount: DoubleEntryAccount =
    currency === 'KES' ? 'GATEWAY_KES_BALANCE' : 'GATEWAY_NGN_BALANCE';

  return recordDoubleEntry(db, {
    entryType: 'PAYMENT',
    accountDebited: gatewayAccount,
    accountCredited: 'CLIENT_FUNDS_LIABILITY',
    currency,
    amountMinor: params.amountMinor,
    invoiceId: params.invoiceId,
    paymentId: params.paymentId,
    projectId: params.projectId,
    clientId: params.clientId,
    salesRepId: params.salesRepId,
    reference: params.reference,
    notes: params.notes || `Client payment received into gateway; unearned client funds liability created for invoice ${params.invoiceId}`,
  });
}

/**
 * Standard Double-Entry Event: Milestone Completion & Revenue Recognition
 * Debit: CLIENT_FUNDS_LIABILITY (-Liability released)
 * Credit: PROVIDER_PAYABLE (+Liability to developer/provider)
 * Credit: REPRESENTATIVE_COMMISSION_PAYABLE (+Liability to representative)
 * Credit: CODEBRIDGE_REVENUE (+Revenue recognized upon milestone fulfillment)
 */
export async function recordMilestoneRecognitionLedger(
  db: DbExecutor,
  params: {
    projectId: string;
    milestoneId: string;
    invoiceId: string;
    clientId?: string | null;
    providerId: string;
    salesRepId?: string | null;
    currency: string;
    grossAmountMinor: number;
    providerAmountMinor: number;
    repCommissionMinor: number;
    reference: string;
  }
): Promise<LedgerEntry[]> {
  const currency = params.currency.toUpperCase();
  const codebridgeGrossMarginMinor =
    params.grossAmountMinor - params.providerAmountMinor - params.repCommissionMinor;

  if (codebridgeGrossMarginMinor < 0) {
    throw new Error('[Financial Ledger Error] Provider and Rep splits exceed total milestone funds.');
  }

  const legs: Array<{
    entryType: LedgerEntryType;
    accountDebited: DoubleEntryAccount;
    accountCredited: DoubleEntryAccount;
    currency: string;
    amountMinor: number;
    invoiceId?: string | null;
    salesRepId?: string | null;
    projectId?: string | null;
    clientId?: string | null;
  }> = [];

  // 1. Provider payable leg
  if (params.providerAmountMinor > 0) {
    legs.push({
      entryType: 'COMMISSION',
      accountDebited: 'CLIENT_FUNDS_LIABILITY',
      accountCredited: 'PROVIDER_PAYABLE',
      currency,
      amountMinor: params.providerAmountMinor,
      invoiceId: params.invoiceId,
      projectId: params.projectId,
      clientId: params.clientId,
    });
  }

  // 2. Representative payable leg
  if (params.repCommissionMinor > 0) {
    legs.push({
      entryType: 'COMMISSION',
      accountDebited: 'CLIENT_FUNDS_LIABILITY',
      accountCredited: 'REPRESENTATIVE_COMMISSION_PAYABLE',
      currency,
      amountMinor: params.repCommissionMinor,
      invoiceId: params.invoiceId,
      projectId: params.projectId,
      salesRepId: params.salesRepId,
      clientId: params.clientId,
    });
  }

  // 3. CodeBridge Revenue leg
  if (codebridgeGrossMarginMinor > 0) {
    legs.push({
      entryType: 'PAYMENT',
      accountDebited: 'CLIENT_FUNDS_LIABILITY',
      accountCredited: 'CODEBRIDGE_REVENUE',
      currency,
      amountMinor: codebridgeGrossMarginMinor,
      invoiceId: params.invoiceId,
      projectId: params.projectId,
      clientId: params.clientId,
    });
  }

  return recordBalancedTransaction(db, {
    reference: params.reference,
    notes: `Milestone ${params.milestoneId} completed: revenue recognized and payables accrued`,
    legs,
  });
}

/**
 * Standard Double-Entry Event: Sales Rep Commission Accrued
 * Debit: COMMISSION_EXPENSE (+Expense)
 * Credit: REPRESENTATIVE_COMMISSION_PAYABLE (+Liability owed to Rep)
 */
export async function recordCommissionAccrualLedgerEntry(
  db: DbExecutor,
  params: {
    commissionId: string;
    salesRepId: string;
    paymentId: string;
    invoiceId: string;
    projectId?: string | null;
    clientId?: string | null;
    currency: string;
    amountMinor: number;
    rateBps: number;
    reference: string;
  }
): Promise<LedgerEntry> {
  return recordDoubleEntry(db, {
    entryType: 'COMMISSION',
    accountDebited: 'COMMISSION_EXPENSE',
    accountCredited: 'REPRESENTATIVE_COMMISSION_PAYABLE',
    currency: params.currency,
    amountMinor: params.amountMinor,
    invoiceId: params.invoiceId,
    paymentId: params.paymentId,
    projectId: params.projectId,
    clientId: params.clientId,
    salesRepId: params.salesRepId,
    reference: params.reference,
    notes: `Sales commission accrual (${params.rateBps / 100}%) for payment ${params.paymentId}`,
    metadata: { commissionId: params.commissionId, rateBps: params.rateBps },
  });
}

/**
 * Standard Double-Entry Event: Commission Payout Confirmed (Transferred to Rep)
 * Debit: REPRESENTATIVE_COMMISSION_PAYABLE (-Liability)
 * Credit: GATEWAY_[KES|NGN]_BALANCE (-Cash transferred out from gateway)
 */
export async function recordPayoutSuccessLedgerEntry(
  db: DbExecutor,
  params: {
    payoutId: string;
    salesRepId: string;
    currency: string;
    amountMinor: number;
    reference: string;
    providerTransferId?: string | null;
  }
): Promise<LedgerEntry> {
  const currency = params.currency.toUpperCase();
  const cashAccount: DoubleEntryAccount =
    currency === 'KES' ? 'GATEWAY_KES_BALANCE' : 'GATEWAY_NGN_BALANCE';

  return recordDoubleEntry(db, {
    entryType: 'PAYOUT',
    accountDebited: 'REPRESENTATIVE_COMMISSION_PAYABLE',
    accountCredited: cashAccount,
    currency,
    amountMinor: params.amountMinor,
    salesRepId: params.salesRepId,
    reference: params.reference,
    notes: `Confirmed transfer disbursement to representative ${params.salesRepId}`,
    metadata: { payoutId: params.payoutId, providerTransferId: params.providerTransferId },
  });
}

/**
 * Standard Double-Entry Event: Provider Fulfillment Payout Confirmed
 * Debit: PROVIDER_PAYABLE (-Liability)
 * Credit: GATEWAY_[KES|NGN]_BALANCE (-Cash transferred out to provider)
 */
export async function recordProviderPayoutSuccessLedgerEntry(
  db: DbExecutor,
  params: {
    payoutId: string;
    providerId: string;
    projectId?: string | null;
    currency: string;
    amountMinor: number;
    reference: string;
  }
): Promise<LedgerEntry> {
  const currency = params.currency.toUpperCase();
  const cashAccount: DoubleEntryAccount =
    currency === 'KES' ? 'GATEWAY_KES_BALANCE' : 'GATEWAY_NGN_BALANCE';

  return recordDoubleEntry(db, {
    entryType: 'PAYOUT',
    accountDebited: 'PROVIDER_PAYABLE',
    accountCredited: cashAccount,
    currency,
    amountMinor: params.amountMinor,
    projectId: params.projectId,
    reference: params.reference,
    notes: `Confirmed fulfillment payout to provider ${params.providerId}`,
    metadata: { payoutId: params.payoutId },
  });
}

/**
 * Standard Double-Entry Event: Commission Reversal (When refund occurs BEFORE payout)
 * Debit: REPRESENTATIVE_COMMISSION_PAYABLE (-Liability)
 * Credit: COMMISSION_EXPENSE (-Expense)
 */
export async function recordCommissionReversalLedgerEntry(
  db: DbExecutor,
  params: {
    salesRepId: string;
    invoiceId: string;
    paymentId: string;
    refundId?: string | null;
    currency: string;
    amountMinor: number;
    reference: string;
    notes?: string;
  }
): Promise<LedgerEntry> {
  return recordDoubleEntry(db, {
    entryType: 'REVERSAL',
    accountDebited: 'REPRESENTATIVE_COMMISSION_PAYABLE',
    accountCredited: 'COMMISSION_EXPENSE',
    currency: params.currency,
    amountMinor: params.amountMinor,
    invoiceId: params.invoiceId,
    paymentId: params.paymentId,
    salesRepId: params.salesRepId,
    reference: params.reference,
    notes: params.notes || `Commission reversal due to client refund on payment ${params.paymentId}`,
    metadata: { refundId: params.refundId },
  });
}

/**
 * Standard Double-Entry Event: Client Refund Confirmed
 * Debit: CLIENT_FUNDS_LIABILITY (-Unearned funds liability reduced)
 * Credit: GATEWAY_[KES|NGN]_BALANCE (-Cash returned to client via gateway)
 */
export async function recordRefundLedgerEntry(
  db: DbExecutor,
  params: {
    refundId: string;
    paymentId: string;
    invoiceId: string;
    projectId?: string | null;
    clientId?: string | null;
    salesRepId?: string | null;
    currency: string;
    amountMinor: number;
    reference: string;
    reason?: string | null;
  }
): Promise<LedgerEntry> {
  const currency = params.currency.toUpperCase();
  const cashAccount: DoubleEntryAccount =
    currency === 'KES' ? 'GATEWAY_KES_BALANCE' : 'GATEWAY_NGN_BALANCE';

  return recordDoubleEntry(db, {
    entryType: 'REFUND',
    accountDebited: 'CLIENT_FUNDS_LIABILITY',
    accountCredited: cashAccount,
    currency,
    amountMinor: params.amountMinor,
    invoiceId: params.invoiceId,
    paymentId: params.paymentId,
    projectId: params.projectId,
    clientId: params.clientId,
    salesRepId: params.salesRepId,
    reference: params.reference,
    notes: params.reason ? `Client refund: ${params.reason}` : `Client refund on payment ${params.paymentId}`,
    metadata: { refundId: params.refundId },
  });
}

/**
 * Standard Double-Entry Event: Recovery Receivable Obligation
 * When a refund or chargeback occurs AFTER payout has already left CodeBridge.
 * Debit: RECOVERY_RECEIVABLE (+Asset owed back to CodeBridge)
 * Credit: COMMISSION_EXPENSE or PROVIDER_PAYABLE (reflecting clawback obligation)
 */
export async function recordRecoveryReceivableLedgerEntry(
  db: DbExecutor,
  params: {
    salesRepId?: string | null;
    providerId?: string | null;
    refundId?: string | null;
    disputeId?: string | null;
    paymentId: string;
    invoiceId?: string | null;
    currency: string;
    amountMinor: number;
    reference: string;
    notes?: string;
  }
): Promise<LedgerEntry> {
  return recordDoubleEntry(db, {
    entryType: 'RECOVERY',
    accountDebited: 'RECOVERY_RECEIVABLE',
    accountCredited: 'COMMISSION_EXPENSE',
    currency: params.currency,
    amountMinor: params.amountMinor,
    invoiceId: params.invoiceId || null,
    paymentId: params.paymentId,
    salesRepId: params.salesRepId || null,
    reference: params.reference,
    notes: params.notes || `Recovery receivable created for disbursed funds on refunded/disputed payment ${params.paymentId}`,
    metadata: { refundId: params.refundId, disputeId: params.disputeId, providerId: params.providerId },
  });
}

/**
 * Standard Double-Entry Event: Recovery Offset Against Future Commission
 * Debit: REPRESENTATIVE_COMMISSION_PAYABLE (-New commission payable)
 * Credit: RECOVERY_RECEIVABLE (-Recovery receivable owed)
 */
export async function recordRecoveryOffsetLedgerEntry(
  db: DbExecutor,
  params: {
    salesRepId: string;
    newCommissionId: string;
    currency: string;
    amountMinor: number;
    reference: string;
    notes?: string;
  }
): Promise<LedgerEntry> {
  return recordDoubleEntry(db, {
    entryType: 'RECOVERY_OFFSET',
    accountDebited: 'REPRESENTATIVE_COMMISSION_PAYABLE',
    accountCredited: 'RECOVERY_RECEIVABLE',
    currency: params.currency,
    amountMinor: params.amountMinor,
    salesRepId: params.salesRepId,
    reference: params.reference,
    notes: params.notes || `Recovery balance offset against new commission ${params.newCommissionId}`,
    metadata: { newCommissionId: params.newCommissionId },
  });
}

/**
 * Standard Double-Entry Event: Dispute / Chargeback Incurred
 * Debit: CHARGEBACK_EXPENSE (+Expense loss)
 * Credit: GATEWAY_[KES|NGN]_BALANCE (-Gateway deduction)
 */
export async function recordDisputeLedgerEntry(
  db: DbExecutor,
  params: {
    disputeId: string;
    paymentId: string;
    currency: string;
    amountMinor: number;
    reference: string;
    notes?: string;
  }
): Promise<LedgerEntry> {
  const currency = params.currency.toUpperCase();
  const cashAccount: DoubleEntryAccount =
    currency === 'KES' ? 'GATEWAY_KES_BALANCE' : 'GATEWAY_NGN_BALANCE';

  return recordDoubleEntry(db, {
    entryType: 'DISPUTE',
    accountDebited: 'CHARGEBACK_EXPENSE',
    accountCredited: cashAccount,
    currency,
    amountMinor: params.amountMinor,
    paymentId: params.paymentId,
    reference: params.reference,
    notes: params.notes || `Dispute/chargeback loss recorded for payment ${params.paymentId}`,
    metadata: { disputeId: params.disputeId },
  });
}

/**
 * Derives comprehensive, authoritative financial balances from immutable ledger entries.
 */
export async function deriveRepFinancialSummary(
  param1: DbExecutor | string,
  param2?: string
): Promise<{
  salesRepId: string;
  currency: string;
  totalEarnedMinor: number;
  totalPaidMinor: number;
  totalReversedMinor: number;
  totalPendingMinor: number;
  recoveryBalanceMinor: number;
  netPayableMinor: number;
}> {
  let repId: string;
  let queryFn: (sql: string, params?: any[]) => Promise<any[]>;

  if (typeof param1 === 'string') {
    repId = param1;
    queryFn = query;
  } else {
    repId = param2!;
    const executor: any = param1;
    if (typeof executor.query === 'function') {
      queryFn = (sql, params) => executor.query(sql, params);
    } else if (typeof executor.all === 'function') {
      queryFn = (sql, params) => executor.all(sql, params);
    } else {
      queryFn = query;
    }
  }

  const rows = await queryFn(`
    SELECT t.transaction_type as entry_type, 
           MAX(CASE WHEN e.entry_direction = 'DEBIT' THEN e.account_id END) as account_debited,
           MAX(CASE WHEN e.entry_direction = 'CREDIT' THEN e.account_id END) as account_credited,
           t.currency, 
           MAX(e.amount_minor) as amount_minor
    FROM ledger_transactions t
    JOIN ledger_entries e ON t.id = e.ledger_transaction_id
    WHERE t.sales_rep_id = ?
    GROUP BY t.id, t.transaction_type, t.currency
  `, [repId]);

  let totalEarnedMinor = 0;
  let totalPaidMinor = 0;
  let totalReversedMinor = 0;
  let recoveryCreatedMinor = 0;
  let recoveryOffsetMinor = 0;
  let defaultCurrency = 'KES';

  for (const r of rows) {
    const amt = Number(r.amount_minor);
    defaultCurrency = r.currency;

    if (r.entry_type === 'COMMISSION') {
      totalEarnedMinor += amt;
    } else if (r.entry_type === 'PAYOUT') {
      totalPaidMinor += amt;
    } else if (r.entry_type === 'REVERSAL') {
      totalReversedMinor += amt;
    } else if (r.entry_type === 'RECOVERY') {
      recoveryCreatedMinor += amt;
    } else if (r.entry_type === 'RECOVERY_OFFSET') {
      recoveryOffsetMinor += amt;
    }
  }

  const recoveryBalanceMinor = Math.max(0, recoveryCreatedMinor - recoveryOffsetMinor);
  const totalPendingMinor = Math.max(0, totalEarnedMinor - totalPaidMinor - totalReversedMinor);
  const netPayableMinor = Math.max(0, totalPendingMinor - recoveryBalanceMinor);

  return {
    salesRepId: repId,
    currency: defaultCurrency,
    totalEarnedMinor,
    totalPaidMinor,
    totalReversedMinor,
    totalPendingMinor,
    recoveryBalanceMinor,
    netPayableMinor,
  };
}
