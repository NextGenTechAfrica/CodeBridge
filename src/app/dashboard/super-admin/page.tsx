// src/app/dashboard/super-admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Briefcase,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe2,
  TrendingUp,
  FileText,
  Clock,
  Settings
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [reps, setReps] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState('');

  const loadData = async () => {
    try {
      const [resMetrics, resReps, resLeads] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/representatives'),
        fetch('/api/leads'),
      ]);

      if (resMetrics.ok) setMetrics(await resMetrics.json());
      if (resReps.ok) {
        const d = await resReps.json();
        setReps(d.representatives || []);
      }
      if (resLeads.ok) {
        const d = await resLeads.json();
        setLeads(d.leads || []);
      }
    } catch (err) {
      console.error('Failed to load super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRepAction = async (repId: string, action: string, rateBps: number = 2000) => {
    try {
      const res = await fetch('/api/admin/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          representativeId: repId,
          action,
          commissionRateBps: rateBps,
        }),
      });

      if (res.ok) {
        setActionFeedback(`Representative status updated (${action}).`);
        setTimeout(() => setActionFeedback(''), 4000);
        loadData();
      }
    } catch {
      alert('Failed to execute representative update.');
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--cb-text-muted)', padding: '20px' }}>Loading Super Admin executive metrics...</div>;
  }

  const ov = metrics?.overview;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="cb-badge cb-badge-rose" style={{ marginBottom: '8px' }}>
            <ShieldCheck size={13} /> Super Administrator
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cb-text-primary)', letterSpacing: '-0.02em' }}>
            CodeBridge Executive Console
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
            Central platform governance, representative approvals, and operational lead metrics across Nigeria & Kenya.
          </p>
        </div>

        <div style={{
          padding: '8px 14px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          border: '1px solid var(--cb-border-subtle)',
          fontSize: '12px',
          color: 'var(--cb-text-muted)'
        }}>
          Platform: <strong>CodeBridge · NextGen Tech</strong><br/>
          <span style={{ fontSize: '11px', color: 'var(--cb-text-tertiary)' }}>Technical Management: NextGen Tech Technical Department</span>
        </div>
      </div>

      {actionFeedback && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(5, 150, 105, 0.15)',
          border: '1px solid rgba(5, 150, 105, 0.3)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px',
          fontSize: '13px'
        }}>
          <CheckCircle2 size={16} />
          {actionFeedback}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="cb-grid-4" style={{ marginBottom: '32px' }}>
        <div className="cb-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Clients</span>
            <Briefcase size={16} color="var(--cb-blue-400)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>{ov?.totalClients || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>Active Enterprise Accounts</div>
        </div>

        <div className="cb-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Representatives</span>
            <Users size={16} color="var(--cb-amber-500)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>
            {ov?.totalReps || 0}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--cb-amber-500)' }}>
              ({ov?.pendingReps || 0} Pending)
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
            {ov?.activeReps || 0} Active Authorized
          </div>
        </div>

        <div className="cb-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Projects</span>
            <Layers size={16} color="var(--cb-emerald-500)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>{ov?.activeProjects || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>In Engineering & Delivery</div>
        </div>

        <div className="cb-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lead Pipeline</span>
            <TrendingUp size={16} color="var(--cb-blue-400)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>{ov?.totalLeads || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>Total Commercial Inquiries</div>
        </div>
      </div>

      {/* Modeled Commission Architecture Callout (Phase 1 Explicit Modeling) */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: 'rgba(30, 80, 255, 0.08)',
        border: '1px solid rgba(30, 80, 255, 0.25)',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="var(--cb-blue-400)" />
            Modeled Commission Accruals (Phase 1 Data Architecture — No Real Money Movement)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
            Configurable representative rate stored in minor integer units without floating point.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>Kenya Accrued (KES)</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              {((ov?.commissionsModeled?.KES_minor || 0) / 100).toLocaleString()} KES
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>Nigeria Accrued (NGN)</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              {((ov?.commissionsModeled?.NGN_minor || 0) / 100).toLocaleString()} NGN
            </div>
          </div>
        </div>
      </div>

      {/* Commercial Proposals Pipeline Callout (Phase 2A Commercial Engine) */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: 'rgba(5, 150, 105, 0.08)',
        border: '1px solid rgba(5, 150, 105, 0.25)',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            Commercial Engine: Active Contracts & Won Proposals (Phase 2A)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
            {ov?.proposals?.total || 0} authored commercial proposals &bull; {ov?.proposals?.approved || 0} client-approved & converted to projects.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>Kenya Approved Contracts</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#34D399' }}>
              {((ov?.proposals?.approvedKES_minor || 0) / 100).toLocaleString()} KES
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>Nigeria Approved Contracts</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#34D399' }}>
              {((ov?.proposals?.approvedNGN_minor || 0) / 100).toLocaleString()} NGN
            </div>
          </div>
        </div>
      </div>

      {/* Commercial Invoicing, Payments & Receivables (Phase 2B) */}
      <div style={{
        padding: '18px 22px',
        borderRadius: '12px',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#34D399', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={17} />
              Commercial Billing & Verified Settlements (Phase 2B)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '3px' }}>
              {ov?.billing?.totalInvoices || 0} invoices issued &bull; {ov?.billing?.paidInvoices || 0} fully settled &bull; {ov?.billing?.commissionEventsCount || 0} immutable commission events logged
            </div>
          </div>
          <span className="cb-badge cb-badge-emerald">Phase 2B Active</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase' }}>Kenya Verified Paid</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
              {((ov?.billing?.verifiedPaidKES_minor || 0) / 100).toLocaleString()} KES
            </div>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Invoiced: {((ov?.billing?.invoicedKES_minor || 0) / 100).toLocaleString()} KES &bull; Rec: {((ov?.billing?.receivablesKES_minor || 0) / 100).toLocaleString()} KES
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase' }}>Nigeria Verified Paid</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
              {((ov?.billing?.verifiedPaidNGN_minor || 0) / 100).toLocaleString()} NGN
            </div>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Invoiced: {((ov?.billing?.invoicedNGN_minor || 0) / 100).toLocaleString()} NGN &bull; Rec: {((ov?.billing?.receivablesNGN_minor || 0) / 100).toLocaleString()} NGN
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase' }}>Verified Commission Events</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#60A5FA', marginTop: '2px' }}>
              {ov?.billing?.commissionEventsCount || 0} Events
            </div>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Handoff to Phase 2D Engine (Ledger untouched)
            </div>
          </div>
        </div>
      </div>

      {/* Representative Approval Manager */}
      <div className="cb-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              Representative Management & Approvals
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Verify representatives before granting active status, set bespoke commission rates, or suspend accounts.
            </p>
          </div>
          <span className="cb-badge cb-badge-neutral">{reps.length} Registered Reps</span>
        </div>

        <div className="cb-table-container">
          <table className="cb-table">
            <thead>
              <tr>
                <th>Representative</th>
                <th>Country</th>
                <th>Approval Status</th>
                <th>Commission Rate</th>
                <th>Leads / Projects</th>
                <th>Accrued Comm.</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reps.map((r) => {
                const isPending = r.approval_status === 'PENDING';
                const isActive = r.approval_status === 'ACTIVE';

                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>{r.first_name} {r.last_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--cb-text-muted)' }}>{r.email}</div>
                    </td>
                    <td>
                      <span className="cb-badge cb-badge-neutral">{r.country_name} ({r.country_code})</span>
                    </td>
                    <td>
                      {isPending && <span className="cb-badge cb-badge-amber">PENDING APPROVAL</span>}
                      {isActive && <span className="cb-badge cb-badge-emerald">ACTIVE</span>}
                      {r.approval_status === 'SUSPENDED' && <span className="cb-badge cb-badge-rose">SUSPENDED</span>}
                      {r.approval_status === 'REJECTED' && <span className="cb-badge cb-badge-rose">REJECTED</span>}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--cb-blue-400)' }}>
                        {(r.commission_rate_bps / 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--cb-text-secondary)' }}>
                        {r.total_leads} leads &bull; {r.total_projects} projects
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                        {((r.total_commission_minor || 0) / 100).toLocaleString()} {r.currency}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleRepAction(r.id, 'APPROVE')}
                              className="cb-btn cb-btn-primary cb-btn-sm"
                              style={{ backgroundColor: 'var(--cb-emerald-500)', borderColor: 'transparent' }}
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handleRepAction(r.id, 'REJECT')}
                              className="cb-btn cb-btn-danger cb-btn-sm"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {isActive && (
                          <button
                            onClick={() => handleRepAction(r.id, 'SUSPEND')}
                            className="cb-btn cb-btn-outline cb-btn-sm"
                            style={{ color: '#FB7185', borderColor: 'rgba(225,29,72,0.3)' }}
                          >
                            Suspend
                          </button>
                        )}
                        {r.approval_status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleRepAction(r.id, 'APPROVE')}
                            className="cb-btn cb-btn-secondary cb-btn-sm"
                          >
                            Reactivate
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
      </div>

      {/* Leads Pipeline & System Audit Logs */}
      <div className="cb-grid-2" style={{ gap: '28px' }}>
        {/* Leads */}
        <div className="cb-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>Recent Commercial Leads</h3>
            <span className="cb-badge cb-badge-neutral">{leads.length} Total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leads.slice(0, 5).map((l) => (
              <div key={l.id} style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--cb-border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)' }}>{l.business_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                    {l.country_name} &bull; Budget: {((l.estimated_budget_minor || 0) / 100).toLocaleString()} {l.currency}
                  </div>
                </div>
                <span className="cb-badge cb-badge-blue" style={{ fontSize: '10px' }}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="cb-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>System Audit Trail</h3>
            <Clock size={16} color="var(--cb-text-muted)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(metrics?.recentAuditLogs || []).slice(0, 6).map((log: any) => (
              <div key={log.id} style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--cb-border-subtle)',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cb-text-secondary)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--cb-blue-400)' }}>{log.action}</span>
                  <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>{log.created_at}</span>
                </div>
                <div style={{ color: 'var(--cb-text-muted)', marginTop: '2px' }}>
                  Target: {log.entity} {log.entity_id ? `(${log.entity_id})` : ''} &bull; User: {log.user_email || 'System'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
