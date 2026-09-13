// src/app/dashboard/representative/clients/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  RefreshCw,
} from 'lucide-react';
import { useRep } from '../RepContext';

export default function RepClientsPage() {
  const { currentUser, currency } = useRep();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resProjects = await fetch('/api/projects');
        if (resProjects.ok) {
          const d = await resProjects.json();
          setProjects(d.projects || []);
        }
      } catch (err) {
        console.error('Failed to load clients & projects:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
            Projects from clients you referred to CodeBridge. Commission events are tracked against verified payments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        </div>
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
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>No projects yet</div>
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
    </div>
  );
}
