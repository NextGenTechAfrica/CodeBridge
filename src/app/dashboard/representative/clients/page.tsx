// src/app/dashboard/representative/clients/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  RefreshCw,
  Plus,
  X,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useRep } from '../RepContext';

export default function RepClientsPage() {
  const { currentUser, currency } = useRep();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  // Onboard Prospect Modal
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    requirements: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      const [resProjects, resClients] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/representative/clients'),
      ]);

      if (resProjects.ok) {
        const d = await resProjects.json();
        setProjects(d.projects || []);
      }
      if (resClients.ok) {
        const d = await resClients.json();
        setClients(d.clients || []);
      }
    } catch (err) {
      console.error('Failed to load clients & projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardForm.companyName.trim() || !onboardForm.email.trim()) {
      alert('Please provide at least the client company name and contact email.');
      return;
    }

    setOnboardSubmitting(true);
    try {
      const res = await fetch('/api/representative/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardForm),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback(`Client prospect "${onboardForm.companyName}" successfully onboarded and attributed to you!`);
        setOnboardForm({
          companyName: '',
          contactPerson: '',
          email: '',
          phone: '',
          requirements: '',
          notes: '',
        });
        setOnboardModalOpen(false);
        setTimeout(() => setFeedback(''), 5000);
        await loadData();
      } else {
        alert(data.error || 'Failed to onboard client prospect.');
      }
    } catch {
      alert('Network error onboarding client.');
    } finally {
      setOnboardSubmitting(false);
    }
  };

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
        Loading Clients & Projects...
      </div>
    );
  }

  return (
    <div>
      {/* Header Info Banner */}
      <div
        style={{
          backgroundColor: 'var(--cb-bg-card)',
          borderRadius: '16px',
          padding: '22px 26px',
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
                border: '1px solid rgba(37, 99, 235, 0.25)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              <Briefcase size={12} /> REFERRED ACCOUNTS
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-secondary)' }}>
              Attributed Clients & Engineering Engagements
            </span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Referred Clients & Active Projects
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: '4px 0 0 0' }}>
            Clients registered with your partner referral code or registered as prospects. Commission is tracked against verified milestones.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <UserCheck size={14} /> {clients.length} Attributed Clients
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'var(--cb-bg-subtle)',
              color: 'var(--cb-text-primary)',
              border: '1px solid var(--cb-border-subtle)',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <Users size={14} color="var(--cb-text-secondary)" /> {projects.length} Active Projects
          </span>

          <button
            onClick={() => setOnboardModalOpen(true)}
            className="cb-btn cb-btn-primary cb-btn-sm"
            style={{ gap: '6px' }}
          >
            <Plus size={15} /> Onboard Client Prospect
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(5, 150, 105, 0.15)',
            border: '1px solid rgba(5, 150, 105, 0.3)',
            color: '#34D399',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={16} />
          {feedback}
        </div>
      )}

      {/* Attributed Clients Roster Table */}
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
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--cb-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0 }}>
              Attributed Clients Directory ({clients.length})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: '3px 0 0 0' }}>
              Clients assigned to your territory or signed up using your referral code.
            </p>
          </div>
          <span className="cb-badge cb-badge-neutral">{clients.length} Clients</span>
        </div>

        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--cb-text-secondary)', fontSize: '13px' }}>
            <Building2 size={36} color="var(--cb-text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>No attributed clients yet</div>
            <p style={{ fontSize: '13px', margin: '4px 0 16px 0', color: 'var(--cb-text-secondary)' }}>
              Share your referral link with prospective clients or onboard offline leads directly.
            </p>
            <button
              onClick={() => setOnboardModalOpen(true)}
              className="cb-btn cb-btn-secondary cb-btn-sm"
              style={{ margin: '0 auto', gap: '6px' }}
            >
              <Plus size={14} /> Onboard Your First Client Prospect
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
                  <th style={{ padding: '12px 20px' }}>Client Organization</th>
                  <th style={{ padding: '12px 16px' }}>Primary Contact</th>
                  <th style={{ padding: '12px 16px' }}>Industry</th>
                  <th style={{ padding: '12px 16px' }}>Active Projects</th>
                  <th style={{ padding: '12px 16px' }}>Registered Date</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Total Invoiced Paid</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const contactName = [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Client Rep';
                  const totalPaid = ((c.total_paid_minor || 0) / 100).toLocaleString();

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid var(--cb-border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cb-bg-surface)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                          {c.company_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', fontFamily: 'monospace' }}>
                          ID: {c.id}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>{contactName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>{c.email}</div>
                        {c.phone && <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)' }}>{c.phone}</div>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="cb-badge cb-badge-neutral">{c.industry || 'Technology'}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                          {c.project_count || 0} Projects
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--cb-text-secondary)', fontSize: '12px' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: c.total_paid_minor > 0 ? '#059669' : 'var(--cb-text-muted)' }}>
                          {totalPaid} {currency}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Projects Table */}
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
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--cb-border-subtle)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0 }}>
            Active Client Projects Roster ({projects.length})
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: '3px 0 0 0' }}>
            Confirmed client contracts, development status, and payment collection tracking.
          </p>
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--cb-text-secondary)', fontSize: '13px' }}>
            <Briefcase size={36} color="var(--cb-text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>No active projects yet</div>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: 'var(--cb-text-secondary)' }}>
              When your referred clients approve proposals and settle initial milestones, their projects will appear here.
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
                  <th style={{ padding: '12px 20px' }}>Project Code</th>
                  <th style={{ padding: '12px 16px' }}>Title</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Payment Status</th>
                  <th style={{ padding: '12px 16px' }}>Budget</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const statusColors: Record<string, { bg: string; text: string }> = {
                    AWAITING_PAYMENT: { bg: 'rgba(217, 119, 6, 0.12)', text: '#D97706' },
                    IN_PROGRESS: { bg: 'rgba(37, 99, 235, 0.12)', text: '#2563EB' },
                    COMPLETED: { bg: 'rgba(5, 150, 105, 0.12)', text: '#059669' },
                    ON_HOLD: { bg: 'var(--cb-bg-subtle)', text: 'var(--cb-text-secondary)' },
                    CANCELLED: { bg: 'rgba(220, 38, 38, 0.12)', text: '#DC2626' },
                  };
                  const payColors: Record<string, { bg: string; text: string }> = {
                    UNPAID: { bg: 'rgba(220, 38, 38, 0.12)', text: '#DC2626' },
                    PARTIALLY_PAID: { bg: 'rgba(217, 119, 6, 0.12)', text: '#D97706' },
                    PAID: { bg: 'rgba(5, 150, 105, 0.12)', text: '#059669' },
                  };

                  const sStyle = statusColors[p.status] || { bg: 'var(--cb-bg-subtle)', text: 'var(--cb-text-secondary)' };
                  const pStyle = payColors[p.payment_status] || { bg: 'var(--cb-bg-subtle)', text: 'var(--cb-text-secondary)' };

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--cb-border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cb-bg-surface)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#2563EB',
                            fontSize: '13px',
                          }}
                        >
                          {p.code}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>{p.title}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: sStyle.bg,
                            color: sStyle.text,
                          }}
                        >
                          {p.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: pStyle.bg,
                            color: pStyle.text,
                          }}
                        >
                          {p.payment_status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                        {((p.budget_minor || 0) / 100).toLocaleString()} {p.currency || currency}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: p.total_paid_minor > 0 ? '#059669' : 'var(--cb-text-muted)',
                          }}
                        >
                          {((p.total_paid_minor || 0) / 100).toLocaleString()} {p.currency || currency}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Prospect Modal */}
      {onboardModalOpen && (
        <div className="cb-modal-overlay">
          <div className="cb-modal" style={{ maxWidth: '600px' }}>
            <div className="cb-modal-header">
              <div>
                <div className="cb-badge cb-badge-blue" style={{ marginBottom: '4px' }}>
                  <Building2 size={12} /> Direct Client Onboarding
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>
                  Onboard Client Prospect
                </h3>
              </div>
              <button
                onClick={() => setOnboardModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cb-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit}>
              <div className="cb-modal-body">
                <p style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', marginBottom: '16px' }}>
                  Register a prospect client directly. CodeBridge will create a client entity attributed to you and open a CRM lead.
                </p>

                <div className="cb-grid-2" style={{ marginBottom: '14px' }}>
                  <div className="cb-form-group">
                    <label className="cb-label">Company / Client Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Logistics Ltd"
                      value={onboardForm.companyName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, companyName: e.target.value })}
                      className="cb-input"
                    />
                  </div>
                  <div className="cb-form-group">
                    <label className="cb-label">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={onboardForm.contactPerson}
                      onChange={(e) => setOnboardForm({ ...onboardForm, contactPerson: e.target.value })}
                      className="cb-input"
                    />
                  </div>
                </div>

                <div className="cb-grid-2" style={{ marginBottom: '14px' }}>
                  <div className="cb-form-group">
                    <label className="cb-label">Contact Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@apexlogistics.com"
                      value={onboardForm.email}
                      onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                      className="cb-input"
                    />
                  </div>
                  <div className="cb-form-group">
                    <label className="cb-label">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +254 700 123 456"
                      value={onboardForm.phone}
                      onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                      className="cb-input"
                    />
                  </div>
                </div>

                <div className="cb-form-group" style={{ marginBottom: '14px' }}>
                  <label className="cb-label">Project Scope / Requirements</label>
                  <textarea
                    rows={3}
                    placeholder="Describe their software requirements or requested deliverables..."
                    value={onboardForm.requirements}
                    onChange={(e) => setOnboardForm({ ...onboardForm, requirements: e.target.value })}
                    className="cb-textarea"
                  />
                </div>

                <div className="cb-form-group">
                  <label className="cb-label">Internal Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Private notes regarding budget or timeline..."
                    value={onboardForm.notes}
                    onChange={(e) => setOnboardForm({ ...onboardForm, notes: e.target.value })}
                    className="cb-input"
                  />
                </div>
              </div>

              <div className="cb-modal-footer">
                <button
                  type="button"
                  onClick={() => setOnboardModalOpen(false)}
                  className="cb-btn cb-btn-secondary"
                  disabled={onboardSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cb-btn cb-btn-primary"
                  disabled={onboardSubmitting}
                  style={{ gap: '6px' }}
                >
                  {onboardSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} /> Onboarding...
                    </>
                  ) : (
                    <>
                      <Plus size={15} /> Confirm &amp; Onboard Client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
