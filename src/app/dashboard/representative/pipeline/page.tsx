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
  Info,
  Copy,
  Check,
  Zap,
  Target,
  ChevronRight,
  DollarSign,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';
import { useRep } from '../RepContext';

const STAGE_DETAILS = [
  {
    step: 1,
    id: 'NEW',
    name: '1. Client Intake',
    short: 'Intake',
    tag: 'NEW / REFERRAL',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    desc: 'Prospective client registered via direct intake or through your unique self-onboarding link.',
    action: 'Capture contact info, industry, and high-level requirements in 60 seconds.',
    timeline: 'Day 1',
  },
  {
    step: 2,
    id: 'CONTACTED',
    name: '2. Discovery & Contact',
    short: 'Discovery',
    tag: 'OUTREACH',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    desc: 'Representative or CodeBridge solution architect connects to clarify scope, constraints, and timeline.',
    action: 'Verify decision-maker, core pain points, and target launch window.',
    timeline: '1–2 business days',
  },
  {
    step: 3,
    id: 'QUALIFIED',
    name: '3. Requirements Scoped',
    short: 'Scoped',
    tag: 'ARCHITECT REVIEW',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    desc: 'Technical architecture, tech stack, and deliverable sprint breakdown are formulated.',
    action: 'Engineering feasibility review and budget alignment confirmed.',
    timeline: '2–3 business days',
  },
  {
    step: 4,
    id: 'PROPOSAL',
    name: '4. Proposal Issued',
    short: 'Proposal',
    tag: 'MILESTONE QUOTE',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    desc: 'Itemized milestone proposal published to client portal (e.g. 30% Deposit, 40% Beta, 30% Final Launch).',
    action: 'Client reviews deliverables, schedule, and contract terms directly in portal.',
    timeline: '3–5 business days',
  },
  {
    step: 5,
    id: 'WON',
    name: '5. Won Account',
    short: 'Won & Paid',
    tag: '20% PAYOUT TRIGGER',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    desc: 'Client accepts proposal and funds upfront invoice. Spawns active project + 20% commission credit.',
    action: 'Project kicks off in engineering. 20% commission accrues automatically on settled milestones.',
    timeline: 'Instant payout trigger',
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
  const [selectedVelocityPeriod, setSelectedVelocityPeriod] = useState('Current Period');
  const [activeStageStep, setActiveStageStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'actual' | 'blueprint'>('actual');

  const loadPipelineData = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to load pipeline data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  useEffect(() => {
    const unsubscribe = subscribeLeadCreated(() => {
      loadPipelineData();
    });
    return unsubscribe;
  }, [subscribeLeadCreated, loadPipelineData]);

  const totalLeadsCount = leads.length;
  const wonLeads = useMemo(() => leads.filter((l) => l.status === 'WON' || l.status === 'CLIENT_APPROVED'), [leads]);
  const wonCount = wonLeads.length;
  const activeLeadsCount = useMemo(() => leads.filter((l) => !['WON', 'LOST'].includes(l.status)).length, [leads]);

  // Stage distribution counts for Pipeline Performance bar chart
  const stageCounts = useMemo(() => {
    return {
      newLead: leads.filter((l) => l.status === 'NEW' || l.status === 'PROSPECT').length,
      contacted: leads.filter((l) => l.status === 'CONTACTED').length,
      qualified: leads.filter((l) => l.status === 'QUALIFIED').length,
      proposal: leads.filter((l) => l.status === 'PROPOSAL' || l.status === 'REQUIREMENTS_COLLECTED').length,
      won: wonCount,
    };
  }, [leads, wonCount]);

  const maxStageCount = Math.max(
    stageCounts.newLead,
    stageCounts.contacted,
    stageCounts.qualified,
    stageCounts.proposal,
    stageCounts.won
  );

  // Won volume / revenue in currency
  const totalWonRevenueMinor = useMemo(
    () => wonLeads.reduce((acc, l) => acc + (Number(l.estimated_budget_minor) || 0), 0),
    [wonLeads]
  );
  const totalWonRevenueFormatted = (totalWonRevenueMinor / 100).toLocaleString();

  // Regional breakdown
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
        regions: [] as { name: string; percentage: number; color: string }[],
      };
    }

    const total = entries.reduce((acc, [, cnt]) => acc + cnt, 0);
    const palette = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B'];
    const regions = entries
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        percentage: Math.round((count / total) * 100),
        color: palette[i % palette.length],
      }));

    return {
      hasData: true,
      territoryName,
      regions,
    };
  }, [leads, currentUser, currency]);

  const activeStage = STAGE_DETAILS.find((s) => s.step === activeStageStep) || STAGE_DETAILS[0];

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
        Loading Pipeline Analytics...
      </div>
    );
  }

  // Determine whether to display blueprint preview in Funnel card
  const isDisplayingBlueprint = totalLeadsCount === 0 || viewMode === 'blueprint';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ========================================================================= */}
      {/* HERO / STAGE ROADMAP BANNER: Interactive Visual Guide & Instant Actions  */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'relative',
          borderRadius: '20px',
          padding: '26px 28px',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(16, 185, 129, 0.06) 100%)',
          backgroundColor: 'var(--cb-bg-card)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Ambient Glow Orb */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Bar inside Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
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
              CodeBridge Revenue Engine • 20% Commission on All Milestones
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
              Deal Pipeline & Client Journey
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
              Understand how every prospective client advances through technical discovery into active engineering and guaranteed milestone commissions. Click any stage to inspect the workflow.
            </p>
          </div>

          {/* Action Buttons */}
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
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Plus size={16} />
              + Add Client
            </button>
          </div>
        </div>

        {/* 5-Step Stage Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {STAGE_DETAILS.map((stage) => {
            const isSelected = activeStageStep === stage.step;
            return (
              <button
                key={stage.step}
                onClick={() => setActiveStageStep(stage.step)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? stage.bgColor : 'var(--cb-bg-card)',
                  border: isSelected ? `2px solid ${stage.color}` : '1px solid var(--cb-border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: isSelected ? `0 4px 16px ${stage.bgColor}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: stage.color,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    {stage.step}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: stage.color,
                      backgroundColor: stage.bgColor,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {stage.tag}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                  {stage.short}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
                  {stage.timeline}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Detail Callout for Selected Stage */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: 'var(--cb-bg-card)',
            border: `1px solid ${activeStage.borderColor}`,
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
                backgroundColor: activeStage.bgColor,
                color: activeStage.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {activeStage.step === 5 ? <ShieldCheck size={20} /> : <Target size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: activeStage.color }}>
                  {activeStage.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', fontWeight: 600 }}>
                  ({activeStage.timeline})
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
                {activeStage.desc}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--cb-text-secondary)',
                backgroundColor: 'var(--cb-bg-subtle)',
                padding: '5px 10px',
                borderRadius: '6px',
              }}
            >
              ⚡ Action: {activeStage.action}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: 2 MAIN CHARTS (Pipeline Performance Funnel & Deal Velocity)       */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Card Left: Pipeline Performance (Interactive Bar Chart with Blueprint Preview) */}
        <div
          id="pipeline-perf-card"
          style={{
            backgroundColor: 'var(--cb-bg-card)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--cb-border-subtle)',
            boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0 }}>
                Pipeline Performance
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', fontWeight: 500 }}>
                {totalLeadsCount > 0
                  ? `Client deal progression funnel (${totalLeadsCount} active clients)`
                  : 'Interactive conversion model (Add clients to record live velocity)'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {totalLeadsCount > 0 && (
                <button
                  onClick={() => setViewMode(viewMode === 'actual' ? 'blueprint' : 'actual')}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--cb-bg-subtle)',
                    border: '1px solid var(--cb-border-subtle)',
                    color: 'var(--cb-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {viewMode === 'actual' ? 'Show Blueprint' : 'Show Live'}
                </button>
              )}
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
                <BarChart3 size={14} /> Funnel Flow
              </div>
            </div>
          </div>

          {/* Funnel Visualization */}
          <div
            style={{
              height: '240px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '0 8px',
              position: 'relative',
            }}
          >
            {[
              { label: 'New Intake', count: isDisplayingBlueprint ? 10 : stageCounts.newLead, blueprintVal: 100, color: '#3B82F6' },
              { label: 'Discovery', count: isDisplayingBlueprint ? 8 : stageCounts.contacted, blueprintVal: 80, color: '#06B6D4' },
              { label: 'Scoped', count: isDisplayingBlueprint ? 6 : stageCounts.qualified, blueprintVal: 60, color: '#8B5CF6' },
              { label: 'Proposal', count: isDisplayingBlueprint ? 4 : stageCounts.proposal, blueprintVal: 40, color: '#F59E0B' },
              { label: 'Won (20%)', count: isDisplayingBlueprint ? 3 : stageCounts.won, blueprintVal: 30, color: '#10B981' },
            ].map((stage, idx) => {
              const heightPercent = isDisplayingBlueprint
                ? stage.blueprintVal
                : maxStageCount > 0
                ? Math.max(16, Math.round((stage.count / maxStageCount) * 100))
                : 16;
              const isHighlight = !isDisplayingBlueprint && maxStageCount > 0 && stage.count === maxStageCount;

              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isDisplayingBlueprint ? stage.color : 'var(--cb-text-secondary)',
                      marginBottom: '8px',
                    }}
                  >
                    {isDisplayingBlueprint ? `${stage.blueprintVal}%` : stage.count}
                  </div>

                  <div
                    style={{
                      width: '100%',
                      maxWidth: '56px',
                      height: `${heightPercent}%`,
                      borderRadius: '8px 8px 0 0',
                      background: isDisplayingBlueprint
                        ? `linear-gradient(180deg, ${stage.color} 0%, rgba(37, 99, 235, 0.15) 100%)`
                        : isHighlight && stage.count > 0
                        ? 'linear-gradient(180deg, #3B82F6 0%, #BFDBFE 100%)'
                        : 'var(--cb-bg-subtle)',
                      borderTop: isDisplayingBlueprint ? `2px solid ${stage.color}` : 'none',
                      transition: 'height 0.3s ease, background 0.2s ease',
                      boxShadow: isDisplayingBlueprint
                        ? `0 4px 14px ${stage.color}25`
                        : isHighlight && stage.count > 0
                        ? '0 4px 14px rgba(59, 130, 246, 0.25)'
                        : 'none',
                    }}
                  />

                  <div
                    style={{
                      marginTop: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isDisplayingBlueprint ? stage.color : 'var(--cb-text-secondary)',
                      textAlign: 'center',
                    }}
                  >
                    {stage.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Footnote on Funnel */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--cb-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--cb-text-muted)',
            }}
          >
            <span>
              {isDisplayingBlueprint ? '★ Benchmark Funnel Model' : `Active Funnel (${totalLeadsCount} clients)`}
            </span>
            <button
              onClick={() => setLeadModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563EB',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0,
              }}
            >
              + Add Client to Funnel <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Card Right: Deal & Client Velocity */}
        <div
          id="velocity-perf-card"
          style={{
            backgroundColor: 'var(--cb-bg-card)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--cb-border-subtle)',
            boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0 }}>
                Deal & Client Velocity
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', fontWeight: 500 }}>
                Cadence of interactions & pipeline progression
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
            /* Rich Velocity Benchmark Visualizer when empty */
            <div style={{ height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Clock size={20} color="#2563EB" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--cb-text-primary)' }}>Standard Velocity Benchmark:</strong> Average time from client intake to signed proposal is <strong>7.4 business days</strong>.
                </div>
              </div>

              {/* 3 Milestone Trackers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
                {[
                  { label: 'Day 1–2: Discovery Call & Tech Alignment', pct: '100%', color: '#3B82F6', badge: 'Rapid Response' },
                  { label: 'Day 3–5: Architecture & Milestone Proposal', pct: '65%', color: '#8B5CF6', badge: 'Technical Scope' },
                  { label: 'Day 6–10: Client Approval & Milestone Deposit', pct: '35%', color: '#10B981', badge: '20% Commission' },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: 'var(--cb-text-primary)' }}>{item.label}</span>
                      <span style={{ color: item.color }}>{item.badge}</span>
                    </div>
                    <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--cb-bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: item.pct,
                          height: '100%',
                          background: `linear-gradient(90deg, ${item.color} 0%, rgba(37, 99, 235, 0.3) 100%)`,
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textAlign: 'center' }}>
                Advancement cadence tracks in real-time as your prospective clients progress.
              </div>
            </div>
          ) : (
            <div style={{ height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: '4px',
                  height: '180px',
                }}
              >
                {[
                  { label: 'W1', val: Math.min(100, Math.max(15, stageCounts.newLead * 20)) },
                  { label: 'W2', val: Math.min(100, Math.max(15, stageCounts.contacted * 25)) },
                  { label: 'W3', val: Math.min(100, Math.max(15, stageCounts.qualified * 30)) },
                  { label: 'W4', val: Math.min(100, Math.max(15, stageCounts.proposal * 35)) },
                  { label: 'W5', val: Math.min(100, Math.max(15, stageCounts.won * 40)) },
                  { label: 'W6', val: Math.min(100, Math.max(20, activeLeadsCount * 12)) },
                  { label: 'W7', val: Math.min(100, Math.max(25, totalLeadsCount > 5 ? 65 : 25)) },
                  { label: 'W8', val: Math.min(100, Math.max(20, wonCount > 0 ? 80 : 20)) },
                  { label: 'W9', val: Math.min(100, Math.max(25, activeLeadsCount > 3 ? 70 : 30)) },
                  { label: 'W10', val: Math.min(100, Math.max(20, stageCounts.proposal > 0 ? 60 : 20)) },
                  { label: 'W11', val: Math.min(100, Math.max(15, wonCount > 1 ? 85 : 25)) },
                  { label: 'W12', val: Math.min(100, Math.max(30, totalLeadsCount > 10 ? 90 : 35)) },
                ].map((item, i) => {
                  const isPeak = item.val >= 75;
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
                          maxWidth: '18px',
                          height: `${item.val}%`,
                          backgroundColor: isPeak ? '#3B82F6' : 'var(--cb-bg-subtle)',
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 0.2s ease',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  fontSize: '11px',
                  color: 'var(--cb-text-muted)',
                  fontWeight: 500,
                }}
              >
                <span>Start of Period</span>
                <span>Mid-Cycle Cadence</span>
                <span>Active Deals</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: ANALYTIC CARDS (Closed Deal Revenue & Regional Distribution)        */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Card 1: Closed Deal Revenue & Commission Engine */}
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
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
                Closed Deal Revenue ({currency})
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
                20% Net Commission
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cb-text-primary)', letterSpacing: '-0.02em' }}>
                {currency} {totalWonRevenueFormatted}
              </span>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: totalWonRevenueMinor > 0 ? '#059669' : 'var(--cb-text-muted)',
                marginTop: '4px',
                fontWeight: 600,
              }}
            >
              {totalWonRevenueMinor > 0
                ? `Accrued from ${wonCount} won client deals`
                : 'Ready for first closed client project'}
            </div>
          </div>

          {/* Revenue Graphic or Commission Micro-Card */}
          {totalWonRevenueMinor > 0 ? (
            <div style={{ height: '130px', marginTop: '16px', position: 'relative' }}>
              <svg viewBox="0 0 300 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <line x1="0" y1="30" x2="300" y2="30" stroke="var(--cb-border-subtle)" strokeWidth="1" />
                <line x1="0" y1="65" x2="300" y2="65" stroke="var(--cb-border-subtle)" strokeWidth="1" />
                <path d="M 0 90 Q 70 85 140 65 T 220 35 T 300 15 L 300 95 L 0 95 Z" fill="url(#revenueGrad)" />
                <path d="M 0 90 Q 70 85 140 65 T 220 35 T 300 15" fill="none" stroke="#2563EB" strokeWidth="2.5" />
              </svg>
            </div>
          ) : (
            <div
              style={{
                margin: '16px 0',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--cb-bg-subtle)',
                border: '1px solid var(--cb-border-subtle)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '4px' }}>
                💡 Sample Commission Payout Model:
              </div>
              <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', lineHeight: 1.4 }}>
                A typical <strong>{currency} {currency === 'KES' ? '250,000' : '2,500,000'}</strong> portal delivers a <strong>{currency} {currency === 'KES' ? '50,000' : '500,000'}</strong> representative commission, disbursed automatically upon milestone sign-offs.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--cb-text-muted)' }}>
            <span>Milestone 1: Deposit (30%)</span>
            <span>Milestone 2: Beta (40%)</span>
            <span>Milestone 3: Launch (30%)</span>
          </div>
        </div>

        {/* Card 2: Revenue by Region & Target Sectors */}
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0 }}>
                Revenue by Region
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--cb-text-secondary)' }}>
                Assigned Territory: {regionalBreakdown.territoryName}
              </span>
            </div>
            <Globe size={18} color="#2563EB" />
          </div>

          {!regionalBreakdown.hasData ? (
            /* High-Demand Territory Sectors when empty */
            <div style={{ padding: '12px 0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '10px' }}>
                🔥 TOP IN-DEMAND SOLUTIONS IN {regionalBreakdown.territoryName.toUpperCase()}:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { sector: 'E-Commerce & Online Ordering', share: '36%', color: '#2563EB' },
                  { sector: 'School & Student Portals', share: '28%', color: '#06B6D4' },
                  { sector: 'ERP, POS & Inventory Systems', share: '22%', color: '#8B5CF6' },
                  { sector: 'Clinic & Healthcare Booking', share: '14%', color: '#10B981' },
                ].map((sec, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sec.color }} />
                      <span style={{ color: 'var(--cb-text-primary)', fontWeight: 500 }}>{sec.sector}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: sec.color }}>{sec.share}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 320 160" style={{ width: '100%', height: '100%' }}>
                <path d="M 40 40 Q 60 20 90 35 Q 110 50 100 80 Q 80 110 50 90 Z" fill="#94A3B8" opacity="0.6" />
                <path d="M 120 45 Q 140 30 160 40 Q 180 60 160 80 Q 130 80 120 45 Z" fill="#64748B" opacity="0.7" />
                <path d="M 140 85 Q 170 80 190 105 Q 170 145 140 125 Z" fill="#2563EB" opacity="0.85" />
                <path d="M 210 35 Q 260 30 290 60 Q 270 95 220 85 Z" fill="#CBD5E1" opacity="0.5" />
                <circle cx="165" cy="100" r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="165" cy="100" r="8" fill="none" stroke="#10B981" strokeWidth="1" opacity="0.7" />
              </svg>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'center',
              paddingTop: '12px',
              borderTop: '1px solid var(--cb-border-subtle)',
              fontSize: '11px',
              color: 'var(--cb-text-secondary)',
              fontWeight: 700,
            }}
          >
            {regionalBreakdown.hasData ? (
              regionalBreakdown.regions.map((reg, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: reg.color }} />
                  <span>
                    {reg.name} {reg.percentage}%
                  </span>
                </div>
              ))
            ) : (
              <span style={{ color: 'var(--cb-text-muted)', fontWeight: 500 }}>
                Primary Territory: {regionalBreakdown.territoryName} Metro Focus
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM CALLOUT: Dual Action Card                                         */}
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
              Ready to onboard your next client into the pipeline?
            </div>
            <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Fill the 60-second intake form or share your tracked self-onboarding URL to register accounts instantly.
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
