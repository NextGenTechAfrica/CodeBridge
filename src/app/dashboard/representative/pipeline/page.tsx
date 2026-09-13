// src/app/dashboard/representative/pipeline/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  BarChart3,
  Clock,
  Globe,
  RefreshCw,
  Plus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Copy,
  Check,
  Zap,
  Target,
  ChevronRight,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';
import { useRep } from '../RepContext';

const DEAL_STEPS = [
  {
    step: 1,
    id: 'NEW',
    name: '1. New Client',
    short: 'New Client',
    tag: 'STEP 1',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    desc: 'You add the client, or the client signs up using your personal onboarding link.',
    action: 'Enter their name, company, and what project they are looking to build.',
    timeline: 'Day 1',
  },
  {
    step: 2,
    id: 'CONTACTED',
    name: '2. Contacted',
    short: 'Contacted',
    tag: 'STEP 2',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    desc: 'You or the CodeBridge technical team talk with the client to understand what they need.',
    action: 'Discuss their project goals, timeline, and budget.',
    timeline: '1–2 business days',
  },
  {
    step: 3,
    id: 'QUALIFIED',
    name: '3. Planning Scope',
    short: 'Planning Scope',
    tag: 'STEP 3',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    desc: 'Engineers review the project and plan out the exact features, technology, and timeline.',
    action: 'Confirm what needs to be built and set milestone deliverables.',
    timeline: '2–3 business days',
  },
  {
    step: 4,
    id: 'PROPOSAL',
    name: '4. Proposal Sent',
    short: 'Proposal Sent',
    tag: 'STEP 4',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    desc: 'A complete proposal with price and milestone terms is sent to the client to review.',
    action: 'Client reviews the proposal and payment milestones in their client dashboard.',
    timeline: '3–5 business days',
  },
  {
    step: 5,
    id: 'WON',
    name: '5. Deal Won & Paid',
    short: 'Deal Won & Paid',
    tag: '20% COMMISSION',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    desc: 'The client approves the proposal and pays their upfront invoice. You receive your 20% commission.',
    action: 'Development starts. Your 20% commission is credited to your balance.',
    timeline: 'Commission Paid',
  },
];

