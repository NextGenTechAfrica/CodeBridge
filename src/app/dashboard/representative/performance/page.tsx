// src/app/dashboard/representative/performance/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Receipt,
  BookOpenCheck,
  ShieldCheck,
  RefreshCw,
  Wallet,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useRep } from '../RepContext';
import EarningsSummaryCard from '@/components/dashboard/representative/EarningsSummaryCard';

export default function RepresentativePerformancePage() {
  const { currency } = useRep();

  const [activeCommercialTab, setActiveCommercialTab] = useState<'proposals' | 'invoices' | 'ledger'>('proposals');
  const [proposals, setProposals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalEarnedMinor: 0,
    totalPaidMinor: 0,
    totalPendingMinor: 0,
    recoveryBalanceMinor: 0,
    netPayableMinor: 0,
    currency: 'KES',
  });
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [payoutSettings, setPayoutSettings] = useState<any>({
    currency: 'KES',
    method: 'MPESA',
    destination: '',
    bankCode: 'MPS',
    accountName: '',
    referralCode: 'KEN-001',
  });
  const [loading, setLoading] = useState(true);

  const loadFinancialData = useCallback(async () => {
    try {
      const [resProposals, resInvoices, resComms] = await Promise.all([
        fetch('/api/proposals'),
        fetch('/api/invoices'),
        fetch('/api/representative/commissions'),
      ]);

      if (resProposals.ok) {
        const d = await resProposals.json();
        setProposals(d.proposals || []);
      }

      if (resInvoices.ok) {
        const d = await resInvoices.json();
        setInvoices(d.invoices || []);
      }

      if (resComms.ok) {
        const commData = await resComms.json();
        if (commData.summary) {
          setFinancialSummary(commData.summary);
        }
        setLedgerEntries(commData.ledger || []);
        if (commData.payoutSettings) {
          setPayoutSettings(commData.payoutSettings);
        }
      }
    } catch (err) {
      console.error('Failed to load performance & commercial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          color: '#64748B',
          fontSize: '14px',
          fontWeight: 600,
          gap: '10px',
        }}
      >
        <RefreshCw className="animate-spin" size={18} />
        Loading Performance Data...
      </div>
    );
  }

  return (
    <div>
      {/* Earnings & Commission Summary Header Card */}
      <EarningsSummaryCard financialSummary={financialSummary} payoutSettings={payoutSettings} />

      {/* ========================================================================= */}
      {/* CONSOLIDATED COMMERCIAL & ACCOUNTING MODULE                               */}
      {/* ========================================================================= */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden',
          marginBottom: '32px',
        }}
      >
        {/* Header & Tabs Navigation */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Your Results & Earnings
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
              Client proposals, milestone billing invoices, and transaction history
            </p>
          </div>

          {/* Tab Controls */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              padding: '4px',
              borderRadius: '10px',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setActiveCommercialTab('proposals')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: activeCommercialTab === 'proposals' ? 700 : 500,
                backgroundColor: activeCommercialTab === 'proposals' ? '#FFFFFF' : 'transparent',
                color: activeCommercialTab === 'proposals' ? '#0F172A' : '#64748B',
                boxShadow: activeCommercialTab === 'proposals' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={14} />
              <span>Proposals ({proposals.length})</span>
            </button>

            <button
              onClick={() => setActiveCommercialTab('invoices')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: activeCommercialTab === 'invoices' ? 700 : 500,
                backgroundColor: activeCommercialTab === 'invoices' ? '#FFFFFF' : 'transparent',
                color: activeCommercialTab === 'invoices' ? '#0F172A' : '#64748B',
                boxShadow: activeCommercialTab === 'invoices' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Receipt size={14} />
              <span>Invoices ({invoices.length})</span>
            </button>

            <button
              onClick={() => setActiveCommercialTab('ledger')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: activeCommercialTab === 'ledger' ? 700 : 500,
                backgroundColor: activeCommercialTab === 'ledger' ? '#FFFFFF' : 'transparent',
                color: activeCommercialTab === 'ledger' ? '#0F172A' : '#64748B',
                boxShadow: activeCommercialTab === 'ledger' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <BookOpenCheck size={14} />
              <span>Transactions ({ledgerEntries.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Proposals */}
        {activeCommercialTab === 'proposals' && (
          <div>
            {proposals.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No commercial proposals sent yet. Qualified leads will generate proposals.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                      <th style={{ padding: '12px 20px' }}>Proposal Title</th>
                      <th style={{ padding: '12px 16px' }}>Client</th>
                      <th style={{ padding: '12px 16px' }}>Amount</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 20px' }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map((p, idx) => (
                      <tr key={p.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>
                          {p.title || `Commercial Proposal #${idx + 1}`}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          {p.client_company_name || p.client_id}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                          {p.currency} {((Number(p.amount_minor) || 0) / 100).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: p.status === 'CLIENT_APPROVED' ? '#ECFDF5' : '#EFF6FF',
                              color: p.status === 'CLIENT_APPROVED' ? '#059669' : '#2563EB',
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#64748B', fontSize: '12px' }}>
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Invoices */}
        {activeCommercialTab === 'invoices' && (
          <div>
            {invoices.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No invoices issued for your client milestones yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                      <th style={{ padding: '12px 20px' }}>Invoice Number</th>
                      <th style={{ padding: '12px 16px' }}>Due Date</th>
                      <th style={{ padding: '12px 16px' }}>Amount</th>
                      <th style={{ padding: '12px 16px' }}>Billing Status</th>
                      <th style={{ padding: '12px 20px' }}>Settlement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any, idx) => (
                      <tr key={inv.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>
                          {inv.invoice_number}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748B' }}>
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Immediate'}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                          {inv.currency} {((Number(inv.amount_minor) || 0) / 100).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: inv.status === 'PAID' ? '#ECFDF5' : '#FFFBEB',
                              color: inv.status === 'PAID' ? '#059669' : '#D97706',
                            }}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#64748B', fontSize: '12px' }}>
                          {inv.status === 'PAID' ? 'Confirmed by Flutterwave' : 'Pending Client Settlement'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Transactions */}
        {activeCommercialTab === 'ledger' && (
          <div>
            {ledgerEntries.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No transactions recorded yet. Transactions are recorded upon invoice payment.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                      <th style={{ padding: '10px 18px' }}>Date</th>
                      <th style={{ padding: '10px 14px' }}>Entry Type</th>
                      <th style={{ padding: '10px 14px' }}>Account Debited</th>
                      <th style={{ padding: '10px 14px' }}>Account Credited</th>
                      <th style={{ padding: '10px 14px' }}>Amount</th>
                      <th style={{ padding: '10px 18px' }}>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.map((entry, idx) => (
                      <tr key={entry.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 18px', color: '#64748B' }}>
                          {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>
                          {entry.entry_type}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#2563EB', fontWeight: 600 }}>
                          {entry.account_debited}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 600 }}>
                          {entry.account_credited}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0F172A' }}>
                          {entry.currency} {((Number(entry.amount_minor) || 0) / 100).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 18px', color: '#94A3B8', fontFamily: 'monospace' }}>
                          {entry.reference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* COMMISSION PAYOUT SETTINGS & POLICY PANEL                                 */}
      {/* ========================================================================= */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wallet size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Commission Payout Settings & Architecture
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
              Automatic accruals at 20% on all verified client invoice payments
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Commission Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>
              20.0% Guaranteed
            </div>
            <div style={{ fontSize: '11px', color: '#059669', marginTop: '6px', fontWeight: 600 }}>
              <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Auto-credited upon payment verification
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Configured Payout Destination</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
              {payoutSettings.destination
                ? `${payoutSettings.method === 'MPESA' ? 'M-Pesa' : 'Bank'} (${payoutSettings.destination})`
                : currency === 'KES'
                ? 'M-Pesa Payout Destination'
                : 'Bank Payout Destination'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
              Settlement currency: {payoutSettings.currency || currency}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Accounting Ledger Engine</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
              Balanced Double-Entry
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
              Immutable transaction records & verified audits
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
