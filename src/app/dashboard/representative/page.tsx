// src/app/dashboard/representative/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Layers,
  TrendingUp,
  Briefcase,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useRep } from './RepContext';
import EarningsSummaryCard from '@/components/dashboard/representative/EarningsSummaryCard';
import ReferralBanner from '@/components/dashboard/representative/ReferralBanner';

export default function RepresentativeOverviewPage() {
  const { currentUser, currency, subscribeLeadCreated } = useRep();

  const [leads, setLeads] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalEarnedMinor: 0,
    totalPaidMinor: 0,
    totalPendingMinor: 0,
    recoveryBalanceMinor: 0,
    netPayableMinor: 0,
    currency: 'KES',
  });
  const [payoutSettings, setPayoutSettings] = useState<any>({
    currency: 'KES',
    method: 'MPESA',
    destination: '',
    bankCode: 'MPS',
    accountName: '',
    referralCode: 'KEN-001',
  });
  const [loading, setLoading] = useState(true);

  const loadOverviewData = useCallback(async () => {
    try {
      const [resLeads, resComms] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/representative/commissions'),
      ]);

      if (resLeads.ok) {
        const d = await resLeads.json();
        setLeads(d.leads || []);
      }

      if (resComms.ok) {
        const commData = await resComms.json();
        if (commData.summary) {
          setFinancialSummary(commData.summary);
        }
        if (commData.payoutSettings) {
          setPayoutSettings(commData.payoutSettings);
        }
      }
    } catch (err) {
      console.error('Failed to load representative overview data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Listen for lead creation from global modal to refresh
  useEffect(() => {
    const unsubscribe = subscribeLeadCreated(() => {
      loadOverviewData();
    });
    return unsubscribe;
  }, [subscribeLeadCreated, loadOverviewData]);

  // REAL DYNAMIC KPI METRICS (Zero data fabrication)
  const totalLeadsCount = leads.length;
  const wonLeads = useMemo(() => leads.filter((l) => l.status === 'WON' || l.status === 'CLIENT_APPROVED'), [leads]);
  const wonCount = wonLeads.length;
  const activeLeadsCount = useMemo(() => leads.filter((l) => !['WON', 'LOST'].includes(l.status)).length, [leads]);
  const conversionRate = totalLeadsCount > 0 ? Math.round((wonCount / totalLeadsCount) * 100) : 0;

  // Won volume / revenue in currency (strictly from actual budgets)
  const totalWonRevenueMinor = useMemo(
    () => wonLeads.reduce((acc, l) => acc + (Number(l.estimated_budget_minor) || 0), 0),
    [wonLeads]
  );
  const totalWonRevenueFormatted = (totalWonRevenueMinor / 100).toLocaleString();

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
        Loading Sales Metrics...
      </div>
    );
  }

  const repFirstName = currentUser?.firstName || currentUser?.name?.split(' ')[0] || 'Representative';

  return (
    <div>
      {/* Welcome & Quick Action Hero */}
      <div
        style={{
          backgroundColor: 'var(--cb-bg-card)',
          borderRadius: '16px',
          padding: '24px 28px',
          border: '1px solid var(--cb-border-subtle)',
          boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              <Sparkles size={12} /> Active Territory
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-secondary)' }}>
              {currentUser?.country?.name || (currency === 'KES' ? 'Kenya' : 'Nigeria')}
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Welcome back, {repFirstName}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', margin: '4px 0 0 0' }}>
            Here is an overview of your territory leads, active pipeline cadence, and commission disbursements.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/dashboard/representative/leads"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '24px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Users size={14} /> View Leads Roster
          </Link>
          <Link
            href="/dashboard/representative/pipeline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '24px',
              backgroundColor: 'var(--cb-bg-card)',
              color: 'var(--cb-text-primary)',
              border: '1px solid var(--cb-border-subtle)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Layers size={14} color="var(--cb-text-secondary)" /> Pipeline Funnel
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: 4 TOP KPI METRIC CARDS (Honest Real Data - Zero Mock Bloat)        */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        {/* Card 1: Total Leads */}
        <Link
          href="/dashboard/representative/leads"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              backgroundColor: 'var(--cb-bg-card)',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid var(--cb-border-subtle)',
              boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>Total Leads</div>
              <Users size={16} color="var(--cb-text-muted)" />
            </div>
            <div
              style={{
                fontSize: '34px',
                fontWeight: 800,
                color: 'var(--cb-text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {totalLeadsCount}
            </div>
            <div
              style={{
                marginTop: '14px',
                fontSize: '12px',
                color: totalLeadsCount > 0 ? '#059669' : 'var(--cb-text-muted)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{totalLeadsCount > 0 ? `${activeLeadsCount} active in pipeline` : 'No leads registered yet'}</span>
              <ArrowRight size={12} />
            </div>
          </div>
        </Link>

        {/* Card 2: Active Pipeline Deals */}
        <Link
          href="/dashboard/representative/pipeline"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              backgroundColor: 'var(--cb-bg-card)',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid var(--cb-border-subtle)',
              boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>Active Pipeline Deals</div>
              <Layers size={16} color="#2563EB" />
            </div>
            <div
              style={{
                fontSize: '34px',
                fontWeight: 800,
                color: '#2563EB',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {activeLeadsCount}
            </div>
            <div
              style={{
                marginTop: '14px',
                fontSize: '12px',
                color: activeLeadsCount > 0 ? '#2563EB' : 'var(--cb-text-muted)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{activeLeadsCount > 0 ? 'In active scoping / outreach' : '0 in-flight deals'}</span>
              <ArrowRight size={12} />
            </div>
          </div>
        </Link>

        {/* Card 3: Deals Closed (Won) */}
        <Link
          href="/dashboard/representative/clients"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              backgroundColor: 'var(--cb-bg-card)',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid var(--cb-border-subtle)',
              boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>Deals Closed (Won)</div>
              <Briefcase size={16} color="#059669" />
            </div>
            <div
              style={{
                fontSize: '34px',
                fontWeight: 800,
                color: 'var(--cb-text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {wonCount}
            </div>
            <div
              style={{
                marginTop: '14px',
                fontSize: '12px',
                color: wonCount > 0 ? '#059669' : 'var(--cb-text-muted)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{wonCount > 0 ? `${wonCount} converted clients` : '0 closed deals'}</span>
              <ArrowRight size={12} />
            </div>
          </div>
        </Link>

        {/* Card 4: Conversion Rate */}
        <Link
          href="/dashboard/representative/pipeline"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              backgroundColor: 'var(--cb-bg-card)',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid var(--cb-border-subtle)',
              boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>Conversion Rate</div>
              <TrendingUp size={16} color="var(--cb-text-primary)" />
            </div>
            <div
              style={{
                fontSize: '34px',
                fontWeight: 800,
                color: 'var(--cb-text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {conversionRate}%
            </div>
            <div
              style={{
                marginTop: '14px',
                fontSize: '12px',
                color: totalLeadsCount > 0 ? 'var(--cb-text-secondary)' : 'var(--cb-text-muted)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>
                {totalLeadsCount > 0 ? `${wonCount} of ${totalLeadsCount} converted` : 'Awaiting first conversion'}
              </span>
              <ArrowRight size={12} />
            </div>
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* CONSOLIDATED EARNINGS & COMMISSION SUMMARY CARD                           */}
      {/* ========================================================================= */}
      <EarningsSummaryCard financialSummary={financialSummary} payoutSettings={payoutSettings} />

      {/* ========================================================================= */}
      {/* 20% COMMISSION REFERRAL LINK BANNER                                       */}
      {/* ========================================================================= */}
      <ReferralBanner />

      {/* Quick Navigation Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        <Link
          href="/dashboard/representative/leads"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#BFDBFE';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <Users size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Leads & CRM Management
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                  {totalLeadsCount} registered leads in territory
                </p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Manage stage progression from New to Closed Won, communicate with prospective clients, and update scopes.
            </p>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Open Leads Console <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/representative/pipeline"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#BFDBFE';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <Layers size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Pipeline Performance & Funnel
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                  {currency} {totalWonRevenueFormatted} won deal volume
                </p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Analyze funnel throughput, track deal cadence velocity across intervals, and review regional settlement distribution.
            </p>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              View Pipeline Analytics <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/representative/performance"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#BFDBFE';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                }}
              >
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Commercial & Financial Records
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                  Proposals, Invoices & Double-Entry Ledger
                </p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Inspect client proposals, milestone billing invoices, verified ledger entries, and configure payout destinations.
            </p>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Open Financial Records <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
