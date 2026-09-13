// src/app/dashboard/representative/clients/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  RefreshCw,
} from 'lucide-react';

export default function RepClientsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resMe, resProjects] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/projects'),
        ]);

        if (resMe.ok) {
          const d = await resMe.json();
          setCurrentUser(d.user);
        }

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
          color: '#64748B',
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

  const currency = currentUser?.country?.currency || 'KES';

  return (
    <div>
      {/* Header Info Banner */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '22px 26px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
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
                backgroundColor: '#EFF6FF',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              <Briefcase size={12} /> REFERRED ACCOUNTS
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
              Attributed Clients & Engineering Engagements
            </span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Referred Clients & Active Projects
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
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
              backgroundColor: '#F1F5F9',
              color: '#0F172A',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <Users size={14} color="#64748B" /> {projects.length} Active Projects
          </span>
        </div>
      </div>

      {/* Projects Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden',
          marginBottom: '32px',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Active Client Projects Roster ({projects.length})
          </h3>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
            Confirmed client contracts, development status, and payment collection tracking.
          </p>
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748B', fontSize: '13px' }}>
            <Briefcase size={36} color="#CBD5E1" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>No projects yet</div>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
              When your referred clients approve proposals and settle initial milestones, their projects will appear here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    color: '#64748B',
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
                    AWAITING_PAYMENT: { bg: '#FFFBEB', text: '#D97706' },
                    IN_PROGRESS: { bg: '#EFF6FF', text: '#2563EB' },
                    COMPLETED: { bg: '#ECFDF5', text: '#059669' },
                    ON_HOLD: { bg: '#F1F5F9', text: '#64748B' },
                    CANCELLED: { bg: '#FEF2F2', text: '#DC2626' },
                  };
                  const payColors: Record<string, { bg: string; text: string }> = {
                    UNPAID: { bg: '#FEF2F2', text: '#DC2626' },
                    PARTIALLY_PAID: { bg: '#FFFBEB', text: '#D97706' },
                    PAID: { bg: '#ECFDF5', text: '#059669' },
                  };

                  const sStyle = statusColors[p.status] || { bg: '#F1F5F9', text: '#64748B' };
                  const pStyle = payColors[p.payment_status] || { bg: '#F1F5F9', text: '#64748B' };

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
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
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{p.title}</div>
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
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                        {((p.budget_minor || 0) / 100).toLocaleString()} {p.currency || currency}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: p.total_paid_minor > 0 ? '#059669' : '#94A3B8',
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
