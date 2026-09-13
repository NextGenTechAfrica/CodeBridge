// src/app/dashboard/representative/leads/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Building2,
  Search,
  MessageSquare,
  RefreshCw,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Briefcase,
  ChevronRight,
  Filter,
  Trash2,
} from 'lucide-react';
import { useRep } from '../RepContext';

const DEAL_STAGES = [
  { key: 'ALL', label: 'All', match: () => true },
  { key: 'NEW', label: 'New', match: (l: any) => l.status === 'NEW' || l.status === 'PROSPECT' },
  { key: 'CONTACTED', label: 'Contacted', match: (l: any) => l.status === 'CONTACTED' },
  { key: 'QUALIFIED', label: 'Planning', match: (l: any) => l.status === 'QUALIFIED' },
  { key: 'PROPOSAL', label: 'Proposal Sent', match: (l: any) => l.status === 'PROPOSAL' || l.status === 'REQUIREMENTS_COLLECTED' },
  { key: 'NEGOTIATION', label: 'Negotiating', match: (l: any) => l.status === 'NEGOTIATION' },
  { key: 'WON', label: 'Closed Won', match: (l: any) => l.status === 'WON' || l.status === 'CLIENT_APPROVED' },
  { key: 'LOST', label: 'Closed Lost', match: (l: any) => l.status === 'LOST' },
];

export default function RepresentativeLeadsPage() {
  const {
    currency,
    setLeadModalOpen,
    setFeedback,
    openChat,
    subscribeLeadCreated,
    referralLink,
    copyReferralLink,
    copiedReferral,
    openDeleteModal,
  } = useRep();

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
      console.error('Failed to load clients:', err);
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
        setFeedback(data.message || `Client status updated to ${status}.`);
        loadLeads();
      }
    } catch {
      alert('Failed to update client status.');
    }
  };

  // Filter clients by stage and search query
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

  const wonCount = useMemo(() => leads.filter((l) => l.status === 'WON' || l.status === 'CLIENT_APPROVED').length, [leads]);
  const activeCount = useMemo(() => leads.filter((l) => !['WON', 'LOST'].includes(l.status)).length, [leads]);

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
        Loading Clients...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ========================================================================= */}
      {/* 1. CLEAN PAGE HEADER: Title, Stats, and Quick Referral Link               */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <p style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', margin: 0 }}>
            Manage client details, project requirements, and status updates across your territory.
          </p>
        </div>

        {/* Share Onboarding Link Action (Clean, single companion action) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={copyReferralLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              color: copiedReferral ? '#059669' : 'var(--cb-text-secondary)',
              backgroundColor: copiedReferral ? 'rgba(16, 185, 129, 0.12)' : 'var(--cb-bg-card)',
              border: copiedReferral ? '1px solid #10B981' : '1px solid var(--cb-border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copiedReferral ? <Check size={14} /> : <Copy size={14} />}
            {copiedReferral ? 'Onboarding Link Copied' : 'Copy Onboarding Link'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THREE SUMMARY METRIC TILES: Simple, Real, No Robotic Jargon           */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--cb-bg-card)',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid var(--cb-border-subtle)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
            Total Registered
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cb-text-primary)', marginTop: '4px' }}>
            {leads.length}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--cb-bg-card)',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid var(--cb-border-subtle)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
            In Active Discussion
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#06B6D4', marginTop: '4px' }}>
            {activeCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--cb-bg-card)',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid var(--cb-border-subtle)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', fontWeight: 600 }}>
            Closed Deals (20% Earned)
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
            {wonCount}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CLIENT DIRECTORY: Unified Search, Stage Filter Tabs, and Table        */}
      {/* ========================================================================= */}
      <div
        style={{
          backgroundColor: 'var(--cb-bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--cb-border-subtle)',
          overflow: 'hidden',
        }}
      >
        {/* Unified Toolbar: Search Input + Stage Filter Tabs in One Place */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--cb-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Search Row */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', color: 'var(--cb-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by client name, company, email, or requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: '8px',
                border: '1px solid var(--cb-border-subtle)',
                backgroundColor: 'var(--cb-bg-surface)',
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

          {/* Filter Tabs (Horizontal Scrollable Pills) */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
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
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? '#2563EB' : 'var(--cb-bg-subtle)',
                    color: isSelected ? '#FFFFFF' : 'var(--cb-text-secondary)',
                    border: isSelected ? '1px solid #2563EB' : '1px solid var(--cb-border-subtle)',
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
                      borderRadius: '8px',
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

        {/* Client Table or Clean Empty State */}
        {filteredLeads.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--cb-text-secondary)' }}>
            <Building2 size={36} color="var(--cb-text-muted)" style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              {searchQuery ? 'No clients match your search' : 'No clients in this list yet'}
            </div>
            <p style={{ fontSize: '13px', margin: '6px auto 0 auto', color: 'var(--cb-text-secondary)', maxWidth: '380px', lineHeight: 1.5 }}>
              {searchQuery
                ? 'Try searching with a different term or clear the search query.'
                : 'Clients you add directly or who register using your referral link will appear here in real time.'}
            </p>
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
                  <th style={{ padding: '12px 20px' }}>Client & Contact</th>
                  <th style={{ padding: '12px 16px' }}>Project Scope</th>
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
                      {/* Client Name & Contact */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                          {lead.business_name || lead.company_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
                          {lead.contact_person} • {lead.email}
                        </div>
                      </td>

                      {/* Project Scope */}
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
                            backgroundColor: isWon
                              ? 'rgba(5, 150, 105, 0.12)'
                              : isLost
                              ? 'rgba(220, 38, 38, 0.12)'
                              : 'rgba(37, 99, 235, 0.12)',
                            color: isWon ? '#059669' : isLost ? '#DC2626' : '#2563EB',
                          }}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* Actions */}
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

                          <button
                            onClick={() => openDeleteModal(lead)}
                            title="Delete this client record"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              backgroundColor: 'rgba(239, 68, 68, 0.08)',
                              color: '#EF4444',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#EF4444';
                              e.currentTarget.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                              e.currentTarget.style.color = '#EF4444';
                            }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
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
