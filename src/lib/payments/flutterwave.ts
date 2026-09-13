// src/lib/payments/flutterwave.ts
/**
 * Flutterwave Payment Gateway Service for CodeBridge
 * Sole payment gateway for client collections (KES via Card & M-Pesa, NGN via Card & Bank Transfer).
 * All secret keys remain strictly server-side.
 */

import crypto from 'crypto';

export interface FlutterwaveInitiateParams {
  txRef: string;
  amountMinor: number;
  currency: string; // 'KES' | 'NGN'
  redirectUrl: string;
  customer: {
    email: string;
    phoneNumber?: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

export interface FlutterwaveInitiateResult {
  success: boolean;
  checkoutUrl: string;
  txRef: string;
  isSimulated?: boolean;
}

export interface FlutterwaveVerifyResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint?: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string; // 'successful' | 'failed'
    payment_type: string; // 'card' | 'mpesa' | 'bank_transfer' | 'ussd'
    created_at: string;
    account_id: number;
    amount_settled?: number;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    card?: {
      first_6digits: string;
      last_4digits: string;
      issuer: string;
      country: string;
      type: string;
      expiry: string;
    };
  };
}

export interface WebhookSignatureHeaders {
  verifHash?: string | null;
  flutterwaveSignature?: string | null;
}

/**
 * Timing-safe string comparison to mitigate side-channel timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function getFlutterwaveSecretKey(): string | undefined {
  return process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLW_SECRET_KEY;
}

export function getFlutterwavePublicKey(): string | undefined {
  return process.env.FLUTTERWAVE_PUBLIC_KEY || process.env.FLW_PUBLIC_KEY;
}

export function getFlutterwaveSecretHash(): string | undefined {
  return process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLW_WEBHOOK_SECRET_HASH;
}

/**
 * Validates webhook authenticity using Flutterwave signature headers.
 * Supports:
 * 1. Standard `verif-hash` header comparison (against FLUTTERWAVE_SECRET_HASH)
 * 2. Cryptographic `flutterwave-signature` header (HMAC-SHA256 of raw body against FLUTTERWAVE_SECRET_HASH or FLUTTERWAVE_SECRET_KEY)
 * Both use constant-time comparison to protect against timing attacks.
 */