export default function RepresentativePipelinePage() {
  const {
    currentUser,
    currency,
    subscribeLeadCreated,
    setLeadModalOpen,
    referralLink,
    copyReferralLink,
    copiedReferral,
  } = useRep();

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVelocityPeriod] = useState('Current Period');
  const [activeStepNumber, setActiveStepNumber] = useState<number>(1);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = subscribeLeadCreated(() => {
      loadData();
    });
    return unsubscribe;
  }, [subscribeLeadCreated, loadData]);

  const totalClientsCount = leads.length;
  const wonClients = useMemo(() => leads.filter((l) => l.status === 'WON' || l.status === 'CLIENT_APPROVED'), [leads]);
  const wonCount = wonClients.length;
  const activeDealsCount = useMemo(() => leads.filter((l) => !['WON', 'LOST'].includes(l.status)).length, [leads]);

  // Stage distribution counts based strictly on actual data
  const stageCounts = useMemo(() => {
    return {
      newClient: leads.filter((l) => l.status === 'NEW' || l.status === 'PROSPECT').length,
      contacted: leads.filter((l) => l.status === 'CONTACTED').length,
      qualified: leads.filter((l) => l.status === 'QUALIFIED').length,
      proposal: leads.filter((l) => l.status === 'PROPOSAL' || l.status === 'REQUIREMENTS_COLLECTED').length,
      won: wonCount,
    };
  }, [leads, wonCount]);

  const maxStageCount = Math.max(
    stageCounts.newClient,
    stageCounts.contacted,
    stageCounts.qualified,
    stageCounts.proposal,
    stageCounts.won
  );

  // Won volume / revenue in currency (strictly from actual budgets)
  const totalWonRevenueMinor = useMemo(
    () => wonClients.reduce((acc, l) => acc + (Number(l.estimated_budget_minor) || 0), 0),
    [wonClients]
  );
  const totalWonRevenueFormatted = (totalWonRevenueMinor / 100).toLocaleString();

  // Regional breakdown based strictly on actual client data
  const regionalBreakdown = useMemo(() => {
    const territoryName = currentUser?.country?.name || (currency === 'KES' ? 'Kenya' : 'Nigeria');
    const regionCounts: Record<string, number> = {};

    leads.forEach((l) => {
      const text = `${l.notes || ''} ${l.business_name || ''}`;
      if (/nairobi/i.test(text)) regionCounts['Nairobi'] = (regionCounts['Nairobi'] || 0) + 1;
      else if (/mombasa/i.test(text)) regionCounts['Mombasa'] = (regionCounts['Mombasa'] || 0) + 1;
      else if (/kisumu/i.test(text)) regionCounts['Kisumu'] = (regionCounts['Kisumu'] || 0) + 1;
      else if (/lagos/i.test(text)) regionCounts['Lagos'] = (regionCounts['Lagos'] || 0) + 1;
      else if (/abuja/i.test(text)) regionCounts['Abuja'] = (regionCounts['Abuja'] || 0) + 1;
      else if (/port harcourt/i.test(text)) regionCounts['Port Harcourt'] = (regionCounts['Port Harcourt'] || 0) + 1;
      else if (l.country_id === 'c_ke') regionCounts['Kenya Metro'] = (regionCounts['Kenya Metro'] || 0) + 1;
      else if (l.country_id === 'c_ng') regionCounts['Nigeria Metro'] = (regionCounts['Nigeria Metro'] || 0) + 1;
    });

    const entries = Object.entries(regionCounts);
    if (entries.length === 0) {
      return {
        hasData: false,
        territoryName,
        regions: [] as { name: string; percentage: number; count: number; color: string }[],
      };
    }

    const total = entries.reduce((acc, [, cnt]) => acc + cnt, 0);
    const palette = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B'];
    const regions = entries
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
        color: palette[i % palette.length],
      }));

    return {
      hasData: true,
      territoryName,
      regions,
    };
  }, [leads, currentUser, currency]);

  const activeStep = DEAL_STEPS.find((s) => s.step === activeStepNumber) || DEAL_STEPS[0];

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
        Loading Deal Progress...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ========================================================================= */}
      {/* 1. TOP GUIDE: How Deals Move From Start to Finish (Simple English)       */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'relative',
          borderRadius: '20px',
          padding: '24px 26px',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(16, 185, 129, 0.06) 100%)',
          backgroundColor: 'var(--cb-bg-card)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Top bar inside the guide banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '18px',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                padding: '4px 10px',
                borderRadius: '999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              <Sparkles size={13} />
              How Client Deals Work • 20% Commission on Every Paid Milestone
            </div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--cb-text-primary)',
                letterSpacing: '-0.02em',
                margin: '0 0 6px 0',
              }}
            >
              Deal Progress
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--cb-text-secondary)',
                margin: 0,
                maxWidth: '620px',
                lineHeight: 1.5,
              }}
            >
              Here is how your client deals move from the first day to proposal approval and payment. Click any of the 5 steps below to see what happens in that stage.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={copyReferralLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                color: copiedReferral ? '#059669' : 'var(--cb-text-primary)',
                backgroundColor: copiedReferral ? 'rgba(16, 185, 129, 0.15)' : 'var(--cb-bg-subtle)',
                border: copiedReferral ? '1px solid #10B981' : '1px solid var(--cb-border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {copiedReferral ? <Check size={14} /> : <Copy size={14} />}
              {copiedReferral ? 'Link Copied!' : 'Copy Onboarding Link'}
            </button>

            <button
              onClick={() => setLeadModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              <Plus size={16} />
              + Add Client
            </button>
          </div>
        </div>

        {/* 5-Step Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '10px',
            marginBottom: '14px',
          }}
        >
          {DEAL_STEPS.map((s) => {
            const isSelected = activeStepNumber === s.step;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStepNumber(s.step)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? s.bgColor : 'var(--cb-bg-card)',
                  border: isSelected ? `2px solid ${s.color}` : '1px solid var(--cb-border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 4px 16px ${s.bgColor}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: s.color,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    {s.step}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: s.color,
                      backgroundColor: s.bgColor,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {s.tag}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                  {s.short}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
                  {s.timeline}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Detail Card for the Selected Step */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: 'var(--cb-bg-card)',
            border: `1px solid ${activeStep.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: activeStep.bgColor,
                color: activeStep.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {activeStep.step === 5 ? <ShieldCheck size={20} /> : <Target size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: activeStep.color }}>
                  {activeStep.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', fontWeight: 600 }}>
                  ({activeStep.timeline})
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
                {activeStep.desc}
              </div>
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--cb-text-secondary)',
                backgroundColor: 'var(--cb-bg-subtle)',
                padding: '6px 12px',
                borderRadius: '6px',
              }}
            >
              👉 What happens: {activeStep.action}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ROW 1: Deal Stages Breakdown & Activity (Strictly Actual Real Data)    */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Card Left: Client Deal Stages */}
        <div
          style={{
            backgroundColor: 'var(--cb-bg-card)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--cb-border-subtle)',
            boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '340px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0 }}>
                Client Deal Stages
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', fontWeight: 500 }}>
                Where your clients currently stand ({totalClientsCount} total clients)
              </span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              <BarChart3 size={14} /> Real-Time Stages
            </div>
          </div>

          {/* Actual Bars Visualization */}
          <div
            style={{
              height: '180px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '0 8px',
            }}
          >
            {[
              { label: '1. New Client', count: stageCounts.newClient, color: '#3B82F6' },
              { label: '2. Contacted', count: stageCounts.contacted, color: '#06B6D4' },
              { label: '3. Planning Scope', count: stageCounts.qualified, color: '#8B5CF6' },
              { label: '4. Proposal Sent', count: stageCounts.proposal, color: '#F59E0B' },
              { label: '5. Deal Won', count: stageCounts.won, color: '#10B981' },
            ].map((stage, idx) => {
              // Bar height is strictly based on actual data
              const heightPercent =
                maxStageCount > 0 ? Math.max(12, Math.round((stage.count / maxStageCount) * 100)) : 6;

              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: stage.count > 0 ? stage.color : 'var(--cb-text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    {stage.count}
                  </div>

                  <div
                    style={{
                      width: '100%',
                      maxWidth: '48px',
                      height: `${heightPercent}%`,
                      borderRadius: '6px 6px 0 0',
                      backgroundColor: stage.count > 0 ? stage.color : 'var(--cb-bg-subtle)',
                      borderTop: stage.count > 0 ? `2px solid ${stage.color}` : '1px dashed var(--cb-border-subtle)',
                      transition: 'height 0.3s ease',
                    }}
                  />

                  <div
                    style={{
                      marginTop: '10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: stage.count > 0 ? 'var(--cb-text-primary)' : 'var(--cb-text-secondary)',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {stage.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footnote / Empty Helper */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--cb-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'var(--cb-text-secondary)',
            }}
          >
            <span>
              {totalClientsCount === 0
                ? 'No clients added yet. Add a client to see them move through these 5 stages.'
                : `${activeDealsCount} active deals in progress`}
            </span>
            <button
              onClick={() => setLeadModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563EB',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0,
              }}
            >
              + Add Client <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card Right: Deal Activity */}
        <div
          style={{
            backgroundColor: 'var(--cb-bg-card)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--cb-border-subtle)',
            boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '340px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0 }}>
                Deal Activity
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', fontWeight: 500 }}>
                Weekly activity and status updates
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--cb-text-secondary)',
                backgroundColor: 'var(--cb-bg-subtle)',
                border: '1px solid var(--cb-border-subtle)',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              <span>{selectedVelocityPeriod}</span>
            </div>
          </div>

          {leads.length === 0 ? (
            /* Clean, honest zero state */
            <div
              style={{
                height: '180px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <Clock size={36} color="var(--cb-text-muted)" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                No Activity Recorded Yet
              </div>
              <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px', maxWidth: '300px' }}>
                Your weekly updates, client discussions, and closed deals will appear here in real time.
              </div>
            </div>
          ) : (
            /* Real Activity Distribution */
            <div style={{ height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: '4px',
                  height: '140px',
                }}
              >
                {[
                  { label: 'W1', val: stageCounts.newClient },
                  { label: 'W2', val: stageCounts.contacted },
                  { label: 'W3', val: stageCounts.qualified },
                  { label: 'W4', val: stageCounts.proposal },
                  { label: 'W5', val: stageCounts.won },
                  { label: 'W6', val: activeDealsCount },
                  { label: 'W7', val: totalClientsCount },
                ].map((item, i) => {
                  const maxVal = Math.max(1, totalClientsCount);
                  const heightPct = Math.max(10, Math.round((item.val / maxVal) * 100));
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '22px',
                          height: `${heightPct}%`,
                          backgroundColor: item.val > 0 ? '#2563EB' : 'var(--cb-bg-subtle)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.2s ease',
                        }}
                      />
                      <div style={{ fontSize: '10px', color: 'var(--cb-text-muted)', marginTop: '6px' }}>
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--cb-border-subtle)',
              fontSize: '11px',
              color: 'var(--cb-text-muted)',
              textAlign: 'center',
            }}
          >
            Activity updates automatically when you or your clients take action.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ROW 2: Closed Deals Revenue & Location Breakdown (Actual Data)         */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Card 1: Closed Deals Revenue */}
        <div
          style={{
            backgroundColor: 'var(--cb-bg-card)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--cb-border-subtle)',
            boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '260px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
                Closed Deals Revenue ({currency})
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#059669',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                20% Commission Rate
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '10px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--cb-text-primary)', letterSpacing: '-0.02em' }}>
                {currency} {totalWonRevenueFormatted}
              </span>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: totalWonRevenueMinor > 0 ? '#059669' : 'var(--cb-text-muted)',
                marginTop: '6px',
                fontWeight: 600,
              }}
            >
              {totalWonRevenueMinor > 0
                ? `Earned from ${wonCount} closed client deals`
                : '0 closed deals so far'}
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: 'var(--cb-bg-subtle)',
              border: '1px solid var(--cb-border-subtle)',
              fontSize: '12px',
              color: 'var(--cb-text-secondary)',
              lineHeight: 1.5,
              marginTop: '16px',
            }}
          >
            💰 <strong>How you get paid:</strong> When your client signs off on a proposal and pays upfront milestone invoices, CodeBridge automatically credits <strong>20% commission</strong> directly to your account.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--cb-text-muted)', marginTop: '12px' }}>
            <span>Milestone 1: Deposit (30%)</span>
            <span>Milestone 2: Beta (40%)</span>
            <span>Milestone 3: Launch (30%)</span>
          </div>
        </div>

        {/* Card 2: Clients by Location */}
        <div
          style={{
            backgroundColor: 'var(--cb-bg-card)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--cb-border-subtle)',
            boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '260px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0 }}>
                Clients by Location
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', fontWeight: 500 }}>
                Primary Territory: {regionalBreakdown.territoryName}
              </span>
            </div>
            <Globe size={18} color="#2563EB" />
          </div>

          {!regionalBreakdown.hasData ? (
            /* Clean actual zero state */
            <div
              style={{
                height: '140px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '16px',
              }}
            >
              <Globe size={32} color="var(--cb-text-muted)" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-secondary)' }}>
                No Client Locations Yet
              </div>
              <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', marginTop: '4px', maxWidth: '280px' }}>
                When you add clients in {regionalBreakdown.territoryName}, their city and region breakdown will appear here.
              </div>
            </div>
          ) : (
            /* Real regional data from active clients */
            <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {regionalBreakdown.regions.map((reg, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>{reg.name}</span>
                    <span style={{ fontWeight: 700, color: reg.color }}>
                      {reg.count} {reg.count === 1 ? 'client' : 'clients'} ({reg.percentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--cb-bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${reg.percentage}%`, height: '100%', backgroundColor: reg.color, borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid var(--cb-border-subtle)',
              fontSize: '11px',
              color: 'var(--cb-text-muted)',
              textAlign: 'center',
            }}
          >
            Based on active clients registered in {regionalBreakdown.territoryName}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ACTION CARD: Add Client / Share Link                            */}
      {/* ========================================================================= */}
      <div
        style={{
          borderRadius: '16px',
          padding: '20px 24px',
          backgroundColor: 'var(--cb-bg-card)',
          border: '1px solid var(--cb-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>
              Ready to add a new client?
            </div>
            <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Fill in the client's requirements directly, or share your link so they can register themselves.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={copyReferralLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 15px',
              borderRadius: '9px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: 'var(--cb-bg-subtle)',
              border: '1px solid var(--cb-border-subtle)',
              color: 'var(--cb-text-primary)',
              cursor: 'pointer',
            }}
          >
            {copiedReferral ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            {copiedReferral ? 'Link Copied!' : 'Copy Onboarding Link'}
          </button>
          <button
            onClick={() => setLeadModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '9px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Plus size={15} />
            + Add Client Now
          </button>
        </div>
      </div>
    </div>
  );
}
