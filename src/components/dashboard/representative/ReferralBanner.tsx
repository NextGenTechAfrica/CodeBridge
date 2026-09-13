// src/components/dashboard/representative/ReferralBanner.tsx
'use client';

import React from 'react';
import { Copy, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { useRep } from '@/app/dashboard/representative/RepContext';

export default function ReferralBanner() {
  const { referralLink, copyReferralLink, copiedReferral } = useRep();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, var(--cb-bg-card) 100%)',
        borderRadius: '16px',
        padding: '20px 26px',
        border: '1px solid rgba(37, 99, 235, 0.25)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '18px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              color: '#38BDF8',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldCheck size={12} /> 20% COMMISSION LINK
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>
            Client Self-Onboarding &amp; Attribution
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Share your link directly with prospective business clients. When they submit their project specifications, they are automatically tied to your financial ledger.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          readOnly
          value={referralLink}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid var(--cb-border-subtle)',
            backgroundColor: 'var(--cb-bg-surface)',
            fontSize: '12px',
            color: 'var(--cb-text-primary)',
            width: '320px',
            maxWidth: '100%',
            fontFamily: 'monospace',
          }}
        />
        <button
          onClick={copyReferralLink}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: copiedReferral ? '#059669' : '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: copiedReferral ? '0 2px 8px rgba(5, 150, 105, 0.4)' : '0 2px 8px rgba(37, 99, 235, 0.3)',
          }}
        >
          {copiedReferral ? <Check size={15} /> : <Copy size={15} />}
          {copiedReferral ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
