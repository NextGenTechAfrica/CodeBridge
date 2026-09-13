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
  Building2,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { useRep } from './RepContext';
import ReferralBanner from '@/components/dashboard/representative/ReferralBanner';

export default function RepresentativeOverviewPage() {
  const { currentUser, currency, setLeadModalOpen, openChat, subscribeLeadCreated } = useRep();

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOverviewData = useCallback(async () => {
    try {
      const resLeads = await fetch('/api/leads');
      if (resLeads.ok) {
        const d = await resLeads.json();
        setLeads(d.leads || []);
      }
    } catch (err) {
      console.error('Failed to load representative leads data:', err);
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
          color: 'var(--cb-text-secondary)',
          fontSize: '14px',
          fontWeight: 600,
          gap: '10px',
        }}
      >
        <RefreshCw className="animate-spin" size={18} />
        Loading Territory Overview...
      </div>
    );
  }

  const repFirstName = currentUser?.firstName || currentUser?.name?.split(' ')[0] || 'Representative';
  const recentLeads = leads.slice(0, 5);

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
              <Sparkles size={12} /> REFERRED TERRITORY
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-secondary)' }}>
              {currentUser?.country?.name || 'Assigned Territory'} Metro
            </span>
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--cb-text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Welcome back, {repFirstName}
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--cb-text-secondary)',
              margin: '4px 0 0 0',
            }}
          >
            Manage your regional business clients, follow up with qualified leads, and track project commissions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setLeadModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '24px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={15} /> Add Sales Lead
          </button>
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
      {/* 20% COMMISSION REFERRAL LINK BANNER                                       */}
      {/* ========================================================================= */}
      <ReferralBanner />

      {/* Recent Territory Leads Table (Operational Hub) */}
      <div
        style={{
          backgroundColor: 'var(--cb-bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--cb-border-subtle)',
          boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
          overflow: 'hidden',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--cb-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0 }}>
              Recent Territory Activity
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: '3px 0 0 0' }}>
              Latest prospective client engagements and stage updates in your market.
            </p>
          </div>

          <Link
            href="/dashboard/representative/leads"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#2563EB',
              textDecoration: 'none',
            }}
          >
            View All Leads ({leads.length}) <ArrowRight size={14} />
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--cb-text-secondary)' }}>
            <Building2 size={36} color="var(--cb-text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              No Territory Leads Yet
            </div>
            <p style={{ fontSize: '13px', margin: '4px 0 16px 0', color: 'var(--cb-text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              Start earning 20% commission by capturing qualified business requirements or sharing your unique referral link.
            </p>
            <button
              onClick={() => setLeadModalOpen(true)}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Register First Lead
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--cb-bg-surface)',
                    borderBottom: '1px solid var(--cb-border-subtle)',
                    color: 'var(--cb-text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: '12px 20px' }}>Business / Contact</th>
                  <th style={{ padding: '12px 16px' }}>Service Type</th>
                  <th style={{ padding: '12px 16px' }}>Budget</th>
                  <th style={{ padding: '12px 16px' }}>Stage</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, idx) => {
                  const budgetFloat = (Number(lead.estimated_budget_minor) || 0) / 100;
                  const isWon = lead.status === 'WON' || lead.status === 'CLIENT_APPROVED';
                  const isLost = lead.status === 'LOST';

                  return (
                    <tr
                      key={lead.id || idx}
                      style={{
                        borderBottom: '1px solid var(--cb-border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cb-bg-surface)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                          {lead.business_name || lead.company_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
                          {lead.contact_person} &bull; {lead.email}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--cb-text-secondary)' }}>
                        {lead.business_type || 'Custom Solution'}
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                        {lead.currency || currency} {budgetFloat > 0 ? budgetFloat.toLocaleString() : 'Negotiating'}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: isWon ? 'rgba(5, 150, 105, 0.12)' : isLost ? 'rgba(220, 38, 38, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                            color: isWon ? '#059669' : isLost ? '#DC2626' : '#2563EB',
                          }}
                        >
                          {lead.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => openChat(lead.id, 'LEAD')}
                            title="Chat with client"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--cb-border-subtle)',
                              backgroundColor: 'var(--cb-bg-subtle)',
                              color: 'var(--cb-text-primary)',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <MessageSquare size={13} /> Chat
                          </button>
                          <Link
                            href="/dashboard/representative/leads"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: '#2563EB',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            Manage <ArrowRight size={11} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
