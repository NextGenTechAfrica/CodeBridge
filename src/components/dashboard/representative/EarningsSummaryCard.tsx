// src/components/dashboard/representative/EarningsSummaryCard.tsx
'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface EarningsSummaryProps {
  financialSummary: {
    totalEarnedMinor: number;
    totalPaidMinor: number;
    totalPendingMinor: number;
    recoveryBalanceMinor: number;
    netPayableMinor: number;
    currency: string;
  };
  payoutSettings?: {
    currency?: string;
    method?: string;
    destination?: string;
    bankCode?: string;
    accountName?: string;
  };
}

export default function EarningsSummaryCard({ financialSummary, payoutSettings }: EarningsSummaryProps) {
  const currency = financialSummary.currency || 'KES';
  const totalEarnedFormatted = ((financialSummary.totalEarnedMinor || 0) / 100).toLocaleString();
  const totalPaidFormatted = ((financialSummary.totalPaidMinor || 0) / 100).toLocaleString();
  const netPayableFormatted = ((financialSummary.netPayableMinor || 0) / 100).toLocaleString();
  const pendingFormatted = ((financialSummary.totalPendingMinor || 0) / 100).toLocaleString();
  const recoveryFormatted = ((financialSummary.recoveryBalanceMinor || 0) / 100).toLocaleString();

  const netPayableMinor = financialSummary.netPayableMinor || 0;
  const pendingMinor = financialSummary.totalPendingMinor || 0;
  const recoveryMinor = financialSummary.recoveryBalanceMinor || 0;

  return (
    <div
      id="earnings-summary-card"
      style={{
        backgroundColor: 'var(--cb-bg-card)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid var(--cb-border-subtle)',
        boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
        marginBottom: '24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--cb-border-subtle)',
          paddingBottom: '18px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0 }}>
            Earnings & Commission Summary
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: '3px 0 0 0' }}>
            Double-entry financial ledger verified accruals and disbursements ({currency})
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#059669',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              border: '1px solid rgba(5, 150, 105, 0.25)',
              padding: '4px 10px',
              borderRadius: '8px',
            }}
          >
            <ShieldCheck size={14} /> 20.0% Service Commission
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--cb-text-secondary)',
              backgroundColor: 'var(--cb-bg-subtle)',
              border: '1px solid var(--cb-border-subtle)',
              padding: '4px 10px',
              borderRadius: '8px',
            }}
          >
            Payout Method:{' '}
            {payoutSettings?.destination
              ? `${payoutSettings.method === 'MPESA' ? 'M-Pesa' : 'Bank'} (${payoutSettings.destination})`
              : currency === 'KES'
              ? 'M-Pesa Configured'
              : 'Bank Payout Configured'}
          </span>
        </div>
      </div>

      {/* Primary Net Payable Hero + Secondary Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {/* 1. Net Payable Hero */}
        <div
          style={{
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid rgba(37, 99, 235, 0.25)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#2563EB',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Net Payable to You
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cb-text-primary)', marginTop: '6px', lineHeight: 1.1 }}>
            {currency} {netPayableFormatted}
          </div>
          <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '6px', fontWeight: 600 }}>
            {netPayableMinor > 0 ? 'Eligible for disbursement' : 'Settled balance'}
          </div>
        </div>

        {/* 2. Total Earned (Gross) */}
        <div
          style={{
            backgroundColor: 'var(--cb-bg-surface)',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid var(--cb-border-subtle)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cb-text-secondary)', textTransform: 'uppercase' }}>
            Total Earned (Gross)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cb-text-primary)', marginTop: '6px', lineHeight: 1.1 }}>
            {currency} {totalEarnedFormatted}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '6px', fontWeight: 600 }}>
            Ledger verified accruals
          </div>
        </div>

        {/* 3. Total Paid */}
        <div
          style={{
            backgroundColor: 'var(--cb-bg-surface)',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid var(--cb-border-subtle)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cb-text-secondary)', textTransform: 'uppercase' }}>
            Total Paid
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cb-text-primary)', marginTop: '6px', lineHeight: 1.1 }}>
            {currency} {totalPaidFormatted}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', marginTop: '6px' }}>
            Completed transfers
          </div>
        </div>

        {/* 4. Pending Commission */}
        <div
          style={{
            backgroundColor: 'var(--cb-bg-surface)',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid var(--cb-border-subtle)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cb-text-secondary)', textTransform: 'uppercase' }}>
            Pending Commission
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: pendingMinor > 0 ? '#D97706' : 'var(--cb-text-primary)',
              marginTop: '6px',
              lineHeight: 1.1,
            }}
          >
            {currency} {pendingFormatted}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', marginTop: '6px' }}>
            Awaiting client settlement
          </div>
        </div>

        {/* 5. Recovery Obligations */}
        <div
          style={{
            backgroundColor: 'var(--cb-bg-surface)',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid var(--cb-border-subtle)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cb-text-secondary)', textTransform: 'uppercase' }}>
            Recovery Obligations
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: recoveryMinor > 0 ? '#EF4444' : '#10B981',
              marginTop: '6px',
              lineHeight: 1.1,
            }}
          >
            {currency} {recoveryFormatted}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: recoveryMinor > 0 ? '#EF4444' : '#10B981',
              marginTop: '6px',
              fontWeight: 600,
            }}
          >
            {recoveryMinor > 0 ? 'Clawback offset balance' : 'Zero obligations'}
          </div>
        </div>
      </div>
    </div>
  );
}
