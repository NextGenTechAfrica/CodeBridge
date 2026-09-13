// src/app/dashboard/representative/leads/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Building2,
  Search,
  MessageSquare,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import { useRep } from '../RepContext';

const DEAL_STAGES = [
  { key: 'ALL', label: 'All Records', match: () => true },
  { key: 'NEW', label: '1. New Client', match: (l: any) => l.status === 'NEW' || l.status === 'PROSPECT' },
  { key: 'CONTACTED', label: '2. Contacted', match: (l: any) => l.status === 'CONTACTED' },
  { key: 'QUALIFIED', label: '3. Qualified', match: (l: any) => l.status === 'QUALIFIED' },
  { key: 'PROPOSAL', label: '4. Proposal Sent', match: (l: any) => l.status === 'PROPOSAL' || l.status === 'REQUIREMENTS_COLLECTED' },
  { key: 'NEGOTIATION', label: '5. In Negotiation', match: (l: any) => l.status === 'NEGOTIATION' },
  { key: 'WON', label: '6. Closed Won', match: (l: any) => l.status === 'WON' || l.status === 'CLIENT_APPROVED' },
  { key: 'LOST', label: '7. Closed Lost', match: (l: any) => l.status === 'LOST' },
];

export default function RepresentativeLeadsPage() {
  const { currency, setLeadModalOpen, setFeedback, openChat, subscribeLeadCreated } = useRep();

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    const unsubscribe = subscribeLeadCreated(() => {
      loadLeads();
    });
    return unsubscribe;
  }, [subscribeLeadCreated, loadLeads]);

  const handleUpdateStatus = async (leadId: string, status: string, convertToClient: boolean = false) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, convertToClient }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback(data.message || `Lead status advanced to ${status}.`);
        loadLeads();
      }
    } catch {
      alert('Failed to update lead status.');
    }
  };

  // Real search filtering + stage filtering
  const currentStage = DEAL_STAGES.find((s) => s.key === stageFilter) || DEAL_STAGES[0];
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesStage = currentStage.match(l);
      if (!matchesStage) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (l.business_name && l.business_name.toLowerCase().includes(q)) ||
        (l.contact_person && l.contact_person.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.phone && l.phone.toLowerCase().includes(q)) ||
        (l.requirements && l.requirements.toLowerCase().includes(q))
      );
    });
  }, [leads, currentStage, searchQuery]);

  // Lead source breakdown
  const sourceBreakdown = useMemo(() => {
    if (leads.length === 0) {
      return {
        hasData: false,
        total: 0,
        topSource: null,
        sources: [] as { name: string; count: number; percentage: number; color: string }[],
      };
    }

    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const raw = (l.referral_source || 'Direct').toUpperCase().trim();
      let label = 'Direct';
      if (raw.includes('REF')) label = 'Referral';
      else if (raw.includes('INB') || raw.includes('WEB') || raw.includes('ORGANIC')) label = 'Inbound';
      else if (raw.includes('OUT') || raw.includes('CALL')) label = 'Outbound';
      else if (raw.includes('OFF')) label = 'Offline';
      counts[label] = (counts[label] || 0) + 1;
    });

    const total = leads.length;
    const palette: Record<string, string> = {
      Referral: '#2563EB',
      Direct: '#0B1B3D',
      Inbound: '#10B981',
      Outbound: '#F59E0B',
      Offline: '#8B5CF6',
    };

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const sources = sorted.map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      color: palette[name] || '#64748B',
    }));

    return {
      hasData: true,
      total,
      topSource: sources[0],
      sources,
    };
  }, [leads]);

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
        Loading Leads Roster...
      </div>
    );
  }

  return (
    <div>
      {/* Top Controls: Search Bar & Lead Source Card Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Search & Overview Banner */}
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
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0 }}>
              Search & Filter Territory Clients
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: '4px 0 16px 0' }}>
              Filter by client company, email, contact person, or specific scoping requirements.
            </p>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', color: 'var(--cb-text-muted)' }} />
              <input
                type="text"
                placeholder="Search clients by name, email, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 16px 11px 40px',
                  borderRadius: '12px',
                  border: '1px solid var(--cb-border-light)',
                  backgroundColor: 'var(--cb-bg-input, var(--cb-bg-surface))',
                  fontSize: '13px',
                  color: 'var(--cb-text-primary)',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: 'var(--cb-text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '18px',
              paddingTop: '16px',
              borderTop: '1px solid var(--cb-border-subtle)',
              fontSize: '12px',
              color: 'var(--cb-text-secondary)',
            }}
          >
            <span>
              Showing <strong>{filteredLeads.length}</strong> of {leads.length} clients
            </span>
            <button
              onClick={() => setLeadModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Client
            </button>
          </div>
        </div>

        {/* Lead Source Breakdown Donut Chart */}
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
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0 }}>Leads by Source</h2>
            <span style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', fontWeight: 500 }}>Attribution</span>
          </div>

          {!sourceBreakdown.hasData ? (
            <div
              style={{
                height: '150px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cb-text-muted)',
                textAlign: 'center',
              }}
            >
              <PieChart size={36} color="var(--cb-text-muted)" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-secondary)' }}>No source data recorded</div>
              <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', marginTop: '2px' }}>
                Source attribution begins on lead capture
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
              <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  {(() => {
                    let accumulatedPct = 0;
                    return sourceBreakdown.sources.map((src, idx) => {
                      const dashArray = `${src.percentage * 2.26} 226`;
                      const offset = `-${accumulatedPct * 2.26}`;
                      accumulatedPct += src.percentage;
                      return (
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke={src.color}
                          strokeWidth="16"
                          strokeDasharray={dashArray}
                          strokeDashoffset={offset}
                        />
                      );
                    });
                  })()}
                </svg>

                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>
                    {sourceBreakdown.topSource?.percentage || 0}%
                  </span>
                  <div style={{ fontSize: '10px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
                    {sourceBreakdown.topSource?.name || 'Direct'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
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
              fontWeight: 600,
            }}
          >
            {sourceBreakdown.hasData ? (
              sourceBreakdown.sources.map((src, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: src.color }} />
                  <span>
                    {src.name} {src.percentage}% ({src.count})
                  </span>
                </div>
              ))
            ) : (
              <span style={{ color: 'var(--cb-text-muted)' }}>Awaiting lead channel attribution</span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEADS PIPELINE ROSTER & 7-STAGE FILTER PILLS                              */}
      {/* ========================================================================= */}
      <div
        id="rep-leads-section"
        style={{
          backgroundColor: 'var(--cb-bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--cb-border-subtle)',
          boxShadow: 'var(--cb-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))',
          marginBottom: '32px',
          overflow: 'hidden',
        }}
      >
        {/* Header & Stage Pills */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--cb-border-subtle)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0 }}>
                Active Leads Roster ({filteredLeads.length})
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: '3px 0 0 0' }}>
                Manage client outreach, requirements gathering, and track automated status progression.
              </p>
            </div>

            <button
              onClick={() => setLeadModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Client
            </button>
          </div>

          {/* 7-Stage Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {DEAL_STAGES.map((s) => {
              const isSelected = stageFilter === s.key;
              const count = s.key === 'ALL' ? leads.length : leads.filter((l) => s.match(l)).length;
              return (
                <button
                  key={s.key}
                  onClick={() => setStageFilter(s.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? '#2563EB' : 'var(--cb-bg-subtle)',
                    color: isSelected ? '#FFFFFF' : 'var(--cb-text-secondary)',
                    border: '1px solid var(--cb-border-subtle)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{s.label}</span>
                  <span
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--cb-border-subtle)',
                      color: isSelected ? '#FFFFFF' : 'var(--cb-text-primary)',
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Leads Table with Clean Empty State */}
        {filteredLeads.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--cb-text-secondary)' }}>
            <Building2 size={36} color="var(--cb-text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>No clients found</div>
            <p style={{ fontSize: '13px', margin: '4px 0 16px 0', color: 'var(--cb-text-secondary)' }}>
              {searchQuery ? 'No clients matched your search query.' : 'There are no active clients in this status stage.'}
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
              + Add Client
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
                  <th style={{ padding: '12px 16px' }}>Source</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => {
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
                      {/* Business & Contact */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                          {lead.business_name || lead.company_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
                          {lead.contact_person} • {lead.email}
                        </div>
                      </td>

                      {/* Service Type */}
                      <td style={{ padding: '14px 16px', color: 'var(--cb-text-secondary)' }}>
                        {lead.business_type || 'Custom Software'}
                      </td>

                      {/* Budget */}
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                        {lead.currency || currency} {budgetFloat > 0 ? budgetFloat.toLocaleString() : 'Negotiating'}
                      </td>

                      {/* Source */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--cb-bg-subtle)',
                            color: 'var(--cb-text-secondary)',
                            border: '1px solid var(--cb-border-subtle)',
                          }}
                        >
                          {lead.referral_source || 'Direct'}
                        </span>
                      </td>

                      {/* Status */}
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

                      {/* Stage Actions */}
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

                          {lead.status === 'NEW' && (
                            <button
                              onClick={() => handleUpdateStatus(lead.id, 'CONTACTED')}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#2563EB',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Contacted
                            </button>
                          )}

                          {lead.status === 'CONTACTED' && (
                            <button
                              onClick={() => handleUpdateStatus(lead.id, 'QUALIFIED')}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#2563EB',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Qualify
                            </button>
                          )}

                          {lead.status === 'QUALIFIED' && (
                            <button
                              onClick={() => handleUpdateStatus(lead.id, 'PROPOSAL')}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#2563EB',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Send Proposal
                            </button>
                          )}

                          {lead.status === 'PROPOSAL' && (
                            <button
                              onClick={() => handleUpdateStatus(lead.id, 'NEGOTIATION')}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#F59E0B',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Negotiate
                            </button>
                          )}

                          {(lead.status === 'NEGOTIATION' ||
                            lead.status === 'PROPOSAL' ||
                            lead.status === 'QUALIFIED') && (
                            <button
                              onClick={() => handleUpdateStatus(lead.id, 'WON', true)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#059669',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Mark Won
                            </button>
                          )}
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
