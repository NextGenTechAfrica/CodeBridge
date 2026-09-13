// src/components/dashboard/representative/ReferralBanner.tsx
'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useRep } from '@/app/dashboard/representative/RepContext';

export default function ReferralBanner() {
  const { referralLink, copyReferralLink, copiedReferral } = useRep();

  return (
    <div
      style={{
        backgroundColor: 'var(--cb-bg-card)',
        borderRadius: '16px',
        padding: '18px 24px',
        border: '1px solid var(--cb-border-subtle)',
        boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: '#2563EB',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            REFERRAL LINK
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
            Earn 20% Guaranteed Service Commission
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: 0 }}>
          Share your link with prospective business owners. New client leads auto-attribute to your commission ledger.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="text"
          readOnly
          value={referralLink}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--cb-border-subtle)',
            backgroundColor: 'var(--cb-bg-input, var(--cb-bg-surface))',
            fontSize: '12px',
            color: 'var(--cb-text-primary)',
            width: '320px',
            fontFamily: 'monospace',
          }}
        />
        <button
          onClick={copyReferralLink}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: copiedReferral ? '#059669' : '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          {copiedReferral ? <Check size={14} /> : <Copy size={14} />}
          {copiedReferral ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