export function verifyWebhookSignature(
  param1: WebhookSignatureHeaders | string | null,
  param2?: string | WebhookSignatureHeaders | null
): boolean {
  const secretHashes = [
    process.env.FLW_WEBHOOK_SECRET_HASH,
    process.env.FLUTTERWAVE_SECRET_HASH,
  ].filter(Boolean) as string[];
  const secretKey = getFlutterwaveSecretKey();

  if (secretHashes.length === 0 && !secretKey) {
    console.warn('[Flutterwave] Neither FLUTTERWAVE_SECRET_HASH nor FLUTTERWAVE_SECRET_KEY is configured. Webhook rejected.');
    return false;
  }

  let verifHash: string | null = null;
  let flwSignature: string | null = null;
  let rawBody: string | undefined;

  // Detect if param1 is raw JSON body or headers
  if (typeof param1 === 'string' && (param1.trim().startsWith('{') || param1.trim().startsWith('['))) {
    rawBody = param1;
    if (typeof param2 === 'string') {
      verifHash = param2;
      flwSignature = param2;
    } else if (param2) {
      verifHash = param2.verifHash || null;
      flwSignature = param2.flutterwaveSignature || null;
    }
  } else {
    rawBody = typeof param2 === 'string' ? param2 : undefined;
    if (typeof param1 === 'string') {
      verifHash = param1;
      flwSignature = param1;
    } else if (param1) {
      verifHash = param1.verifHash || null;
      flwSignature = param1.flutterwaveSignature || null;
    }
  }

  // 1. Validate verif-hash (Primary Flutterwave Dashboard Secret Hash header)
  if (verifHash && secretHashes.length > 0) {
    for (const hash of secretHashes) {
      if (timingSafeEqual(verifHash, hash)) {
        return true;
      }
    }
  }

  // 2. Validate flutterwave-signature (HMAC-SHA256 signature of raw request body)
  if (flwSignature && rawBody) {
    const candidateKeys = [...secretHashes, secretKey, process.env.FLW_SECRET_KEY].filter(Boolean) as string[];
    const cleanSignature = flwSignature.trim();
    for (const key of candidateKeys) {
      const computedHex = crypto.createHmac('sha256', key).update(rawBody).digest('hex');
      const computedBase64 = crypto.createHmac('sha256', key).update(rawBody).digest('base64');
      if (
        timingSafeEqual(cleanSignature, computedBase64) ||
        timingSafeEqual(cleanSignature.toLowerCase(), computedHex.toLowerCase())
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generates an idempotent, unique transaction reference for Flutterwave.
 * Structure: CB-{sanitizedInvoiceId}-{timestamp}-{random}
 */
export function generateFlutterwaveReference(invoiceId: string): string {
  const cleanId = invoiceId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CB-${cleanId}-${timestamp}-${random}`;
}

/**
 * Initiates standard Flutterwave checkout.
 * POST https://api.flutterwave.com/v3/payments
 */
export async function initiateFlutterwaveCheckout(
  params: FlutterwaveInitiateParams
): Promise<FlutterwaveInitiateResult> {
  const secretKey = getFlutterwaveSecretKey();
  const majorAmount = params.amountMinor / 100;

  // Enforce payment options based on currency
  // KES payments support Card and M-Pesa
  const paymentOptions = params.currency === 'KES' ? 'card,mpesa' : 'card,banktransfer,ussd';

  // If secret key is not set, reject in production
  if (!secretKey) {
    if (process.env.NODE_ENV === 'test') {
      console.log(`[Flutterwave Test Simulation] Initiating ${params.currency} ${majorAmount} checkout (tx_ref: ${params.txRef})`);
      return {
        success: true,
        checkoutUrl: `${params.redirectUrl}${params.redirectUrl.includes('?') ? '&' : '?'}status=successful&tx_ref=${params.txRef}&transaction_id=flw_sim_${Date.now()}`,
        txRef: params.txRef,
        isSimulated: true,
      };
    }
    console.error('[Flutterwave] FLUTTERWAVE_SECRET_KEY is not configured on the server.');
    throw new Error('Payment gateway configuration error: FLUTTERWAVE_SECRET_KEY is not configured.');
  }

  if (secretKey.startsWith('FLWSECK_TEST_MOCK') && process.env.NODE_ENV === 'test') {
    return {
      success: true,
      checkoutUrl: `${params.redirectUrl}${params.redirectUrl.includes('?') ? '&' : '?'}status=successful&tx_ref=${params.txRef}&transaction_id=flw_sim_${Date.now()}`,
      txRef: params.txRef,
      isSimulated: true,
    };
  }

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: params.txRef,
        amount: majorAmount,
        currency: params.currency,
        redirect_url: params.redirectUrl,
        payment_options: paymentOptions,
        customer: params.customer,
        customizations: params.customizations,
        meta: params.meta || {},
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      console.error('[Flutterwave] Checkout initialization failed:', data);
      throw new Error(data.message || 'Failed to initiate Flutterwave checkout.');
    }

    return {
      success: true,
      checkoutUrl: data.data.link,
      txRef: params.txRef,
    };
  } catch (err: any) {
    console.error('[Flutterwave] Network or API failure:', err);
    throw err;
  }
}

/**
 * Authoritatively verifies a transaction server-side against Flutterwave API.
 * GET https://api.flutterwave.com/v3/transactions/{id}/verify
 */
export async function verifyFlutterwaveTransaction(
  transactionId: string | number
): Promise<FlutterwaveVerifyResponse> {
  const secretKey = getFlutterwaveSecretKey();

  if (!secretKey) {
    console.error('[Flutterwave] FLUTTERWAVE_SECRET_KEY is not configured on the server.');
    return {
      status: 'error',
      message: 'Payment gateway configuration error: FLUTTERWAVE_SECRET_KEY is missing.',
    };
  }

  // Allow test mock only in test environments with explicit mock key
  if (secretKey.startsWith('FLWSECK_TEST_MOCK') && process.env.NODE_ENV === 'test') {
    console.log(`[Flutterwave Simulation] Mock verification for transaction ${transactionId}`);
    return {
      status: 'success',
      message: 'Transaction verified (simulated)',
      data: {
        id: typeof transactionId === 'number' ? transactionId : 12345678,
        tx_ref: `CB-SIM-${Date.now()}`,
        flw_ref: `FLW-SIM-${Date.now()}`,
        amount: 100000,
        currency: 'KES',
        charged_amount: 100000,
        app_fee: 1500,
        merchant_fee: 0,
        processor_response: 'Approved',
        auth_model: 'AUTH',
        ip: '127.0.0.1',
        narration: 'CodeBridge Simulated Payment',
        status: 'successful',
        payment_type: 'mpesa',
        created_at: new Date().toISOString(),
        account_id: 99999,
        amount_settled: 98500,
        customer: {
          id: 111,
          name: 'Demo Client',
          phone_number: '+254700000000',
          email: 'client@abcrestaurants.com',
          created_at: new Date().toISOString(),
        },
      },
    };
  }

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data: FlutterwaveVerifyResponse = await response.json();
  return data;
}

/**
 * Verifies a transaction using its merchant transaction reference (tx_ref).
 * GET https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref={tx_ref}
 */
export async function verifyFlutterwaveByReference(
  txRef: string
): Promise<FlutterwaveVerifyResponse> {
  const secretKey = getFlutterwaveSecretKey();

  if (!secretKey) {
    console.error('[Flutterwave] FLUTTERWAVE_SECRET_KEY is not configured on the server.');
    return {
      status: 'error',
      message: 'Payment gateway configuration error: FLUTTERWAVE_SECRET_KEY is missing.',
    };
  }

  if (secretKey.startsWith('FLWSECK_TEST_MOCK') && process.env.NODE_ENV === 'test') {
    console.log(`[Flutterwave Simulation] Mock verification for tx_ref ${txRef}`);
    return {
      status: 'success',
      message: 'Transaction verified by reference (simulated)',
      data: {
        id: 12345678,
        tx_ref: txRef,
        flw_ref: `FLW-SIM-${Date.now()}`,
        amount: 100000,
        currency: 'KES',
        charged_amount: 100000,
        app_fee: 1500,
        merchant_fee: 0,
        processor_response: 'Approved',
        auth_model: 'AUTH',
        ip: '127.0.0.1',
        narration: 'CodeBridge Simulated Payment',
        status: 'successful',
        payment_type: 'mpesa',
        created_at: new Date().toISOString(),
        account_id: 99999,
        amount_settled: 98500,
        customer: {
          id: 111,
          name: 'Demo Client',
          phone_number: '+254700000000',
          email: 'client@abcrestaurants.com',
          created_at: new Date().toISOString(),
        },
      },
    };
  }

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  const data: FlutterwaveVerifyResponse = await response.json();
  return data;
}

export interface FlutterwaveTransferParams {
  accountBank: string; // 'MPS' for Kenya M-Pesa, 3-digit bank code for Nigeria
  accountNumber: string; // M-Pesa phone number e.g. 254712345678 or 10-digit NUBAN
  amount: number; // major currency units (e.g. 2000.00 KES)
  narration: string;
  currency: string;
  reference: string; // deterministic payout reference
  callbackUrl?: string;
  debitCurrency?: string;
}

export interface FlutterwaveTransferResult {
  success: boolean;
  status: 'SUCCESSFUL' | 'PROCESSING' | 'FAILED' | 'ACTION_REQUIRED';
  transferId?: string | number;
  reference: string;
  fee?: number;
  message?: string;
  raw?: any;
}

/**
 * Initiates an authoritative commission payout transfer via Flutterwave.
 * POST https://api.flutterwave.com/v3/transfers
 */
export async function initiateFlutterwaveTransfer(
  params: FlutterwaveTransferParams
): Promise<FlutterwaveTransferResult> {
  const secretKey = getFlutterwaveSecretKey();

  if (!secretKey) {
    if (process.env.NODE_ENV === 'test') {
      return {
        success: true,
        status: 'PROCESSING',
        transferId: `sim_trf_${Date.now()}`,
        reference: params.reference,
        message: 'Simulated transfer in test environment',
      };
    }
    return {
      success: false,
      status: 'ACTION_REQUIRED',
      reference: params.reference,
      message: 'FLUTTERWAVE_SECRET_KEY is missing on server.',
    };
  }

  if (secretKey.startsWith('FLWSECK_TEST_MOCK') && process.env.NODE_ENV === 'test') {
    return {
      success: true,
      status: 'PROCESSING',
      transferId: `sim_trf_${Date.now()}`,
      reference: params.reference,
      message: 'Simulated transfer in mock test environment',
    };
  }

  try {
    const callbackUrl = params.callbackUrl || 'https://code-bridge-rosy.vercel.app/api/payments/flutterwave/webhook';
    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: params.accountBank,
        account_number: params.accountNumber.replace(/[^0-9]/g, ''),
        amount: params.amount,
        narration: params.narration,
        currency: params.currency,
        reference: params.reference,
        callback_url: callbackUrl,
        debit_currency: params.debitCurrency || params.currency,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      const msg = data.message || 'Transfer initiation failed';
      // Detect balance or capability limitations
      const isCapabilityOrBalance =
        msg.toLowerCase().includes('balance') ||
        msg.toLowerCase().includes('not enabled') ||
        msg.toLowerCase().includes('insufficient') ||
        msg.toLowerCase().includes('permission');

      return {
        success: false,
        status: isCapabilityOrBalance ? 'ACTION_REQUIRED' : 'FAILED',
        reference: params.reference,
        message: msg,
        raw: data,
      };
    }

    const trfData = data.data;
    const transferStatus =
      trfData.status?.toUpperCase() === 'SUCCESSFUL'
        ? 'SUCCESSFUL'
        : trfData.status?.toUpperCase() === 'FAILED'
        ? 'FAILED'
        : 'PROCESSING';

    return {
      success: true,
      status: transferStatus,
      transferId: trfData.id,
      reference: trfData.reference || params.reference,
      fee: trfData.fee,
      message: data.message,
      raw: data,
    };
  } catch (err: any) {
    console.error('[Flutterwave Transfer API Error]', err);
    return {
      success: false,
      status: 'FAILED',
      reference: params.reference,
      message: err.message || 'Network error initiating transfer.',
    };
  }
}

/**
 * Authoritatively verifies a transfer status from Flutterwave API.
 * GET https://api.flutterwave.com/v3/transfers/{id}
 */
export async function verifyFlutterwaveTransfer(
  transferId: string | number
): Promise<{ status: string; data?: any; message?: string }> {
  const secretKey = getFlutterwaveSecretKey();
  if (!secretKey) {
    return { status: 'error', message: 'FLUTTERWAVE_SECRET_KEY is missing.' };
  }

  if (String(transferId).startsWith('sim_trf_') && process.env.NODE_ENV === 'test') {
    return { status: 'success', data: { id: transferId, status: 'SUCCESSFUL' } };
  }

  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transfers/${transferId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (err: any) {
    return { status: 'error', message: err.message };
  }
}

export interface FlutterwaveRefundParams {
  transactionId: string | number;
  amount?: number; // in major units (e.g. 500 KES)
  comments?: string;
}

export interface FlutterwaveRefundResult {
  success: boolean;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  refundId?: string | number;
  amountRefunded?: number;
  message?: string;
  raw?: any;
}

/**
 * Initiates an authoritative refund via Flutterwave.
 * POST https://api.flutterwave.com/v3/transactions/{id}/refund
 */
export async function initiateFlutterwaveRefund(
  params: FlutterwaveRefundParams
): Promise<FlutterwaveRefundResult> {
  const secretKey = getFlutterwaveSecretKey();

  if (!secretKey) {
    if (process.env.NODE_ENV === 'test') {
      return {
        success: true,
        status: 'COMPLETED',
        refundId: `sim_ref_${Date.now()}`,
        amountRefunded: params.amount,
        message: 'Simulated refund in test environment',
      };
    }
    return {
      success: false,
      status: 'FAILED',
      message: 'FLUTTERWAVE_SECRET_KEY is missing on server.',
    };
  }

  if (String(params.transactionId).startsWith('sim_') && process.env.NODE_ENV === 'test') {
    return {
      success: true,
      status: 'COMPLETED',
      refundId: `sim_ref_${Date.now()}`,
      amountRefunded: params.amount,
      message: 'Simulated refund for mock test',
    };
  }

  try {
    const bodyObj: any = {};
    if (params.amount !== undefined && params.amount > 0) {
      bodyObj.amount = params.amount;
    }
    if (params.comments) {
      bodyObj.comments = params.comments;
    }

    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${params.transactionId}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyObj),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      return {
        success: false,
        status: 'FAILED',
        message: data.message || 'Refund initiation failed',
        raw: data,
      };
    }

    const rfData = data.data;
    const refStatus =
      rfData.status?.toLowerCase() === 'completed'
        ? 'COMPLETED'
        : rfData.status?.toLowerCase() === 'failed'
        ? 'FAILED'
        : 'PROCESSING';

    return {
      success: true,
      status: refStatus,
      refundId: rfData.id,
      amountRefunded: rfData.amount_refunded,
      message: data.message,
      raw: data,
    };
  } catch (err: any) {
    console.error('[Flutterwave Refund API Error]', err);
    return {
      success: false,
      status: 'FAILED',
      message: err.message || 'Network error initiating refund.',
    };
  }
}


