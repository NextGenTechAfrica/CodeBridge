// src/lib/notifications/email.ts
import { execute, queryOne } from '@/lib/db/connection';
import { recordAuditLog } from '@/lib/auth/session';

export interface PaymentEmailParams {
  recipientEmail: string;
  recipientName: string;
  recipientUserId?: string;
  invoiceNumber: string;
  invoiceTitle: string;
  amountMinor: number;
  currency: string;
  paymentMethod: string;
  transactionReference: string;
  paidAt: string;
  isFullPayment: boolean;
  remainingMinor?: number;
}

export interface EmailDispatchResult {
  success: boolean;
  channel: 'EMAIL';
  provider: string;
  providerMessageId?: string;
  recipient: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  error?: string;
  timestamp: string;
}

/**
 * Dispatches an automated payment confirmation email and creates an in-app notification.
 * Designed to execute non-blockingly and safely so email failures NEVER roll back payment confirmation.
 */
export async function sendPaymentConfirmationNotification(
  params: PaymentEmailParams
): Promise<EmailDispatchResult> {
  const timestamp = new Date().toISOString();
  const majorAmount = (params.amountMinor / 100).toLocaleString();
  const provider = process.env.RESEND_API_KEY ? 'Resend' : process.env.SENDGRID_API_KEY ? 'SendGrid' : 'CodeBridge-Mailer (Simulated)';

  try {
    let providerMessageId = `msg_flw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    let status: 'SENT' | 'SIMULATED' | 'FAILED' = 'SIMULATED';

    // 1. If external transactional email API is configured (e.g., Resend)
    if (process.env.RESEND_API_KEY) {
      const fromEmail = process.env.EMAIL_FROM;
      if (!fromEmail) {
        console.warn('[Notification] EMAIL_FROM environment variable is not configured. Falling back to simulated notification.');
        status = 'SIMULATED';
      } else {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: params.recipientEmail,
              subject: `Payment Confirmed: Invoice ${params.invoiceNumber} (${params.currency} ${majorAmount})`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
                <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; color: white; margin-bottom: 24px;">
                  <h2 style="margin: 0; color: #38bdf8;">CodeBridge</h2>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Automated Payment Confirmation</p>
                </div>
                <h3>Payment Received — Thank You!</h3>
                <p>Hello ${params.recipientName},</p>
                <p>We have authoritatively confirmed your payment of <strong>${params.currency} ${majorAmount}</strong> for invoice <strong>${params.invoiceNumber}</strong> (${params.invoiceTitle}).</p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 4px 0;"><strong>Transaction Reference:</strong> ${params.transactionReference}</p>
                  <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${params.paymentMethod}</p>
                  <p style="margin: 4px 0;"><strong>Status:</strong> ${params.isFullPayment ? 'PAID IN FULL' : 'PARTIALLY PAID'}</p>
                  ${params.remainingMinor && params.remainingMinor > 0 ? `<p style="margin: 4px 0; color: #d97706;"><strong>Remaining Balance:</strong> ${params.currency} ${(params.remainingMinor / 100).toLocaleString()}</p>` : ''}
                </div>
                <p style="font-size: 13px; color: #64748b;">This payment has automatically unlocked the corresponding project milestone. You can view your invoice and project progress directly in your CodeBridge Client Portal.</p>
              </div>
            `,
          }),
        });
        const resData = await res.json();
        if (res.ok && resData.id) {
          providerMessageId = resData.id;
          status = 'SENT';
        }
        } catch (e: any) {
          console.error('[Notification] Resend API dispatch error:', e.message);
          status = 'FAILED';
        }
      }
    } else {
      console.log(`[Notification Simulator] Dispatched payment confirmation email to ${params.recipientEmail} (${params.currency} ${majorAmount})`);
      status = 'SIMULATED';
    }

    // 2. In-App Notification (Always inserted if recipientUserId is available)
    if (params.recipientUserId) {
      const notifId = `notif_pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await execute(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
        VALUES (?, ?, ?, ?, 'SUCCESS', 0, '/dashboard/client', datetime('now'))
      `, [
        notifId,
        params.recipientUserId,
        `Payment Confirmed: ${params.currency} ${majorAmount}`,
        `Your payment for invoice ${params.invoiceNumber} has been verified authoritatively via Flutterwave (${params.paymentMethod}).`,
      ]);
    }

    // 3. Record in Audit Log
    await recordAuditLog({
      userId: 'system_flutterwave',
      action: 'EMAIL_DISPATCHED',
      entity: 'invoices',
      entityId: params.invoiceNumber,
      metadata: {
        recipient: params.recipientEmail,
        event: 'PAYMENT_CONFIRMATION',
        channel: 'EMAIL',
        provider,
        providerMessageId,
        status,
        currency: params.currency,
        amountMinor: params.amountMinor,
        timestamp,
      },
      ipAddress: '127.0.0.1',
    });

    return {
      success: status !== 'FAILED',
      channel: 'EMAIL',
      provider,
      providerMessageId,
      recipient: params.recipientEmail,
      status,
      timestamp,
    };
  } catch (err: any) {
    console.error('[Notification] Non-fatal notification error:', err);
    return {
      success: false,
      channel: 'EMAIL',
      provider,
      recipient: params.recipientEmail,
      status: 'FAILED',
      error: err.message,
      timestamp,
    };
  }
}
