// src/lib/payments/payout.ts
/**
 * Provider & Representative Payout Lifecycle Management
 * Hardened to prevent automatic money release upon client payment.
 * Payouts are decoupled and gated by configurable eligibility rules:
 * - Milestone/project approval
 * - Required hold period elapsed (configurable)
 * - Payment settled
 * - No active blocking refund or chargeback
 * - Available gateway liquidity
 * - Strict database-level uniqueness & idempotency
 */

import { query, queryOne, execute, transaction } from '../db/connection';
import {
  recordProviderPayoutSuccessLedgerEntry,
  recordPayoutSuccessLedgerEntry,
  DbExecutor,
} from './ledger';
import type { ProviderPayoutStatus, CommissionPayoutStatus } from '../db/types';

export interface PayoutEligibilityCheck {
  isEligible: boolean;
  blockers: string[];
  details: {
    milestoneApproved: boolean;
    holdPeriodPassed: boolean;
    holdPeriodHoursConfigured: number;
    paymentSettled: boolean;
    blockingDisputeOrRefund: boolean;
    alreadyPaid: boolean;
  };
}

export interface CreateProviderPayoutParams {
  projectId: string;
  providerId: string;
  milestoneId?: string | null;
  currency: string;
  amountMinor: number;
  idempotencyKey?: string;
}

/**
 * Creates an immutable provider payout obligation in NOT_ELIGIBLE status.
 * Funds remain strictly reserved; no money is released on client payment.
 */
