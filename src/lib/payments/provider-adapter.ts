// src/lib/payments/provider-adapter.ts
/**
 * Payment Provider Abstraction Layer for CodeBridge
 * Decouples application financial operations from provider-specific (Flutterwave, etc.) mechanics.
 */

export interface VerifyPaymentResult {
  verified: boolean;
  status: 'INITIATED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'SETTLED' | 'FAILED' | 'EXPIRED';
  providerTransactionId: string;
  providerReference?: string;
  grossAmountMinor: number;
  currency: 'KES' | 'NGN';
  feeMinor?: number;
  settlementCurrency?: string;
  settlementAmountMinor?: number;
  settlementRate?: number;
  settlementStatus?: 'PENDING' | 'SETTLED' | 'NOT_APPLICABLE';
  rawMetadata?: any;
}

export interface ProviderBalance {
  currency: string;
  availableMinor: number;
  ledgerMinor: number;
}

export interface RefundRequestParams {
  idempotencyKey: string;
  providerTransactionId: string;
  amountMinor: number;
  currency: string;
  reason?: string;
}

export interface RefundResult {
  status: 'INITIATED' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'MANUAL_INTERVENTION_REQUIRED' | 'INSUFFICIENT_FUNDS';
  providerRefundId?: string;
  providerReference?: string;
  message?: string;
  raw?: any;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  provider: string;
  eventId?: string;
  eventType?: string;
  parsedData?: any;
}

export interface PaymentProviderAdapter {
  readonly providerName: string;
  verifyPayment(providerTransactionId: string): Promise<VerifyPaymentResult>;
  getBalances(): Promise<ProviderBalance[]>;
  initiateRefund(params: RefundRequestParams): Promise<RefundResult>;
  verifyWebhookSignature(headers: Record<string, string | undefined>, rawBody: string): Promise<WebhookVerificationResult>;
}
