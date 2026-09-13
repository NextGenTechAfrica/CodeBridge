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
  ShieldCheck,
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

  // Real dynamic KPI metrics
  const totalLeadsCount = leads.length;
  const wonLeads = useMemo(() => leads.filter((l) => l.status === 'WON' || l.status === 'CLIENT_APPROVED'), [leads]);
  const wonCount = wonLeads.length;
  const activeLeadsCount = useMemo(() => leads.filter((l) => !['WON', 'LOST'].includes(l.status)).length, [leads]);
  const conversionRate = totalLeadsCount > 0 ? Math.round((wonCount / totalLeadsCount) * 100) : 0;

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

  const getAvatarColors = (index: number) => {
    const palettes = [
      { bg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', text: '#FFFFFF' },
      { bg: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', text: '#FFFFFF' },
      { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', text: '#FFFFFF' },
      { bg: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', text: '#FFFFFF' },
      { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', text: '#FFFFFF' },
    ];
    return palettes[index % palettes.length];
  };

  const getStageBadgeStyle = (status: string) => {
    switch (status) {
      case 'WON':
      case 'CLIENT_APPROVED':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'LOST':
        return { bg: 'rgba(244, 63, 94, 0.15)', text: '#FB7185', border: '1px solid rgba(244, 63, 94, 0.3)' };
      case 'QUALIFIED':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'PROPOSAL':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'CONTACTED':
        return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8', border: '1px solid rgba(99, 102, 241, 0.3)' };
      default:
        return { bg: 'rgba(14, 165, 233, 0.15)', text: '#38BDF8', border: '1px solid rgba(14, 165, 233, 0.3)' };
    }
  };

  return (
    <div>
      {/* ========================================================================= */}
      {/* 1. WELCOME & ACTION HERO (Vibrant Ambient Styling)                         */}
      {/* ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.14) 0%, rgba(6, 182, 212, 0.08) 50%, var(--cb-bg-card) 100%)',
          borderRadius: '20px',
          padding: '26px 30px',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          marginBottom: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#38BDF8',
                backgroundColor: 'rgba(14, 165, 233, 0.15)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                padding: '3px 10px',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={12} /> REPRESENTATIVE CONSOLE
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-secondary)' }}>
              &bull; {currentUser?.country?.name || 'Assigned'} Metro &bull; 20% Guaranteed Commission
            </span>
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 900,
              color: 'var(--cb-text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 6px 0',
            }}
          >
            Welcome back, {repFirstName}
          </h1>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--cb-text-secondary)',
              margin: 0,
              maxWidth: '680px',
              lineHeight: 1.55,
            }}
          >
            Manage your regional business clients, follow up with active technical scopes, and track verified milestone commissions in {currency}.
          </p>
        </div>

        <button
          onClick={() => setLeadModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 22px rgba(37, 99, 235, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.4)';
          }}
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP 4 DYNAMIC KPI CARDS (Energetic, Vivid, & Distinct)                */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '18px',
          marginBottom: '26px',
        }}
      >
        {/* Card 1: Total Clients in Pipeline */}
        <Link href="/dashboard/representative/leads" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div
            style={{
              backgroundColor: 'var(--cb-bg-card)',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid var(--cb-border-subtle)',
              boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.4)';
              e.currentTarget.style.boxShadow = '0 10px 24px -5px rgba(37, 99, 235, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cb-border-subtle)';
              e.currentTarget.style.boxShadow = 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
                Total Clients
              </span>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(59, 130, 246, 0.35)',
                }}
              >
                <Users size={17} />
              </div>
            </div>
            <div style={{ fontSize: '34px', fontWeight: 900, color: 'var(--cb-text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {totalLeadsCount}
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: totalLeadsCount > 0 ? '#3B82F6' : 'var(--cb-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{totalLeadsCount > 0 ? `${activeLeadsCount} in active discussion` : 'No clients registered yet'}</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </Link>

        {/* Card 2: Active Pipeline & Deals */}
        <Link href="/dashboard/representative/pipeline" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div
            style={{
              backgroundColor: 'var(--cb-bg-card)',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid var(--cb-border-subtle)',
              boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
              e.currentTarget.style.boxShadow = '0 10px 24px -5px rgba(6, 182, 212, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cb-border-subtle)';
              e.currentTarget.style.boxShadow = 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
                Active Deals
              </span>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(6, 182, 212, 0.35)',
                }}
              >
                <Layers size={17} />
              </div>
            </div>
            <div style={{ fontSize: '34px', fontWeight: 900, color: '#06B6D4', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {activeLeadsCount}
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: activeLeadsCount > 0 ? '#06B6D4' : 'var(--cb-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{activeLeadsCount > 0 ? 'Technical scoping & proposals' : '0 in-flight deals'}</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </Link>

        {/* Card 3: Won & Converted Accounts */}
        <Link href="/dashboard/representative/clients" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div
            style={{
              backgroundColor: 'var(--cb-bg-card)',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid var(--cb-border-subtle)',
              boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
              e.currentTarget.style.boxShadow = '0 10px 24px -5px rgba(16, 185, 129, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cb-border-subtle)';
              e.currentTarget.style.boxShadow = 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
                Converted Accounts
              </span>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(16, 185, 129, 0.35)',
                }}
              >
                <Briefcase size={17} />
              </div>
            </div>
            <div style={{ fontSize: '34px', fontWeight: 900, color: '#10B981', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {wonCount}
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: wonCount > 0 ? '#10B981' : 'var(--cb-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{wonCount > 0 ? `${wonCount} converted clients` : '0 converted deals'}</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </Link>

        {/* Card 4: Overall Conversion Rate */}
        <Link href="/dashboard/representative/pipeline" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div
            style={{
              backgroundColor: 'var(--cb-bg-card)',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid var(--cb-border-subtle)',
              boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              e.currentTarget.style.boxShadow = '0 10px 24px -5px rgba(139, 92, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cb-border-subtle)';
              e.currentTarget.style.boxShadow = 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
                Conversion Rate
              </span>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(139, 92, 246, 0.35)',
                }}
              >
                <TrendingUp size={17} />
              </div>
            </div>
            <div style={{ fontSize: '34px', fontWeight: 900, color: '#A78BFA', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {conversionRate}%
            </div>
            {/* Mini Progress Bar */}
            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '9999px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${conversionRate}%`, height: '100%', backgroundColor: '#8B5CF6', borderRadius: '9999px' }} />
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--cb-text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{totalLeadsCount > 0 ? `${wonCount} of ${totalLeadsCount} won` : 'Awaiting first conversion'}</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 3. 20% COMMISSION REFERRAL LINK BANNER                                    */}
      {/* ========================================================================= */}
      <ReferralBanner />

      {/* ========================================================================= */}
      {/* 4. RECENT CLIENT ACTIVITY TABLE                                          */}
      {/* ========================================================================= */}
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
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0 }}>
              Recent Client Pipeline Activity
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: '3px 0 0 0' }}>
              Live prospective client records, service scopes, and stage updates across your territory.
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
              color: '#38BDF8',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            Open Clients CRM ({leads.length}) <ArrowRight size={14} />
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div style={{ padding: '52px 24px', textAlign: 'center', color: 'var(--cb-text-secondary)' }}>
            <Building2 size={40} color="var(--cb-text-muted)" style={{ margin: '0 auto 14px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>
              No Client Records Yet
            </div>
            <p style={{ fontSize: '13px', margin: '6px auto 20px auto', color: 'var(--cb-text-secondary)', maxWidth: '440px', lineHeight: 1.6 }}>
              Start earning 20% commission by capturing prospective business requirements or sharing your unique referral link.
            </p>
            <button
              onClick={() => setLeadModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              + Add Your First Client
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
                  <th style={{ padding: '12px 20px' }}>Client / Organization</th>
                  <th style={{ padding: '12px 16px' }}>Service Focus</th>
                  <th style={{ padding: '12px 16px' }}>Estimated Budget</th>
                  <th style={{ padding: '12px 16px' }}>Pipeline Stage</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, idx) => {
                  const budgetFloat = (Number(lead.estimated_budget_minor) || 0) / 100;
                  const companyName = lead.business_name || lead.company_name || 'Client';
                  const initials = companyName
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  const avatarColor = getAvatarColors(idx);
                  const stageStyle = getStageBadgeStyle(lead.status);

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: avatarColor.bg,
                              color: avatarColor.text,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '12px',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                              {companyName}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
                              {lead.contact_person} &bull; {lead.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--cb-text-primary)' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--cb-bg-surface)',
                            border: '1px solid var(--cb-border-subtle)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--cb-text-secondary)',
                          }}
                        >
                          {lead.business_type || 'Custom Solution'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                        {lead.currency || currency} {budgetFloat > 0 ? budgetFloat.toLocaleString() : 'Negotiating'}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backgroundColor: stageStyle.bg,
                            color: stageStyle.text,
                            border: stageStyle.border,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {lead.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => openChat(lead.id, 'LEAD')}
                            title="Chat with team regarding this client"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--cb-border-subtle)',
                              backgroundColor: 'var(--cb-bg-surface)',
                              color: 'var(--cb-text-primary)',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <MessageSquare size={13} /> Chat
                          </button>
                          <Link
                            href="/dashboard/representative/leads"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#2563EB',
                              color: '#FFFFFF',
                              fontSize: '12px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
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