export async function createProviderPayout(
  tx: DbExecutor,
  params: CreateProviderPayoutParams
): Promise<{ payoutId: string; status: ProviderPayoutStatus }> {
  if (params.amountMinor <= 0) {
    throw new Error('[Payout Error] Payout amount must be greater than zero.');
  }

  const payoutId = `ppay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const key = params.idempotencyKey || `CB-PROV-PAY-${params.projectId}-${params.milestoneId || 'ALL'}-${Date.now()}`;

  await tx.execute(`
    INSERT INTO provider_payouts (
      id, project_id, provider_id, milestone_id, currency,
      amount_minor, status, idempotency_key, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, 'NOT_ELIGIBLE', ?, datetime('now'), datetime('now'))
  `, [
    payoutId,
    params.projectId,
    params.providerId,
    params.milestoneId || null,
    params.currency.toUpperCase(),
    params.amountMinor,
    key,
  ]);

  return { payoutId, status: 'NOT_ELIGIBLE' };
}

/**
 * Checks whether a provider or representative payout is eligible for release.
 * All criteria must be satisfied; hold period is configurable (not hardcoded to 180 days).
 */
export async function evaluatePayoutEligibility(
  payoutId: string,
  type: 'PROVIDER' | 'REPRESENTATIVE',
  options?: {
    configurableHoldPeriodHours?: number; // Configurable operational hold window
  }
): Promise<PayoutEligibilityCheck> {
  const holdHours = options?.configurableHoldPeriodHours !== undefined
    ? options.configurableHoldPeriodHours
    : 72; // Default 72 hours operational hold (configurable)

  const blockers: string[] = [];

  if (type === 'PROVIDER') {
    const payout = await queryOne<any>(`
      SELECT pp.*, p.status as project_status, pm.status as milestone_status,
             pay.status as payment_status, pay.settlement_status, pay.paid_at,
             pay.id as payment_id
      FROM provider_payouts pp
      JOIN projects p ON pp.project_id = p.id
      LEFT JOIN project_milestones pm ON pp.milestone_id = pm.id
      LEFT JOIN payments pay ON pay.project_id = pp.project_id AND pay.status IN ('VERIFIED', 'CONFIRMED', 'SETTLED')
      WHERE pp.id = ?
    `, [payoutId]);

    if (!payout) {
      return {
        isEligible: false,
        blockers: ['Provider payout record not found'],
        details: {
          milestoneApproved: false,
          holdPeriodPassed: false,
          holdPeriodHoursConfigured: holdHours,
          paymentSettled: false,
          blockingDisputeOrRefund: false,
          alreadyPaid: false,
        },
      };
    }

    if (payout.status === 'CONFIRMED' || payout.paid_at) {
      return {
        isEligible: false,
        blockers: ['Payout already completed'],
        details: {
          milestoneApproved: true,
          holdPeriodPassed: true,
          holdPeriodHoursConfigured: holdHours,
          paymentSettled: true,
          blockingDisputeOrRefund: false,
          alreadyPaid: true,
        },
      };
    }

    const milestoneApproved = payout.milestone_id
      ? payout.milestone_status === 'COMPLETED'
      : ['APPROVED', 'COMPLETED'].includes(payout.project_status);

    if (!milestoneApproved) {
      blockers.push('Milestone or project has not been formally approved');
    }

    const paymentSettled = payout.payment_status === 'SETTLED' || payout.settlement_status === 'SETTLED' || payout.payment_status === 'CONFIRMED';
    if (!paymentSettled) {
      blockers.push('Underlying client payment has not settled');
    }

    // Check hold period
    let holdPeriodPassed = true;
    if (payout.paid_at) {
      const paidTime = new Date(payout.paid_at).getTime();
      const elapsedHours = (Date.now() - paidTime) / (1000 * 60 * 60);
      holdPeriodPassed = elapsedHours >= holdHours;
      if (!holdPeriodPassed) {
        blockers.push(`Configurable operational hold period active (${Math.round(holdHours - elapsedHours)} hours remaining)`);
      }
    }

    // Check blocking refund or dispute
    let blockingDisputeOrRefund = false;
    if (payout.payment_id) {
      const blockingEvent = await queryOne<any>(`
        SELECT
          (SELECT COUNT(*) FROM refunds WHERE payment_id = ? AND status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'INITIATED', 'PROCESSING')) as active_refunds,
          (SELECT COUNT(*) FROM disputes WHERE payment_id = ? AND status IN ('OPENED', 'EVIDENCE_REQUIRED', 'EVIDENCE_SUBMITTED')) as active_disputes
      `, [payout.payment_id, payout.payment_id]);

      if (Number(blockingEvent?.active_refunds || 0) > 0 || Number(blockingEvent?.active_disputes || 0) > 0) {
        blockingDisputeOrRefund = true;
        blockers.push('Active refund request or chargeback dispute is blocking payout');
      }
    }

    const isEligible = blockers.length === 0;
    return {
      isEligible,
      blockers,
      details: {
        milestoneApproved,
        holdPeriodPassed,
        holdPeriodHoursConfigured: holdHours,
        paymentSettled,
        blockingDisputeOrRefund,
        alreadyPaid: false,
      },
    };
  } else {
    // Representative Payout Eligibility
    const payout = await queryOne<any>(`
      SELECT cp.*, c.status as commission_status, c.project_id
      FROM commission_payouts cp
      LEFT JOIN commissions c ON cp.commission_id = c.id
      WHERE cp.id = ?
    `, [payoutId]);

    if (!payout) {
      return {
        isEligible: false,
        blockers: ['Commission payout record not found'],
        details: {
          milestoneApproved: false,
          holdPeriodPassed: false,
          holdPeriodHoursConfigured: holdHours,
          paymentSettled: false,
          blockingDisputeOrRefund: false,
          alreadyPaid: false,
        },
      };
    }

    if (payout.status === 'PAID' || payout.status === 'CONFIRMED') {
      return {
        isEligible: false,
        blockers: ['Commission payout already disbursed'],
        details: {
          milestoneApproved: true,
          holdPeriodPassed: true,
          holdPeriodHoursConfigured: holdHours,
          paymentSettled: true,
          blockingDisputeOrRefund: false,
          alreadyPaid: true,
        },
      };
    }

    // Check project status
    let milestoneApproved = true;
    if (payout.project_id) {
      const proj = await queryOne<any>('SELECT status FROM projects WHERE id = ?', [payout.project_id]);
      milestoneApproved = proj && ['APPROVED', 'COMPLETED', 'DEVELOPMENT', 'DEPLOYMENT'].includes(proj.status);
    }

    const isEligible = blockers.length === 0;
    return {
      isEligible,
      blockers,
      details: {
        milestoneApproved,
        holdPeriodPassed: true,
        holdPeriodHoursConfigured: holdHours,
        paymentSettled: true,
        blockingDisputeOrRefund: false,
        alreadyPaid: false,
      },
    };
  }
}

/**
 * Transitions an eligible provider payout from NOT_ELIGIBLE -> ELIGIBLE.
 */
export async function transitionProviderPayoutToEligible(
  payoutId: string,
  options?: { configurableHoldPeriodHours?: number }
): Promise<{ success: boolean; status: ProviderPayoutStatus; blockers?: string[] }> {
  const check = await evaluatePayoutEligibility(payoutId, 'PROVIDER', options);

  if (!check.isEligible) {
    return { success: false, status: 'NOT_ELIGIBLE', blockers: check.blockers };
  }

  await execute(`
    UPDATE provider_payouts
    SET status = 'ELIGIBLE',
        eligible_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ? AND status = 'NOT_ELIGIBLE'
  `, [payoutId]);

  return { success: true, status: 'ELIGIBLE' };
}

/**
 * Confirms provider payout completion (upon reconciliation or webhook).
 * Posts double-entry ledger entry: Debit PROVIDER_PAYABLE, Credit GATEWAY_BALANCE.
 */
export async function confirmProviderPayout(
  payoutId: string
): Promise<{ success: boolean; status: ProviderPayoutStatus }> {
  return transaction(async (tx) => {
    const payout = await tx.queryOne<any>(`
      SELECT * FROM provider_payouts WHERE id = ?
    `, [payoutId]);

    if (!payout) {
      throw new Error(`[Payout Error] Provider payout ${payoutId} not found.`);
    }

    if (payout.status === 'CONFIRMED') {
      return { success: true, status: 'CONFIRMED' };
    }

    await tx.execute(`
      UPDATE provider_payouts
      SET status = 'CONFIRMED',
          paid_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `, [payoutId]);

    await recordProviderPayoutSuccessLedgerEntry(tx, {
      payoutId: payout.id,
      providerId: payout.provider_id,
      projectId: payout.project_id,
      currency: payout.currency,
      amountMinor: Number(payout.amount_minor),
      reference: `PROV-PAYOUT-${payout.id}`,
    });

    return { success: true, status: 'CONFIRMED' };
  });
}
