// src/lib/payments/flutterwave-adapter.ts
/**
 * Flutterwave Provider Adapter Implementation
 * Keeps Flutterwave-specific details behind PaymentProviderAdapter boundary.
 * Does NOT execute live payments, live payouts, or unverified refund mutations.
 */

import {
  PaymentProviderAdapter,
  VerifyPaymentResult,
  ProviderBalance,
  RefundRequestParams,
  RefundResult,
  WebhookVerificationResult,
} from './provider-adapter';
import {
  verifyFlutterwaveTransaction,
  verifyWebhookSignature,
  getFlutterwaveSecretKey,
} from './flutterwave';

export class FlutterwaveAdapter implements PaymentProviderAdapter {
  readonly providerName = 'flutterwave';

  /**
   * Authoritatively queries Flutterwave API to verify transaction.
   * Explicitly distinguishes VERIFIED from SETTLED.
   */
  async verifyPayment(providerTransactionId: string): Promise<VerifyPaymentResult> {
    const raw = await verifyFlutterwaveTransaction(providerTransactionId);

    if (raw.status !== 'success' || !raw.data) {
      return {
        verified: false,
        status: 'FAILED',
        providerTransactionId,
        grossAmountMinor: 0,
        currency: 'KES',
        rawMetadata: raw,
      };
    }

    const d = raw.data;
    const isSuccess = d.status?.toLowerCase() === 'successful';
    const currency = (d.currency || 'KES').toUpperCase() as 'KES' | 'NGN';
    const grossAmountMinor = Math.round((d.amount || 0) * 100);
    const feeMinor = Math.round((d.app_fee || 0) * 100);

    // Note: VERIFIED != SETTLED. Flutterwave returns successful charge, but settlement occurs on schedule
    const status = isSuccess ? 'VERIFIED' : 'FAILED';
    const settlementAmountMinor = d.amount_settled ? Math.round(d.amount_settled * 100) : undefined;

    return {
      verified: isSuccess,
      status,
      providerTransactionId: String(d.id),
      providerReference: d.flw_ref,
      grossAmountMinor,
      currency,
      feeMinor,
      settlementCurrency: d.currency,
      settlementAmountMinor,
      settlementStatus: settlementAmountMinor !== undefined ? 'SETTLED' : 'PENDING',
      rawMetadata: d,
    };
  }

  /**
   * Balance inquiry across merchant wallets.
   * Kept behind adapter; does not assume auto-conversion between KES and NGN.
   */
  async getBalances(): Promise<ProviderBalance[]> {
    const secretKey = getFlutterwaveSecretKey();
    if (!secretKey) {
      return [
        { currency: 'KES', availableMinor: 0, ledgerMinor: 0 },
        { currency: 'NGN', availableMinor: 0, ledgerMinor: 0 },
      ];
    }

    try {
      const res = await fetch('https://api.flutterwave.com/v3/balances', {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      if (!res.ok) {
        return [];
      }
      const json = await res.json();
      if (json.status === 'success' && Array.isArray(json.data)) {
        return json.data.map((b: any) => ({
          currency: b.currency,
          availableMinor: Math.round((b.available_balance || 0) * 100),
          ledgerMinor: Math.round((b.ledger_balance || 0) * 100),
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Adapter interface for refund initiation.
   * DB-backed idempotency retained; live body not connected until merchant terms confirmed.
   */
  async initiateRefund(params: RefundRequestParams): Promise<RefundResult> {
    if (!params.idempotencyKey) {
      throw new Error('Idempotency key is strictly required for refund execution.');
    }

    // Per instructions: Do NOT connect live Flutterwave refund execution yet.
    // Interface boundary returns PROCESSING / INITIATED status with idempotency tracking.
    return {
      status: 'INITIATED',
      providerRefundId: `ref_adapter_${params.idempotencyKey}`,
      providerReference: `flw_ref_${params.providerTransactionId}`,
      message: 'Refund queued at adapter boundary (live money movement withheld pending merchant terms confirmation)',
    };
  }

  /**
   * Verifies Flutterwave webhook authenticity (HMAC signature or verif-hash).
   */
  async verifyWebhookSignature(
    headers: Record<string, string | undefined>,
    rawBody: string
  ): Promise<WebhookVerificationResult> {
    const isValid = verifyWebhookSignature(headers, rawBody);
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawBody);
    } catch {}

    const eventId = parsed?.data?.id ? String(parsed.data.id) : parsed?.id ? String(parsed.id) : undefined;
    const eventType = parsed?.['event.type'] || parsed?.event || 'charge.completed';

    return {
      isValid,
      provider: this.providerName,
      eventId,
      eventType,
      parsedData: parsed,
    };
  }
}

export const flutterwaveAdapter = new FlutterwaveAdapter();
