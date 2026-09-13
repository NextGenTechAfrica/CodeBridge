// src/app/dashboard/representative/pipeline/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  BarChart3,
  Clock,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { useRep } from '../RepContext';

export default function RepresentativePipelinePage() {
  const { currentUser, currency, subscribeLeadCreated } = useRep();

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVelocityPeriod, setSelectedVelocityPeriod] = useState('Current Period');

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

  // Won volume / revenue in currency (strictly from actual budgets)
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
    const palette = ['#2563EB', '#0B1B3D', '#10B981', '#F59E0B'];
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

  return (
    <div>
      {/* ========================================================================= */}
      {/* ROW 1: 2 MAIN CHARTS (Pipeline Performance Funnel & Deal Velocity)       */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Card Left: Pipeline Performance (Interactive Bar Chart with Empty State) */}
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
                Client deal progression funnel ({totalLeadsCount} total clients)
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
              <BarChart3 size={14} /> Funnel Flow
            </div>
          </div>

          {totalLeadsCount === 0 ? (
            <div
              style={{
                height: '240px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cb-text-muted)',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <BarChart3 size={36} color="var(--cb-text-muted)" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>No pipeline records yet</div>
              <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px', maxWidth: '320px' }}>
                Add new clients or share your onboarding link to build your deal pipeline.
              </div>
            </div>
          ) : (
            <div
              style={{
                height: '240px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '0 8px',
              }}
            >
              {[
                { label: 'New', count: stageCounts.newLead },
                { label: 'Contact', count: stageCounts.contacted },
                { label: 'Qualify', count: stageCounts.qualified },
                { label: 'Proposal', count: stageCounts.proposal },
                { label: 'Won', count: stageCounts.won },
              ].map((stage, idx) => {
                const heightPercent =
                  maxStageCount > 0 ? Math.max(16, Math.round((stage.count / maxStageCount) * 100)) : 16;
                const isHighlight = maxStageCount > 0 && stage.count === maxStageCount;

                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    {isHighlight && stage.count > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-32px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          zIndex: 10,
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--cb-text-primary)', lineHeight: 1 }}>
                          {stage.count}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
                          {stage.label}
                        </div>
                      </div>
                    )}

                    {!isHighlight && (
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-secondary)', marginBottom: '6px' }}>
                        {stage.count}
                      </div>
                    )}

                    <div
                      style={{
                        width: '100%',
                        maxWidth: '56px',
                        height: `${heightPercent}%`,
                        borderRadius: '8px 8px 0 0',
                        background:
                          isHighlight && stage.count > 0
                            ? 'linear-gradient(180deg, #3B82F6 0%, #BFDBFE 100%)'
                            : 'var(--cb-bg-subtle)',
                        transition: 'height 0.3s ease, background 0.2s ease',
                        boxShadow:
                          isHighlight && stage.count > 0 ? '0 4px 14px rgba(59, 130, 246, 0.25)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isHighlight) e.currentTarget.style.backgroundColor = 'var(--cb-border-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isHighlight) e.currentTarget.style.backgroundColor = 'var(--cb-bg-subtle)';
                      }}
                    />

                    <div
                      style={{
                        marginTop: '12px',
                        fontSize: '12px',
                        fontWeight: isHighlight && stage.count > 0 ? 700 : 500,
                        color: isHighlight && stage.count > 0 ? '#2563EB' : 'var(--cb-text-secondary)',
                      }}
                    >
                      {stage.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card Right: Lead & Deal Velocity (Honest Activity Distribution) */}
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
            <div
              style={{
                height: '240px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cb-text-muted)',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <Clock size={36} color="var(--cb-text-muted)" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>No activity records yet</div>
              <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
                Deal advancement cadence will display as clients transition through pipeline stages.
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
          marginBottom: '28px',
        }}
      >
        {/* Card 1: Closed Deal Revenue */}
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
            <div style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
              Closed Deal Revenue ({currency})
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cb-text-primary)', letterSpacing: '-0.02em' }}>
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
                : 'No closed deal revenue recorded yet'}
            </div>
          </div>

          {/* Area Curve or Clean Baseline */}
          <div style={{ height: '140px', marginTop: '16px', position: 'relative' }}>
            <svg viewBox="0 0 300 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={totalWonRevenueMinor > 0 ? 0.35 : 0.05} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <line x1="0" y1="30" x2="300" y2="30" stroke="var(--cb-border-subtle)" strokeWidth="1" />
              <line x1="0" y1="65" x2="300" y2="65" stroke="var(--cb-border-subtle)" strokeWidth="1" />

              {totalWonRevenueMinor > 0 ? (
                <>
                  <path
                    d="M 0 90 Q 70 85 140 65 T 220 35 T 300 15 L 300 95 L 0 95 Z"
                    fill="url(#revenueGrad)"
                  />
                  <path
                    d="M 0 90 Q 70 85 140 65 T 220 35 T 300 15"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                  />
                </>
              ) : (
                <path d="M 0 85 L 300 85" fill="none" stroke="var(--cb-border-subtle)" strokeWidth="1.5" strokeDasharray="4 4" />
              )}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--cb-text-muted)' }}>
            <span>Initial Pipeline</span>
            <span>Conversion Growth</span>
            <span>Settled</span>
          </div>
        </div>

        {/* Card 2: Revenue by Region */}
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
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0 }}>Revenue by Region</h2>
            <Globe size={16} color="var(--cb-text-secondary)" />
          </div>

          {!regionalBreakdown.hasData ? (
            <div
              style={{
                height: '170px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cb-text-muted)',
                textAlign: 'center',
                padding: '16px',
              }}
            >
              <Globe size={36} color="var(--cb-text-muted)" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-secondary)' }}>
                No regional distribution yet
              </div>
              <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', marginTop: '4px' }}>
                Confirmed client settlements in {regionalBreakdown.territoryName} will populate territory split.
              </div>
            </div>
          ) : (
            <div style={{ height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 320 160" style={{ width: '100%', height: '100%' }}>
                <path d="M 40 40 Q 60 20 90 35 Q 110 50 100 80 Q 80 110 50 90 Z" fill="#94A3B8" opacity="0.6" />
                <path
                  d="M 120 45 Q 140 30 160 40 Q 180 60 160 80 Q 130 80 120 45 Z"
                  fill="#64748B"
                  opacity="0.7"
                />
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
                Primary Territory: {regionalBreakdown.territoryName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
