// src/app/dashboard/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  Filter,
  Check,
  Plus,
  Send,
  FileText,
  Clock,
  X,
  RefreshCw,
  Eye,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Smartphone,
  Building2,
  ExternalLink,
  Info,
  Trash2,
  RotateCcw,
  Scale,
  Globe2,
  ShieldAlert
} from 'lucide-react';

import ChatDrawer from '@/components/dashboard/ChatDrawer';

export default function AdminOpsDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [reps, setReps] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>({
    grossCodeBridgeRevenueMinor: 0,
    thirdPartyReimbursementsMinor: 0,
    totalGatewayFeesMinor: 0,
    netCodeBridgeRevenueMinor: 0,
  });
  const [catalogServices, setCatalogServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  // Reconciliation & Ledger State
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [reconcilingAudit, setReconcilingAudit] = useState(false);

  // Territory Management State
  const [territories, setTerritories] = useState<any[]>([]);
  const [editingTerritory, setEditingTerritory] = useState<any>(null);

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<any>(null);
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: 'Client requested project scope adjustment',
    isFullRefund: true,
  });
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [selectedLeadForProposal, setSelectedLeadForProposal] = useState<any>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatEntityId, setChatEntityId] = useState<string | null>(null);
  const [chatEntityType, setChatEntityType] = useState<'LEAD' | 'PROJECT'>('LEAD');

  // Filters and search
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState('ALL');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [proposalFilterStatus, setProposalFilterStatus] = useState('ALL');
  const [proposalSearchQuery, setProposalSearchQuery] = useState('');
  const [paymentFilterGateway, setPaymentFilterGateway] = useState('ALL');

  // Registered Users & Clients State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Payment Verification Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'FLUTTERWAVE',
    verificationSource: 'MANUAL_VERIFICATION',
    reference: '',
    verificationNotes: '',
  });

  // Default Line Items for Quote Builder
  const defaultLineItems = [
    {
      id: 'li-1',
      title: 'Custom Mobile Application Engineering',
      description: 'Cross-platform mobile client architecture, API integration, and native performance tuning.',
      item_type: 'CODEBRIDGE_SERVICE',
      platform: 'CROSS_PLATFORM',
      amount: '200000',
    },
    {
      id: 'li-2',
      title: 'Google Play Store Publishing Assistance',
      description: 'Android bundle preparation, signing, and submission management (Platform approval controlled by Google).',
      item_type: 'CODEBRIDGE_SERVICE',
      platform: 'ANDROID',
      amount: '40000',
    },
    {
      id: 'li-3',
      title: 'Apple App Store Publishing Assistance',
      description: 'iOS archive generation, provisioning, and submission management (Platform approval controlled by Apple).',
      item_type: 'CODEBRIDGE_SERVICE',
      platform: 'IOS',
      amount: '40000',
    },
    {
      id: 'li-4',
      title: 'Google Play Developer Account Registration Fee ($25 one-off)',
      description: 'Third-party developer account fee paid directly to Google by client.',
      item_type: 'THIRD_PARTY_FEE',
      platform: 'ANDROID',
      amount: '3500',
    },
    {
      id: 'li-5',
      title: 'Apple Developer Program Enrollment ($99/year)',
      description: 'Third-party developer membership paid directly to Apple by client.',
      item_type: 'THIRD_PARTY_FEE',
      platform: 'IOS',
      amount: '14000',
    },
  ];

  // Proposal Form State
  const [proposalForm, setProposalForm] = useState({
    title: '',
    scopeOfWork: '',
    deliverables: 'Custom UI/UX System Architecture\nScalable API & Database Engineering\nInternal Quality Assurance & UAT\nProduction Deployment & Handover',
    paymentStructureType: 'FULL_UPFRONT',
    totalAmount: '280000',
    currency: 'KES',
    validDays: 14,
    termsNotes: 'Standard engineering schedule with 100% CodeBridge warranty.',
    status: 'SENT',
    lineItems: defaultLineItems,
    appStoreOwnership: 'CLIENT_OWNED',
    storeApprovalDisclaimer: 'CodeBridge prepares and submits the application according to platform specifications. Final store approval is controlled exclusively by Apple and Google and is never guaranteed.',
  });

  const loadData = async () => {
    try {
      const [resMe, resLeads, resReps, resProjects, resProposals, resInvoices, resPayments, resServices, resReconciliation, resTerritories, resUsers] = await Promise.all([
        fetch('/api/me'),
        fetch('/api/leads'),
        fetch('/api/admin/representatives'),
        fetch('/api/projects'),
        fetch('/api/proposals'),
        fetch('/api/invoices'),
        fetch('/api/payments'),
        fetch('/api/services'),
        fetch('/api/admin/reconciliation'),
        fetch('/api/territories'),
        fetch('/api/admin/users'),
      ]);

      if (resMe.ok) {
        const d = await resMe.json();
        setCurrentUser(d.user || null);
      }
      if (resLeads.ok) {
        const d = await resLeads.json();
        setLeads(d.leads || []);
      }
      if (resReps.ok) {
        const d = await resReps.json();
        setReps(d.representatives || []);
      }
      if (resProjects.ok) {
        const d = await resProjects.json();
        setProjects(d.projects || []);
      }
      if (resProposals.ok) {
        const d = await resProposals.json();
        setProposals(d.proposals || []);
      }
      if (resInvoices.ok) {
        const d = await resInvoices.json();
        setInvoices(d.invoices || []);
      }
      if (resPayments.ok) {
        const d = await resPayments.json();
        setPayments(d.payments || []);
        if (d.summary) {
          setFinancialSummary(d.summary);
        }
      }
      if (resServices.ok) {
        const d = await resServices.json();
        setCatalogServices(d.data || []);
      }
      if (resReconciliation && resReconciliation.ok) {
        const d = await resReconciliation.json();
        setReconciliation(d);
      }
      if (resTerritories && resTerritories.ok) {
        const d = await resTerritories.json();
        setTerritories(d.territories || []);
      }
      if (resUsers && resUsers.ok) {
        const d = await resUsers.json();
        setUsersList(d.users || []);
      }
    } catch (err) {
      console.error('Failed to load operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const runReconciliationAudit = async () => {
    setReconcilingAudit(true);
    try {
      const res = await fetch('/api/admin/reconciliation');
      const d = await res.json();
      if (res.ok) {
        setReconciliation(d);
        setFeedback(`Reconciliation Audit Complete: Status ${d.reconciliationStatus} (${d.discrepancyCount} discrepancies).`);
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(d.error || 'Failed to run reconciliation audit.');
      }
    } catch {
      alert('Network error running reconciliation audit.');
    } finally {
      setReconcilingAudit(false);
    }
  };

  const openRefundModal = (payment: any) => {
    setSelectedPaymentForRefund(payment);
    const gross = (payment.amount_minor || payment.gross_amount_minor || 0) / 100;
    setRefundForm({
      amount: gross.toString(),
      reason: 'Client requested project scope adjustment',
      isFullRefund: true,
    });
    setRefundModalOpen(true);
  };

  const handleExecuteRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForRefund) return;
    setRefundSubmitting(true);
    try {
      const amtNumber = parseFloat(refundForm.amount);
      if (isNaN(amtNumber) || amtNumber <= 0) {
        alert('Please enter a valid positive refund amount.');
        setRefundSubmitting(false);
        return;
      }
      const amountMinor = Math.round(amtNumber * 100);
      const res = await fetch('/api/payments/flutterwave/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: selectedPaymentForRefund.id,
          amountMinor,
          reason: refundForm.reason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(`Refund executed successfully! Reversal: ${((data.commissionReversalMinor || 0) / 100).toLocaleString()} ${selectedPaymentForRefund.currency}`);
        setTimeout(() => setFeedback(''), 6000);
        setRefundModalOpen(false);
        await Promise.all([loadData(), runReconciliationAudit()]);
      } else {
        alert(data.error || 'Failed to execute refund.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error processing refund.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleSaveTerritory = async (t: any) => {
    try {
      const res = await fetch('/api/territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: t.id,
          countryName: t.country_name,
          currency: t.currency,
          defaultPayoutMethod: t.default_payout_method,
          defaultCommissionRateBps: t.default_commission_rate_bps,
          isActive: t.is_active === 1 || t.is_active === true,
        }),
      });
      if (res.ok) {
        setFeedback(`Territory ${t.id} configuration updated.`);
        setTimeout(() => setFeedback(''), 4000);
        setEditingTerritory(null);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update territory');
      }
    } catch {
      alert('Error updating territory');
    }
  };

  const handleReconcileGateway = async (invId?: string) => {
    try {
      setFeedback('Contacting Flutterwave API for authoritative transaction status...');
      const res = await fetch('/api/payments/flutterwave/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invId ? { invoiceId: invId } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(`Gateway reconciliation complete: ${data.results.confirmed} confirmed, ${data.results.stillPending} pending.`);
        setTimeout(() => setFeedback(''), 6000);
        loadData();
      } else {
        alert(data.error || 'Reconciliation failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error reconciling with Flutterwave.');
    }
  };

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoiceForPayment(invoice);
    const unpaidMinor = invoice.amount_minor - invoice.amount_paid_minor;
    setPaymentForm({
      amount: (unpaidMinor / 100).toFixed(2),
      paymentMethod: 'BANK_TRANSFER',
      verificationSource: 'MANUAL_VERIFICATION',
      reference: `WIRE-${invoice.currency}-${Date.now().toString().slice(-6)}`,
      verificationNotes: `Exceptional manual accounting adjustment approved by operations admin.`,
    });
    setPaymentModalOpen(true);
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    try {
      const cleanMinor = Math.round(parseFloat(paymentForm.amount) * 100);
      const res = await fetch(`/api/invoices/${selectedInvoiceForPayment.id}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinor: cleanMinor,
          currency: selectedInvoiceForPayment.currency,
          paymentMethod: paymentForm.paymentMethod,
          verificationSource: paymentForm.verificationSource,
          reference: paymentForm.reference,
          verificationNotes: paymentForm.verificationNotes,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback(d.error || 'Payment adjustment failed');
        return;
      }

      setFeedback(`✅ Exceptional accounting adjustment recorded: ${d.message}`);
      setPaymentModalOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback('Failed to record payment adjustment');
    }
  };

  const handleUpdateStatus = async (leadId: string, status: string, convertToClient: boolean = false) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, convertToClient }),
      });

      if (res.ok) {
        const d = await res.json();
        setFeedback(d.message || `Lead status updated to ${status}.`);
        setTimeout(() => setFeedback(''), 4000);
        loadData();
      }
    } catch {
      alert('Failed to update lead status.');
    }
  };

  const handleOpenProposalModal = (lead?: any) => {
    if (lead) {
      setSelectedLeadForProposal(lead);
      const estBudget = ((lead.estimated_budget_minor || 28000000) / 100).toString();
      setProposalForm({
        title: `Digital Transformation for ${lead.business_name}`,
        scopeOfWork: `Design, engineer, and deploy high-performance software system tailored to ${lead.business_type} operations.`,
        deliverables: 'Custom UI/UX System Architecture\nScalable API & Database Engineering\nInternal Quality Assurance & UAT\nProduction Deployment & Handover',
        paymentStructureType: 'FULL_UPFRONT',
        totalAmount: estBudget,
        currency: lead.currency || (lead.country_id === 'c_ng' || lead.country_code === 'NG' ? 'NGN' : 'KES'),
        validDays: 14,
        termsNotes: 'Standard engineering schedule with 100% CodeBridge warranty.',
        status: 'SENT',
        lineItems: [
          {
            id: 'li-1',
            title: `Custom Mobile App Engineering for ${lead.business_name}`,
            description: 'Native/hybrid client architecture, authenticated workflows, and responsive interface design.',
            item_type: 'CODEBRIDGE_SERVICE',
            platform: 'CROSS_PLATFORM',
            amount: (parseFloat(estBudget) * 0.7).toFixed(0),
          },
          {
            id: 'li-2',
            title: 'Google Play Store Publishing Assistance',
            description: 'Build compilation, store listing setup, and submission management (Platform approval controlled by Google).',
            item_type: 'CODEBRIDGE_SERVICE',
            platform: 'ANDROID',
            amount: (parseFloat(estBudget) * 0.15).toFixed(0),
          },
          {
            id: 'li-3',
            title: 'Apple App Store Publishing Assistance',
            description: 'iOS archive generation, provisioning profiles, and submission management (Platform approval controlled by Apple).',
            item_type: 'CODEBRIDGE_SERVICE',
            platform: 'IOS',
            amount: (parseFloat(estBudget) * 0.15).toFixed(0),
          },
          {
            id: 'li-4',
            title: 'Google Play Developer Account Registration Fee ($25 one-off)',
            description: 'Direct third-party account registration fee paid directly to Google by client.',
            item_type: 'THIRD_PARTY_FEE',
            platform: 'ANDROID',
            amount: '3500',
          },
          {
            id: 'li-5',
            title: 'Apple Developer Program Enrollment ($99/year)',
            description: 'Annual third-party developer membership paid directly to Apple by client.',
            item_type: 'THIRD_PARTY_FEE',
            platform: 'IOS',
            amount: '14000',
          },
        ],
        appStoreOwnership: 'CLIENT_OWNED',
        storeApprovalDisclaimer: 'CodeBridge prepares and submits the application according to platform specifications. Final store approval is controlled exclusively by Apple and Google and is never guaranteed.',
      });
    } else {
      setSelectedLeadForProposal(null);
      setProposalForm({
        title: 'Custom Engineering & Digital Infrastructure',
        scopeOfWork: 'End-to-end full-stack software development, cloud infrastructure setup, and administrative enablement.',
        deliverables: 'Custom UI/UX System Architecture\nScalable API & Database Engineering\nInternal Quality Assurance & UAT\nProduction Deployment & Handover',
        paymentStructureType: 'FULL_UPFRONT',
        totalAmount: '280000',
        currency: 'KES',
        validDays: 14,
        termsNotes: 'Standard engineering schedule with 100% CodeBridge warranty.',
        status: 'SENT',
        lineItems: defaultLineItems,
        appStoreOwnership: 'CLIENT_OWNED',
        storeApprovalDisclaimer: 'CodeBridge prepares and submits the application according to platform specifications. Final store approval is controlled exclusively by Apple and Google and is never guaranteed.',
      });
    }
    setProposalModalOpen(true);
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...proposalForm.lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate CodeBridge Total (services + reimbursables) to keep totalAmount synchronized
    let newTotal = 0;
    for (const item of updated) {
      if (item.item_type === 'CODEBRIDGE_SERVICE' || item.item_type === 'REIMBURSABLE_EXPENSE') {
        newTotal += parseFloat(item.amount || '0') || 0;
      }
    }
    
    setProposalForm({
      ...proposalForm,
      lineItems: updated,
      totalAmount: newTotal > 0 ? newTotal.toString() : proposalForm.totalAmount,
    });
  };

  const handleAddLineItem = () => {
    const newItem = {
      id: `li-${Date.now()}`,
      title: 'Additional Service / Component',
      description: 'Scope details and deliverables specifications.',
      item_type: 'CODEBRIDGE_SERVICE',
      platform: 'CROSS_PLATFORM',
      amount: '30000',
    };
    const updated = [...proposalForm.lineItems, newItem];
    let newTotal = 0;
    for (const item of updated) {
      if (item.item_type === 'CODEBRIDGE_SERVICE' || item.item_type === 'REIMBURSABLE_EXPENSE') {
        newTotal += parseFloat(item.amount || '0') || 0;
      }
    }
    setProposalForm({
      ...proposalForm,
      lineItems: updated,
      totalAmount: newTotal > 0 ? newTotal.toString() : proposalForm.totalAmount,
    });
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = proposalForm.lineItems.filter((_, i) => i !== index);
    let newTotal = 0;
    for (const item of updated) {
      if (item.item_type === 'CODEBRIDGE_SERVICE' || item.item_type === 'REIMBURSABLE_EXPENSE') {
        newTotal += parseFloat(item.amount || '0') || 0;
      }
    }
    setProposalForm({
      ...proposalForm,
      lineItems: updated,
      totalAmount: newTotal > 0 ? newTotal.toString() : proposalForm.totalAmount,
    });
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanMinor = Math.round(parseFloat(proposalForm.totalAmount) * 100);
      if (isNaN(cleanMinor) || cleanMinor <= 0) {
        alert('Please specify a valid positive pricing amount.');
        return;
      }

      const deliverablesArray = proposalForm.deliverables
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const validUntil = new Date(Date.now() + proposalForm.validDays * 86400000).toISOString();

      const formattedLineItems = proposalForm.lineItems.map(item => ({
        name: item.title,
        description: item.description,
        item_type: item.item_type,
        platform: item.platform,
        amount_minor: Math.round(parseFloat(item.amount || '0') * 100),
      }));

      const payload: any = {
        title: proposalForm.title.trim(),
        scopeOfWork: proposalForm.scopeOfWork.trim(),
        deliverables: deliverablesArray,
        lineItems: formattedLineItems,
        appStoreOwnership: proposalForm.appStoreOwnership,
        storeApprovalDisclaimer: proposalForm.storeApprovalDisclaimer,
        paymentStructureType: proposalForm.paymentStructureType,
        totalAmountMinor: cleanMinor,
        currency: proposalForm.currency,
        validUntil,
        termsNotes: proposalForm.termsNotes.trim(),
        status: proposalForm.status,
      };

      if (selectedLeadForProposal) {
        payload.leadId = selectedLeadForProposal.id;
      }

      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (res.ok) {
        setProposalModalOpen(false);
        setFeedback(`Commercial proposal ${d.proposal.proposalNumber} created successfully (${d.proposal.status}).`);
        setTimeout(() => setFeedback(''), 5000);
        loadData();
      } else {
        alert(d.error || 'Failed to create proposal.');
      }
    } catch {
      alert('Error submitting proposal request.');
    }
  };

  const handleSendProposal = async (proposalId: string) => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND' }),
      });

      if (res.ok) {
        setFeedback('Proposal transmitted to client for formal review.');
        setTimeout(() => setFeedback(''), 4000);
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to send proposal.');
      }
    } catch {
      alert('Network error sending proposal.');
    }
  };

  const handleCancelProposal = async (proposalId: string) => {
    if (!confirm('Are you sure you want to cancel this proposal?')) return;
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' }),
      });

      if (res.ok) {
        setFeedback('Proposal cancelled.');
        setTimeout(() => setFeedback(''), 4000);
        loadData();
      }
    } catch {
      alert('Failed to cancel proposal.');
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--cb-text-muted)', padding: '20px' }}>Loading CodeBridge Operations Console...</div>;
  }

  const filteredProposals = proposals.filter((p) => {
    const matchesStatus = proposalFilterStatus === 'ALL' || p.status === proposalFilterStatus;
    const q = proposalSearchQuery.trim().toLowerCase();
    const matchesQuery = !q ||
      (p.proposal_number && p.proposal_number.toLowerCase().includes(q)) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.company_name && p.company_name.toLowerCase().includes(q)) ||
      (p.lead_business_name && p.lead_business_name.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = invoiceFilterStatus === 'ALL' || inv.status === invoiceFilterStatus;
    const q = invoiceSearchQuery.trim().toLowerCase();
    const matchesQuery = !q ||
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
      (inv.title && inv.title.toLowerCase().includes(q)) ||
      (inv.company_name && inv.company_name.toLowerCase().includes(q)) ||
      (inv.project_code && inv.project_code.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  const filteredUsers = usersList.filter((u) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const q = userSearchQuery.trim().toLowerCase();
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const matchesQuery = !q ||
      fullName.includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.company_name && u.company_name.toLowerCase().includes(q)) ||
      (u.referral_code && u.referral_code.toLowerCase().includes(q));
    return matchesRole && matchesQuery;
  });

  return (
    <div>
      <div className="cb-header-flex">
        <div>
          <div className="cb-badge cb-badge-blue" style={{ marginBottom: '8px' }}>
            <LayoutDashboard size={13} /> Operations & Delivery Console
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cb-text-primary)', letterSpacing: '-0.02em' }}>
            Platform Operations & Commercial Engine
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
            Manage commercial proposals, client contract sign-offs, and project execution across regional hubs.
          </p>
        </div>

        <button
          onClick={() => handleOpenProposalModal()}
          className="cb-btn cb-btn-primary"
          style={{ gap: '8px' }}
        >
          <Plus size={16} /> Author Commercial Proposal
        </button>
      </div>

      {feedback && (
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
          {feedback}
        </div>
      )}

      {/* Operational Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="cb-card" style={{ padding: '20px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Registered Accounts
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10B981' }}>{usersList.length} Accounts</div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
            {usersList.filter(u => u.role === 'CLIENT').length} Clients &bull; {usersList.filter(u => u.role === 'REPRESENTATIVE').length} Reps
          </div>
        </div>

        <div className="cb-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Pipeline Leads
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>{leads.length} Leads</div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
            {leads.filter(l => l.status === 'NEW').length} requiring qualification
          </div>
        </div>

        <div className="cb-card" style={{ padding: '20px', borderLeft: '4px solid var(--cb-blue-500)' }}>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Commercial Proposals
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#60A5FA' }}>{proposals.length} Proposals</div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
            {proposals.filter(p => p.status === 'CLIENT_APPROVED').length} accepted & won
          </div>
        </div>

        <div className="cb-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Active Engineering
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>{projects.length} Projects</div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
            In development and quality review
          </div>
        </div>

        <div className="cb-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Field Representatives
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>{reps.length} Reps</div>
          <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
            {reps.filter(r => r.approval_status === 'ACTIVE').length} active in Kenya & Nigeria
          </div>
        </div>
      </div>

      {/* Financial & Settlement Console (Collection vs Settlement) */}
      <div className="cb-card" style={{ padding: '24px', marginBottom: '32px', borderTop: '4px solid #3B82F6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="cb-badge cb-badge-blue" style={{ marginBottom: '6px' }}>
              <CreditCard size={12} /> Flutterwave Gateway & Settlement Engine
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>
              Financial & Settlement Console (Collection vs Settlement)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px', maxWidth: '750px' }}>
              Distinguishes client <strong>Collection</strong> (KES via M-Pesa / Card) from merchant <strong>Settlement</strong> (NGN or merchant wallet). Separates CodeBridge service revenue from third-party pass-through expenses to prevent revenue inflation.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="cb-badge cb-badge-emerald">Live Gateway: Flutterwave</span>
            <span className="cb-badge cb-badge-neutral">{payments.length} Transactions</span>
          </div>
        </div>

        {/* 4 Financial Split Summary Cards */}
        <div className="cb-grid-4" style={{ marginBottom: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--cb-surface-card)', border: '1px solid var(--cb-border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>
              Gross Service Revenue
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#34D399' }}>
              {((financialSummary.grossCodeBridgeRevenueMinor || 0) / 100).toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cb-text-muted)' }}>KES / NGN</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
              Earned CodeBridge development & engineering services
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--cb-surface-card)', border: '1px solid var(--cb-border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>
              Third-Party Pass-Through
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#60A5FA' }}>
              {((financialSummary.thirdPartyReimbursementsMinor || 0) / 100).toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cb-text-muted)' }}>KES / NGN</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
              Direct store/cloud reimbursements (0% revenue inflation)
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--cb-surface-card)', border: '1px solid var(--cb-border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>
              Authoritative Gateway Fees
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#F87171' }}>
              {((financialSummary.totalGatewayFeesMinor || 0) / 100).toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cb-text-muted)' }}>KES / NGN</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
              Deducted by Flutterwave payment network
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--cb-surface-card)', border: '1px solid var(--cb-border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>
              Net CodeBridge Revenue
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#FBBF24' }}>
              {((financialSummary.netCodeBridgeRevenueMinor || 0) / 100).toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cb-text-muted)' }}>KES / NGN</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '4px' }}>
              Gross Service Revenue minus Gateway Fees
            </div>
          </div>
        </div>

        {/* Regulatory / Settlement Disclosure Banner */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          fontSize: '12px',
          color: '#BFDBFE',
          lineHeight: '1.5',
        }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#60A5FA' }} />
          <div>
            <strong>Flutterwave Multi-Currency Settlement Architecture:</strong> For Kenyan clients, invoices are denominated and collected in <strong>KES</strong> via M-Pesa and Card. Settlement into Nigerian NGN business accounts or merchant wallets is governed solely by the Flutterwave merchant account configuration. The application strictly records authoritative settlement figures returned by Flutterwave and never fabricates artificial foreign exchange rates.
          </div>
        </div>

        {/* Live Automated Reconciliation Audit Panel */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '10px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: reconciliation?.reconciliationStatus === 'OK'
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : '1px solid rgba(239, 68, 68, 0.4)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={18} color="#10B981" />
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0 }}>
                  Immutable Double-Entry Ledger Reconciliation
                </h4>
                <span className={`cb-badge ${reconciliation?.reconciliationStatus === 'OK' ? 'cb-badge-emerald' : 'cb-badge-rose'}`} style={{ fontWeight: 700 }}>
                  {reconciliation?.reconciliationStatus === 'OK' ? 'STATUS: OK (AUDITED)' : 'DISCREPANCY DETECTED'}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', margin: '4px 0 0 0' }}>
                Continuous integrity audit reconciling operational payments, commissions, payouts, and refunds against immutable ledger.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={runReconciliationAudit}
                disabled={reconcilingAudit}
                className="cb-btn cb-btn-outline cb-btn-sm"
                style={{ gap: '4px', fontSize: '11px' }}
              >
                <RefreshCw size={12} className={reconcilingAudit ? 'spin' : ''} />
                {reconcilingAudit ? 'Auditing...' : 'Run Audit Now'}
              </button>
              <span className="cb-badge cb-badge-neutral" style={{ fontSize: '10px' }}>
                Checked: {reconciliation?.totalChecked || 0} &bull; Discrepancies: {reconciliation?.discrepancyCount || 0}
              </span>
            </div>
          </div>

          {/* Metrics Comparison Grid */}
          <div className="cb-grid-4" style={{ gap: '10px' }}>
            <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'var(--cb-bg)', border: '1px solid var(--cb-border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Payments Audit
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginTop: '2px' }}>
                Ops: {((reconciliation?.metrics?.totalOperationalPaymentsMinor || 0) / 100).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#34D399' }}>
                Ledger: {((reconciliation?.metrics?.totalLedgerPaymentsMinor || 0) / 100).toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'var(--cb-bg)', border: '1px solid var(--cb-border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Commissions Audit
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginTop: '2px' }}>
                Ops: {((reconciliation?.metrics?.totalOperationalCommissionsMinor || 0) / 100).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#60A5FA' }}>
                Ledger: {((reconciliation?.metrics?.totalLedgerCommissionsMinor || 0) / 100).toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'var(--cb-bg)', border: '1px solid var(--cb-border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Payouts Audit
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginTop: '2px' }}>
                Ops: {((reconciliation?.metrics?.totalOperationalPayoutsMinor || 0) / 100).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#FBBF24' }}>
                Ledger: {((reconciliation?.metrics?.totalLedgerPayoutsMinor || 0) / 100).toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'var(--cb-bg)', border: '1px solid var(--cb-border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Refunds Audit
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cb-text-primary)', marginTop: '2px' }}>
                Ops: {((reconciliation?.metrics?.totalOperationalRefundsMinor || 0) / 100).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#F87171' }}>
                Ledger: {((reconciliation?.metrics?.totalLedgerRefundsMinor || 0) / 100).toLocaleString()}
              </div>
            </div>
          </div>

          {reconciliation?.discrepancies && reconciliation.discrepancies.length > 0 && (
            <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#F87171', marginBottom: '4px' }}>
                Audit Discrepancies ({reconciliation.discrepancies.length}):
              </div>
              {reconciliation.discrepancies.map((d: any, idx: number) => (
                <div key={idx} style={{ fontSize: '11px', color: '#FCA5A5', marginBottom: '2px' }}>
                  &bull; [{d.severity}] {d.description}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions & Settlement Details Table */}
        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--cb-text-muted)', fontSize: '13px' }}>
            No payments processed yet. Client payments via Flutterwave Checkout or administrative verifications will be logged here with collection vs settlement tracking.
          </div>
        ) : (
          <div className="cb-table-container">
            <table className="cb-table">
              <thead>
                <tr>
                  <th>Invoice & Client</th>
                  <th>Gateway & Ref</th>
                  <th>Collection (Customer Paid)</th>
                  <th>Financial Split</th>
                  <th>Settlement (Merchant)</th>
                  <th>Status</th>
                  <th>Billing Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const grossFmt = ((p.amount_minor || p.gross_amount_minor || 0) / 100).toLocaleString();
                  const feeFmt = ((p.gateway_fee_minor || 0) / 100).toLocaleString();
                  const cbRevFmt = ((p.codebridge_amount_minor != null ? p.codebridge_amount_minor : (p.amount_minor || 0)) / 100).toLocaleString();
                  const thirdPartyFmt = ((p.third_party_reimbursement_minor || 0) / 100).toLocaleString();
                  
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--cb-accent)', fontFamily: 'monospace' }}>
                          {p.invoice_number}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)', fontSize: '12px' }}>
                          {p.company_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                          {p.country_name} ({p.country_code})
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span className="cb-badge cb-badge-blue" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {p.gateway || 'FLUTTERWAVE'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--cb-text-secondary)' }}>
                          Ref: {p.gateway_reference || p.reference || 'N/A'}
                        </div>
                        {p.gateway_transaction_id && (
                          <div style={{ fontSize: '10px', color: 'var(--cb-text-muted)' }}>
                            ID: {p.gateway_transaction_id}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--cb-text-primary)', fontSize: '13px' }}>
                          {grossFmt} {p.currency}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)' }}>
                          Method: <strong>{p.payment_method || 'CARD / M-PESA'}</strong>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--cb-text-muted)' }}>
                          {p.paid_at ? new Date(p.paid_at).toLocaleString() : new Date(p.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 600 }}>
                          CodeBridge: {cbRevFmt} {p.currency}
                        </div>
                        {Number(p.third_party_reimbursement_minor || 0) > 0 && (
                          <div style={{ fontSize: '11px', color: '#60A5FA' }}>
                            3rd-Party: {thirdPartyFmt} {p.currency}
                          </div>
                        )}
                        {Number(p.gateway_fee_minor || 0) > 0 && (
                          <div style={{ fontSize: '10px', color: '#F87171' }}>
                            Fee: -{feeFmt} {p.currency}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: p.settlement_status === 'CONFIRMED' ? '#34D399' : '#FBBF24' }}>
                          {p.settlement_status || 'PENDING_SETTLEMENT'}
                        </div>
                        {p.settlement_amount_minor != null ? (
                          <div style={{ fontSize: '12px', color: 'var(--cb-text-primary)', fontWeight: 700 }}>
                            {((p.settlement_amount_minor || 0) / 100).toLocaleString()} {p.settlement_currency || p.currency}
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                            Per Flutterwave Merchant Cycle
                          </div>
                        )}
                        <div style={{ fontSize: '10px', color: 'var(--cb-text-muted)' }}>
                          Dest: {p.settlement_destination || 'Configured Merchant Account'}
                        </div>
                      </td>
                      <td>
                        <span className={`cb-badge ${
                          ['CONFIRMED', 'SUCCESSFUL'].includes(p.status)
                            ? 'cb-badge-emerald'
                            : p.status === 'REFUNDED'
                            ? 'cb-badge-rose'
                            : p.status === 'FAILED'
                            ? 'cb-badge-rose'
                            : 'cb-badge-amber'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {['CONFIRMED', 'SUCCESSFUL'].includes(p.status) && (
                            <button
                              onClick={() => openRefundModal(p)}
                              className="cb-btn cb-btn-outline cb-btn-sm"
                              style={{ gap: '3px', fontSize: '10px', padding: '3px 8px', color: '#F87171', borderColor: 'rgba(239,68,68,0.3)' }}
                              title="Execute refund with proportional commission clawback"
                            >
                              <RotateCcw size={11} /> Refund
                            </button>
                          )}
                          {p.status === 'REFUNDED' && (
                            <span style={{ fontSize: '10px', color: '#F87171', fontWeight: 600 }}>
                              Reversed
                            </span>
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

      {/* Commercial Proposals Management Table */}
      <div className="cb-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              Commercial Proposals & Client Transmittals (Phase 2A)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Track proposal lifecycle: DRAFT &rarr; SENT &rarr; VIEWED &rarr; CLIENT_APPROVED / CLIENT_REJECTED. Versioning preserves historical revisions.
            </p>
          </div>
          <span className="cb-badge cb-badge-neutral">{filteredProposals.length} of {proposals.length} Proposals</span>
        </div>

        {/* Proposals Filter & Search Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'DRAFT', 'SENT', 'VIEWED', 'CLIENT_APPROVED', 'CLIENT_REJECTED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setProposalFilterStatus(st)}
                className={`cb-btn cb-btn-sm ${proposalFilterStatus === st ? 'cb-btn-primary' : 'cb-btn-outline'}`}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={proposalSearchQuery}
            onChange={(e) => setProposalSearchQuery(e.target.value)}
            placeholder="Search proposals / clients..."
            className="cb-input"
            style={{ width: '220px', padding: '6px 12px', fontSize: '12px' }}
          />
        </div>

        {proposals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--cb-text-muted)', fontSize: '13px' }}>
            No proposals drafted yet. Click "Author Commercial Proposal" to create a scope for a client.
          </div>
        ) : filteredProposals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--cb-text-muted)', fontSize: '13px' }}>
            No proposals match your active filter criteria.
          </div>
        ) : (
          <div className="cb-table-container">
            <table className="cb-table">
              <thead>
                <tr>
                  <th>Proposal & Version</th>
                  <th>Client / Lead</th>
                  <th>Scope Title</th>
                  <th>Fixed Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProposals.map((p) => {
                  const amountFormatted = ((p.total_amount_minor || 0) / 100).toLocaleString();
                  const statusColors: any = {
                    DRAFT: 'cb-badge-neutral',
                    SENT: 'cb-badge-blue',
                    VIEWED: 'cb-badge-purple',
                    CLIENT_APPROVED: 'cb-badge-emerald',
                    CLIENT_REJECTED: 'cb-badge-rose',
                    EXPIRED: 'cb-badge-amber',
                    CANCELLED: 'cb-badge-neutral',
                  };

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--cb-text-primary)', fontSize: '13px' }}>
                          {p.proposal_number}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                          Version {p.version} &bull; {p.country_code || 'KE'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                          {p.company_name || p.lead_business_name || 'Direct Business'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--cb-text-muted)' }}>
                          {p.industry || 'Technology'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', fontWeight: 500 }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                          {p.deliverables?.length || 0} Deliverables
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                          {amountFormatted} {p.currency}
                        </span>
                      </td>
                      <td>
                        <span className={`cb-badge ${statusColors[p.status] || 'cb-badge-blue'}`}>
                          {p.status}
                        </span>
                        {p.status === 'CLIENT_REJECTED' && p.rejection_reason && (
                          <div style={{ fontSize: '11px', color: '#F87171', marginTop: '4px', maxWidth: '200px' }}>
                            Feedback: {p.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {p.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSendProposal(p.id)}
                              className="cb-btn cb-btn-primary cb-btn-sm"
                              style={{ gap: '4px' }}
                            >
                              <Send size={11} /> Send
                            </button>
                          )}
                          {p.status === 'CLIENT_REJECTED' && (
                            <button
                              onClick={() => {
                                setSelectedLeadForProposal({ id: p.lead_id, business_name: p.company_name, estimated_budget_minor: p.total_amount_minor, currency: p.currency });
                                setProposalForm({
                                  title: p.title + ' (Revised)',
                                  scopeOfWork: p.scope_of_work,
                                  deliverables: p.deliverables?.join('\n') || '',
                                  paymentStructureType: p.payment_structure_type || 'FULL_UPFRONT',
                                  totalAmount: ((p.total_amount_minor || 0) / 100).toString(),
                                  currency: p.currency,
                                  validDays: 14,
                                  termsNotes: p.terms_notes || '',
                                  status: 'SENT',
                                  lineItems: (p.line_items && p.line_items.length > 0)
                                    ? p.line_items.map((it: any, i: number) => ({
                                        id: it.id || `li-rev-${i}`,
                                        title: it.name || it.title || 'Service Item',
                                        description: it.description || '',
                                        item_type: it.item_type || 'CODEBRIDGE_SERVICE',
                                        platform: it.platform || 'CROSS_PLATFORM',
                                        amount: ((it.amount_minor || 0) / 100).toString(),
                                      }))
                                    : defaultLineItems,
                                  appStoreOwnership: p.app_store_ownership || 'CLIENT_OWNED',
                                  storeApprovalDisclaimer: p.store_approval_disclaimer || 'CodeBridge prepares and submits the application according to platform specifications. Final store approval is controlled exclusively by Apple and Google and is never guaranteed.',
                                });
                                setProposalModalOpen(true);
                              }}
                              className="cb-btn cb-btn-secondary cb-btn-sm"
                              style={{ gap: '4px' }}
                            >
                              <RefreshCw size={11} /> Revise (v{p.version + 1})
                            </button>
                          )}
                          {p.status === 'CLIENT_APPROVED' && (
                            <span style={{ fontSize: '12px', color: '#34D399', fontWeight: 600 }}>
                              Won &bull; Project Active
                            </span>
                          )}
                          {['DRAFT', 'SENT', 'VIEWED'].includes(p.status) && (
                            <button
                              onClick={() => handleCancelProposal(p.id)}
                              className="cb-btn cb-btn-secondary cb-btn-sm"
                              style={{ color: '#F87171' }}
                            >
                              Cancel
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

      {/* Commercial Billing & Invoices Management Table */}
      <div className="cb-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              Commercial Billing & Invoices Console
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Automated Gateway: Invoices transition to PAID automatically via Flutterwave Webhook & Server-Side Verification.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => handleReconcileGateway()}
              className="cb-btn cb-btn-outline cb-btn-sm"
              style={{ gap: '5px', fontSize: '11px' }}
              title="Query Flutterwave API to check all pending transactions"
            >
              <RefreshCw size={12} /> Reconcile Gateway Status
            </button>
            <span className="cb-badge cb-badge-neutral">{filteredInvoices.length} of {invoices.length} Invoices</span>
          </div>
        </div>

        {/* Automated Architecture Banner */}
        <div style={{
          padding: '10px 14px',
          borderRadius: '6px',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          marginBottom: '16px',
          fontSize: '11px',
          color: '#93C5FD',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldCheck size={14} style={{ flexShrink: 0 }} />
          <span><strong>Automatic Payment Confirmation:</strong> Clients pay via Flutterwave (M-Pesa, Card, Bank). When confirmed by the network, CodeBridge automatically records payment, marks invoices PAID, and activates project milestones without manual admin verification.</span>
        </div>

        {/* Invoice Filter & Search Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setInvoiceFilterStatus(st)}
                className={`cb-btn cb-btn-sm ${invoiceFilterStatus === st ? 'cb-btn-primary' : 'cb-btn-outline'}`}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={invoiceSearchQuery}
            onChange={(e) => setInvoiceSearchQuery(e.target.value)}
            placeholder="Search invoices / clients..."
            className="cb-input"
            style={{ width: '220px', padding: '6px 12px', fontSize: '12px' }}
          />
        </div>

        {invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--cb-text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p>No commercial invoices issued yet. Approve a proposal to generate an upfront invoice.</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--cb-text-muted)' }}>
            <p>No invoices match your active filter criteria.</p>
          </div>
        ) : (
          <div className="cb-table-container">
            <table className="cb-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client / Company</th>
                  <th>Project / Milestone Scope</th>
                  <th>Amount Due</th>
                  <th>Verified Paid</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Billing Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const amountFmt = ((inv.amount_minor || 0) / 100).toLocaleString();
                  const paidFmt = ((inv.amount_paid_minor || 0) / 100).toLocaleString();
                  const remainingFmt = (((inv.amount_minor || 0) - (inv.amount_paid_minor || 0)) / 100).toLocaleString();
                  return (
                    <tr key={inv.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--cb-accent)' }}>
                          {inv.invoice_number}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>{inv.company_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>{inv.country_code}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>{inv.title}</div>
                        {inv.project_code && (
                          <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                            Project: {inv.project_code} &bull; Status: {inv.project_status}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                          {amountFmt} {inv.currency}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: inv.amount_paid_minor > 0 ? '#34D399' : 'var(--cb-text-muted)', fontWeight: 600 }}>
                          {paidFmt} {inv.currency}
                        </span>
                        {inv.status === 'PARTIALLY_PAID' && (
                          <div style={{ fontSize: '10px', color: '#FBBF24' }}>
                            Rem: {remainingFmt} {inv.currency}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--cb-text-secondary)' }}>
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`cb-badge ${
                          inv.status === 'PAID'
                            ? 'cb-badge-emerald'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'cb-badge-amber'
                            : inv.status === 'CANCELLED'
                            ? 'cb-badge-rose'
                            : 'cb-badge-blue'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {inv.status === 'PAID' ? (
                            <span className="cb-badge cb-badge-emerald" style={{ fontSize: '10px', gap: '3px' }}>
                              ✓ Flutterwave Confirmed
                            </span>
                          ) : inv.status !== 'CANCELLED' ? (
                            <>
                              <button
                                onClick={() => handleReconcileGateway(inv.id)}
                                className="cb-btn cb-btn-outline cb-btn-sm"
                                style={{ gap: '3px', fontSize: '10px', padding: '3px 8px' }}
                                title="Query Flutterwave API directly for this invoice"
                              >
                                <RefreshCw size={11} /> Check Gateway
                              </button>
                              <button
                                onClick={() => openPaymentModal(inv)}
                                className="cb-btn cb-btn-secondary cb-btn-sm"
                                style={{ fontSize: '10px', color: 'var(--cb-text-muted)', padding: '3px 6px' }}
                                title="Exceptional accounting adjustment (e.g. manual wire correction)"
                              >
                                Wire Adj.
                              </button>
                            </>
                          ) : null}
                          {inv.status === 'ISSUED' && (
                            <button
                              onClick={async () => {
                                if (confirm(`Cancel invoice ${inv.invoice_number}?`)) {
                                  await fetch(`/api/invoices/${inv.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'CANCEL' }),
                                  });
                                  loadData();
                                }
                              }}
                              className="cb-btn cb-btn-secondary cb-btn-sm"
                              style={{ color: '#F87171', fontSize: '10px', padding: '3px 6px' }}
                            >
                              Cancel
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

      {/* Lead Pipeline Management Table */}
      <div className="cb-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              Commercial Lead Lifecycle & Qualification
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Advance pipeline: NEW &rarr; CONTACTED &rarr; QUALIFIED &rarr; REQUIREMENTS_COLLECTED &rarr; PROPOSAL.
            </p>
          </div>
          <span className="cb-badge cb-badge-neutral">{leads.length} Leads</span>
        </div>

        <div className="cb-table-container">
          <table className="cb-table">
            <thead>
              <tr>
                <th>Business & Contact</th>
                <th>Country</th>
                <th>Service / Scope</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Assigned Rep</th>
                <th>Pipeline Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const budgetFormatted = ((l.estimated_budget_minor || 0) / 100).toLocaleString();
                return (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>{l.business_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--cb-text-muted)' }}>
                        {l.contact_person} &bull; {l.email}
                      </div>
                    </td>
                    <td>
                      <span className="cb-badge cb-badge-neutral">{l.country_name} ({l.country_code})</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--cb-text-secondary)' }}>{l.business_type}</div>
                      <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.requirements}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                        {budgetFormatted} {l.currency}
                      </span>
                    </td>
                    <td>
                      <span className={`cb-badge ${l.status === 'WON' ? 'cb-badge-emerald' : l.status === 'LOST' ? 'cb-badge-rose' : 'cb-badge-blue'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--cb-text-secondary)' }}>
                        {l.rep_first_name ? `${l.rep_first_name} ${l.rep_last_name}` : 'Unassigned (Direct Web)'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {l.status !== 'WON' && l.status !== 'LOST' && (
                          <>
                            {l.status === 'NEW' && (
                              <button
                                onClick={() => handleUpdateStatus(l.id, 'CONTACTED')}
                                className="cb-btn cb-btn-secondary cb-btn-sm"
                              >
                                Contacted
                              </button>
                            )}
                            {l.status === 'CONTACTED' && (
                              <button
                                onClick={() => handleUpdateStatus(l.id, 'QUALIFIED')}
                                className="cb-btn cb-btn-secondary cb-btn-sm"
                              >
                                Qualify
                              </button>
                            )}
                            {l.status === 'QUALIFIED' && (
                              <button
                                onClick={() => handleUpdateStatus(l.id, 'REQUIREMENTS_COLLECTED')}
                                className="cb-btn cb-btn-secondary cb-btn-sm"
                              >
                                Scoped
                              </button>
                            )}
                            {['QUALIFIED', 'REQUIREMENTS_COLLECTED'].includes(l.status) && (
                              <button
                                onClick={() => handleOpenProposalModal(l)}
                                className="cb-btn cb-btn-primary cb-btn-sm"
                                style={{ gap: '4px' }}
                              >
                                <FileText size={12} /> Create Proposal
                              </button>
                            )}
                          </>
                        )}
                        {l.status === 'WON' && (
                          <span style={{ fontSize: '12px', color: '#34D399', fontWeight: 600 }}>
                            Won via Proposal Approval
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setChatEntityId(l.id);
                            setChatEntityType('LEAD');
                            setChatOpen(true);
                          }}
                          className="cb-btn cb-btn-secondary cb-btn-sm"
                          style={{ gap: '4px' }}
                        >
                          <MessageSquare size={12} /> Chat
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registered Platform Accounts & User Directory Table */}
      <div className="cb-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="cb-badge cb-badge-blue" style={{ marginBottom: '6px' }}>
              <Users size={12} /> Platform Directory & User Registry
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              Registered Platform Accounts & User Directory
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Real-time synchronization of all client signups, field representatives, and admin operators.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search users, emails, phones, companies..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="cb-input"
              style={{ width: '260px', padding: '6px 12px', fontSize: '12px' }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'CLIENT', 'REPRESENTATIVE', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  onClick={() => setUserRoleFilter(role)}
                  className={`cb-btn cb-btn-sm ${userRoleFilter === role ? 'cb-btn-primary' : 'cb-btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--cb-text-muted)', fontSize: '13px' }}>
            No registered users match the selected criteria.
          </div>
        ) : (
          <div className="cb-table-container">
            <table className="cb-table">
              <thead>
                <tr>
                  <th>User & Contact</th>
                  <th>Role</th>
                  <th>Organization / Territory Details</th>
                  <th>Country</th>
                  <th>Registered Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unnamed User';
                  const roleBadgeClass =
                    u.role === 'CLIENT'
                      ? 'cb-badge-blue'
                      : u.role === 'REPRESENTATIVE'
                      ? 'cb-badge-emerald'
                      : u.role === 'SUPER_ADMIN'
                      ? 'cb-badge-purple'
                      : 'cb-badge-neutral';

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                          {fullName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--cb-text-muted)' }}>
                          {u.email}
                        </div>
                        {u.phone && (
                          <div style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', fontFamily: 'monospace' }}>
                            {u.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`cb-badge ${roleBadgeClass}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.role === 'CLIENT' ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)', fontSize: '13px' }}>
                              {u.company_name || 'Individual Client'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                              {u.industry || 'General Software'}
                            </div>
                          </div>
                        ) : u.role === 'REPRESENTATIVE' ? (
                          <div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10B981', fontSize: '13px' }}>
                              Code: {u.referral_code || 'N/A'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                              Territory: {u.territory_id || 'DEFAULT'} &bull; Status: {u.approval_status || 'ACTIVE'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--cb-text-secondary)' }}>
                            Internal Operator
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="cb-badge cb-badge-neutral">
                          {u.country_name || (u.country_id === 'c_ng' ? 'Nigeria' : 'Kenya')} ({u.country_code || (u.country_id === 'c_ng' ? 'NG' : 'KE')})
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--cb-text-secondary)' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recent'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--cb-text-muted)' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      <td>
                        <span className={`cb-badge ${u.status === 'SUSPENDED' ? 'cb-badge-rose' : 'cb-badge-emerald'}`}>
                          {u.status || 'ACTIVE'}
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

      {/* Territory Attribution & Commission Governance Console */}
      <div className="cb-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="cb-badge cb-badge-emerald" style={{ marginBottom: '6px' }}>
              <Globe2 size={12} /> Multi-Country Commercial Governance
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              Territory Attribution & Commission Governance
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '2px' }}>
              Controls commercial routing: Direct Admin (NG) with 0% rep commission leakage vs Field Rep Managed (KE) with 20% automated commission & M-Pesa payouts.
            </p>
          </div>
          <span className="cb-badge cb-badge-neutral">{territories.length} Configured Territories</span>
        </div>

        <div className="cb-table-container">
          <table className="cb-table">
            <thead>
              <tr>
                <th>Territory Code</th>
                <th>Country</th>
                <th>Currency</th>
                <th>Commercial Model</th>
                <th>Default Payout Method</th>
                <th>Commission Rate</th>
                <th>Status</th>
                <th>Governance Actions</th>
              </tr>
            </thead>
            <tbody>
              {territories.map((t) => {
                const isDirect = Boolean(t.direct_admin);
                const ratePct = ((t.default_commission_rate_bps || 2000) / 100).toFixed(1);
                return (
                  <tr key={t.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: isDirect ? '#60A5FA' : '#10B981' }}>
                        {t.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>{t.country_name}</div>
                    </td>
                    <td>
                      <span className="cb-badge cb-badge-neutral" style={{ fontWeight: 700 }}>
                        {t.currency}
                      </span>
                    </td>
                    <td>
                      <span className={`cb-badge ${isDirect ? 'cb-badge-blue' : 'cb-badge-emerald'}`} style={{ fontWeight: 700 }}>
                        {isDirect ? 'Direct Admin (0% Leakage)' : 'Field Rep Managed (20%)'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--cb-text-secondary)' }}>
                        {t.default_payout_method || 'BANK'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: isDirect ? 'var(--cb-text-muted)' : '#34D399' }}>
                        {isDirect ? '0.0% (Admin)' : `${ratePct}%`}
                      </span>
                    </td>
                    <td>
                      <span className={`cb-badge ${t.is_active ? 'cb-badge-emerald' : 'cb-badge-rose'}`}>
                        {t.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setEditingTerritory(t)}
                        className="cb-btn cb-btn-outline cb-btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        Configure
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Author Proposal & Quote Builder Modal (Phase 2A + Mobile Pricing Rules) */}
      {proposalModalOpen && (
        <div className="cb-modal-overlay">
          <div className="cb-modal" style={{ maxWidth: '850px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="cb-modal-header">
              <div>
                <div className="cb-badge cb-badge-blue" style={{ marginBottom: '4px' }}>
                  <Briefcase size={12} /> Commercial Quote & Engineering Scope
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>
                  Author Commercial Proposal & Quote Builder
                </h3>
              </div>
              <button
                onClick={() => setProposalModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cb-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProposal}>
              <div className="cb-modal-body">
                {selectedLeadForProposal && (
                  <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '16px', fontSize: '13px', color: '#93C5FD' }}>
                    Authoring proposal for lead: <strong>{selectedLeadForProposal.business_name}</strong> ({selectedLeadForProposal.currency})
                  </div>
                )}

                <div className="cb-grid-2">
                  <div className="cb-form-group">
                    <label className="cb-label">Proposal Title *</label>
                    <input
                      type="text"
                      required
                      value={proposalForm.title}
                      onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                      className="cb-input"
                      placeholder="e.g. Enterprise Mobile & Payment Infrastructure"
                    />
                  </div>

                  <div className="cb-form-group">
                    <label className="cb-label">Proposal Currency *</label>
                    <select
                      value={proposalForm.currency}
                      onChange={(e) => setProposalForm({ ...proposalForm, currency: e.target.value })}
                      className="cb-select"
                    >
                      <option value="KES">KES (Kenya Shillings — M-Pesa & Card Collection)</option>
                      <option value="NGN">NGN (Nigerian Naira — Flutterwave Direct)</option>
                    </select>
                  </div>
                </div>

                <div className="cb-form-group">
                  <label className="cb-label">Scope of Work *</label>
                  <textarea
                    required
                    rows={2}
                    value={proposalForm.scopeOfWork}
                    onChange={(e) => setProposalForm({ ...proposalForm, scopeOfWork: e.target.value })}
                    className="cb-textarea"
                    placeholder="Describe technical objectives, system architecture, and solution components..."
                  />
                </div>

                {/* Mobile App & Store Publishing Architecture Controls */}
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--cb-border-subtle)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Smartphone size={16} color="#60A5FA" />
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0 }}>
                      Mobile App & Store Publishing Configuration
                    </h4>
                  </div>

                  <div className="cb-grid-2">
                    <div className="cb-form-group">
                      <label className="cb-label">Developer Account Ownership *</label>
                      <select
                        value={proposalForm.appStoreOwnership}
                        onChange={(e) => setProposalForm({ ...proposalForm, appStoreOwnership: e.target.value })}
                        className="cb-select"
                      >
                        <option value="CLIENT_OWNED">Client-Owned Developer Account (Default & Recommended)</option>
                        <option value="CODEBRIDGE_MANAGED">CodeBridge-Managed Account (Agency Credentials)</option>
                      </select>
                      <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', display: 'block', marginTop: '4px' }}>
                        Under Client-Owned, client registers Google Play ($25) and Apple Developer ($99/yr) directly. CodeBridge prepares, compiles, and manages submissions.
                      </span>
                    </div>

                    <div className="cb-form-group">
                      <label className="cb-label">Store Approval Regulatory Notice</label>
                      <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '11px', color: '#FCD34D', lineHeight: '1.4' }}>
                        <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                        <strong>Platform Rule:</strong> CodeBridge submits applications adhering to official platform guidelines. Final store approval is controlled exclusively by Apple and Google and is <em>never guaranteed</em>.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Quote Builder: Line Items with Item Type Selector */}
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--cb-surface-card)', border: '1px solid var(--cb-border-subtle)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0 }}>
                        Quote Breakdown & Item Classification
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--cb-text-muted)', margin: '2px 0 0 0' }}>
                        Classify every item as CodeBridge Service (Revenue), Third-Party Fee (Non-Revenue), or Reimbursable Expense.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="cb-btn cb-btn-outline cb-btn-sm"
                      style={{ gap: '4px', fontSize: '11px' }}
                    >
                      <Plus size={13} /> Add Line Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {proposalForm.lineItems.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          padding: '12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--cb-bg)',
                          border: item.item_type === 'CODEBRIDGE_SERVICE'
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : item.item_type === 'THIRD_PARTY_FEE'
                            ? '1px solid rgba(59, 130, 246, 0.3)'
                            : '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        <div className="cb-grid-4" style={{ gap: '8px', marginBottom: '8px' }}>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '10px', color: 'var(--cb-text-muted)', display: 'block', marginBottom: '2px' }}>Item Name / Deliverable</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleLineItemChange(idx, 'title', e.target.value)}
                              className="cb-input"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '10px', color: 'var(--cb-text-muted)', display: 'block', marginBottom: '2px' }}>Type Classification *</label>
                            <select
                              value={item.item_type}
                              onChange={(e) => handleLineItemChange(idx, 'item_type', e.target.value)}
                              className="cb-select"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                            >
                              <option value="CODEBRIDGE_SERVICE">CodeBridge Service (Revenue)</option>
                              <option value="THIRD_PARTY_FEE">Third-Party Fee (Client Direct)</option>
                              <option value="REIMBURSABLE_EXPENSE">Reimbursable Expense (Pass-Through)</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '10px', color: 'var(--cb-text-muted)', display: 'block', marginBottom: '2px' }}>Amount ({proposalForm.currency})</label>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <input
                                type="number"
                                value={item.amount}
                                onChange={(e) => handleLineItemChange(idx, 'amount', e.target.value)}
                                className="cb-input"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              />
                              {proposalForm.lineItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLineItem(idx)}
                                  style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '4px' }}
                                  title="Remove item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                            className="cb-input"
                            placeholder="Description / note (e.g. Paid directly to Google or Apple)"
                            style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}
                          />
                          <span className={`cb-badge ${
                            item.item_type === 'CODEBRIDGE_SERVICE'
                              ? 'cb-badge-emerald'
                              : item.item_type === 'THIRD_PARTY_FEE'
                              ? 'cb-badge-blue'
                              : 'cb-badge-amber'
                          }`} style={{ fontSize: '10px', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                            {item.item_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calculated Quote Summary Box */}
                  <div style={{
                    marginTop: '14px',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--cb-border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '12px',
                  }}>
                    <div>
                      <div style={{ color: '#34D399', fontWeight: 600 }}>
                        CodeBridge Services: {proposalForm.lineItems
                          .filter(i => i.item_type === 'CODEBRIDGE_SERVICE')
                          .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
                          .toLocaleString()} {proposalForm.currency}
                      </div>
                      <div style={{ color: '#60A5FA', fontSize: '11px', marginTop: '2px' }}>
                        Client Direct 3rd-Party Costs: {proposalForm.lineItems
                          .filter(i => i.item_type === 'THIRD_PARTY_FEE')
                          .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
                          .toLocaleString()} {proposalForm.currency} (Not CodeBridge Revenue)
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', display: 'block' }}>
                        Total Invoiced by CodeBridge
                      </span>
                      <strong style={{ fontSize: '16px', color: 'var(--cb-text-primary)' }}>
                        {(parseFloat(proposalForm.totalAmount) || 0).toLocaleString()} {proposalForm.currency}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="cb-form-group">
                  <label className="cb-label">Deliverables Checklist (One per line) *</label>
                  <textarea
                    required
                    rows={3}
                    value={proposalForm.deliverables}
                    onChange={(e) => setProposalForm({ ...proposalForm, deliverables: e.target.value })}
                    className="cb-textarea"
                    placeholder="Deliverable item 1&#10;Deliverable item 2"
                  />
                </div>

                <div className="cb-grid-2">
                  <div className="cb-form-group">
                    <label className="cb-label">Payment Commercial Structure *</label>
                    <select
                      value={proposalForm.paymentStructureType}
                      onChange={(e) => setProposalForm({ ...proposalForm, paymentStructureType: e.target.value })}
                      className="cb-select"
                    >
                      <option value="FULL_UPFRONT">Option A: 100% Full Payment Upfront (Default)</option>
                      <option value="DEPOSIT_MILESTONES">Option B: 50% Deposit / 30% Milestone / 20% Handover</option>
                    </select>
                    <span style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', display: 'block', marginTop: '4px' }}>
                      {proposalForm.paymentStructureType === 'FULL_UPFRONT'
                        ? '• Default: Issues 100% upfront invoice. Project kicks off strictly after verified Flutterwave payment.'
                        : '• Staged: 50% upfront deposit to initiate development; milestones invoiced at 30% and 20% completion.'}
                    </span>
                  </div>

                  <div className="cb-form-group">
                    <label className="cb-label">Authoritative Proposal Amount ({proposalForm.currency}) *</label>
                    <input
                      type="number"
                      required
                      step="1"
                      value={proposalForm.totalAmount}
                      onChange={(e) => setProposalForm({ ...proposalForm, totalAmount: e.target.value })}
                      className="cb-input"
                      placeholder="e.g. 280000"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                      Stored safely in integer minor units ({Math.round(parseFloat(proposalForm.totalAmount || '0') * 100)} minor)
                    </span>
                  </div>
                </div>

                <div className="cb-grid-2">
                  <div className="cb-form-group">
                    <label className="cb-label">Validity Period (Days)</label>
                    <input
                      type="number"
                      value={proposalForm.validDays}
                      onChange={(e) => setProposalForm({ ...proposalForm, validDays: parseInt(e.target.value) || 14 })}
                      className="cb-input"
                    />
                  </div>

                  <div className="cb-form-group">
                    <label className="cb-label">Initial Status</label>
                    <select
                      value={proposalForm.status}
                      onChange={(e) => setProposalForm({ ...proposalForm, status: e.target.value })}
                      className="cb-select"
                    >
                      <option value="SENT">SENT (Direct to Client Review)</option>
                      <option value="DRAFT">DRAFT (Internal Review First)</option>
                    </select>
                  </div>
                </div>

                <div className="cb-form-group">
                  <label className="cb-label">Terms & Warranty Notes</label>
                  <input
                    type="text"
                    value={proposalForm.termsNotes}
                    onChange={(e) => setProposalForm({ ...proposalForm, termsNotes: e.target.value })}
                    className="cb-input"
                  />
                </div>
              </div>

              <div className="cb-modal-footer">
                <button
                  type="button"
                  onClick={() => setProposalModalOpen(false)}
                  className="cb-btn cb-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="cb-btn cb-btn-primary" style={{ gap: '6px' }}>
                  <Send size={14} /> Transmit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Payment Modal (Phase 2B) */}
      {paymentModalOpen && selectedInvoiceForPayment && (
        <div className="cb-modal-overlay">
          <div className="cb-modal" style={{ maxWidth: '600px' }}>
            <div className="cb-modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#F59E0B" /> Exceptional Accounting Adjustment (Audited)
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cb-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleVerifyPayment}>
              <div className="cb-modal-body">
                {/* Notice Banner */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  marginBottom: '16px',
                  fontSize: '11px',
                  color: '#FCD34D',
                  lineHeight: '1.4',
                }}>
                  <strong>Operational Notice:</strong> Standard client payments via Flutterwave (M-Pesa & Card in Kenya, Card & Bank in Nigeria) confirm automatically via server webhooks. Use this form <em>strictly for offline corporate bank wire exceptions</em>. Every adjustment is logged to the permanent audit trail.
                </div>

                {/* Summary banner */}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid var(--cb-border-subtle)',
                  marginBottom: '18px',
                  fontSize: '13px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--cb-text-muted)' }}>Invoice Number:</span>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--cb-accent)' }}>{selectedInvoiceForPayment.invoice_number}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--cb-text-muted)' }}>Client / Company:</span>
                    <strong style={{ color: 'var(--cb-text-primary)' }}>{selectedInvoiceForPayment.company_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--cb-text-muted)' }}>Total Invoiced:</span>
                    <span style={{ fontWeight: 600, color: 'var(--cb-text-primary)' }}>
                      {((selectedInvoiceForPayment.amount_minor || 0) / 100).toLocaleString()} {selectedInvoiceForPayment.currency}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--cb-text-muted)' }}>Remaining Unpaid:</span>
                    <span style={{ fontWeight: 700, color: '#FBBF24' }}>
                      {(((selectedInvoiceForPayment.amount_minor || 0) - (selectedInvoiceForPayment.amount_paid_minor || 0)) / 100).toLocaleString()} {selectedInvoiceForPayment.currency}
                    </span>
                  </div>
                </div>

                <div className="cb-grid-2">
                  <div className="cb-form-group">
                    <label className="cb-label">Amount to Verify ({selectedInvoiceForPayment.currency}) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="cb-input"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="cb-form-group">
                    <label className="cb-label">Transaction Reference *</label>
                    <input
                      type="text"
                      required
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                      className="cb-input"
                      placeholder="e.g. TXN-WIRE-00123"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                      Must be unique across all verified settlements
                    </span>
                  </div>
                </div>

                <div className="cb-grid-2">
                  <div className="cb-form-group">
                    <label className="cb-label">Payment Method (Client Channel) *</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="cb-select"
                    >
                      <option value="BANK_TRANSFER">Bank Wire / Electronic Transfer</option>
                      <option value="CASH">Cash Settlement</option>
                      <option value="OTHER_MANUAL">Other Manual Channel</option>
                      <option value="GATEWAY_SIMULATION">Gateway Simulation</option>
                    </select>
                  </div>

                  <div className="cb-form-group">
                    <label className="cb-label">Verification Source (Authenticity) *</label>
                    <select
                      value={paymentForm.verificationSource}
                      onChange={(e) => setPaymentForm({ ...paymentForm, verificationSource: e.target.value })}
                      className="cb-select"
                    >
                      <option value="MANUAL_VERIFICATION">Manual Bank Statement Check</option>
                      <option value="BANK_TRANSFER_CONFIRMATION">Bank Transfer Confirmation Slip</option>
                      <option value="GATEWAY_SIMULATION">Gateway Simulation</option>
                    </select>
                  </div>
                </div>

                <div className="cb-form-group">
                  <label className="cb-label">Verification Audit Notes</label>
                  <textarea
                    rows={2}
                    value={paymentForm.verificationNotes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, verificationNotes: e.target.value })}
                    className="cb-textarea"
                    placeholder="Internal reference, bank deposit slip details, or account confirmation notes..."
                  />
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  fontSize: '12px',
                  color: '#93C5FD',
                  lineHeight: '1.5',
                }}>
                  <strong>Atomic Execution:</strong> Recording verification atomically updates invoice & project balances, evaluates project start criteria, and produces an immutable Commission Event for Phase 2D.
                </div>
              </div>

              <div className="cb-modal-footer">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="cb-btn cb-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cb-btn cb-btn-primary"
                  style={{ gap: '6px', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
                >
                  <ShieldCheck size={15} /> Record Audited Accounting Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execute Client Refund Modal */}
      {refundModalOpen && selectedPaymentForRefund && (
        <div className="cb-modal-overlay">
          <div className="cb-modal" style={{ maxWidth: '600px' }}>
            <div className="cb-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={20} color="#F87171" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0 }}>
                  Execute Client Refund & Ledger Reversal
                </h3>
              </div>
              <button
                onClick={() => setRefundModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cb-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteRefund}>
              <div className="cb-modal-body">
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#FCA5A5',
                  lineHeight: '1.5',
                }}>
                  <ShieldAlert size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
                  <strong>Double-Entry Ledger Governance:</strong> Executing a refund issues Flutterwave refund instructions, posts debit/credit reversal entries to the authoritative financial ledger, and calculates proportional commission clawbacks. If the sales rep was already paid, a recovery receivable obligation is created automatically.
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--cb-surface-card)',
                  border: '1px solid var(--cb-border-subtle)',
                  marginBottom: '18px',
                  fontSize: '13px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--cb-text-muted)' }}>Payment ID:</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--cb-accent)', fontWeight: 600 }}>{selectedPaymentForRefund.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--cb-text-muted)' }}>Original Amount:</span>
                    <span style={{ fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                      {((selectedPaymentForRefund.amount_minor || selectedPaymentForRefund.gross_amount_minor || 0) / 100).toLocaleString()} {selectedPaymentForRefund.currency}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--cb-text-muted)' }}>Gateway Reference:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--cb-text-secondary)' }}>
                      {selectedPaymentForRefund.gateway_reference || selectedPaymentForRefund.reference}
                    </span>
                  </div>
                </div>

                <div className="cb-form-group">
                  <label className="cb-label">Refund Amount ({selectedPaymentForRefund.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    className="cb-input"
                    max={((selectedPaymentForRefund.amount_minor || selectedPaymentForRefund.gross_amount_minor || 0) / 100).toString()}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', display: 'block', marginTop: '4px' }}>
                    Enter full amount for 100% cancellation or lesser amount for partial proration.
                  </span>
                </div>

                <div className="cb-form-group">
                  <label className="cb-label">Reason for Refund *</label>
                  <textarea
                    required
                    rows={2}
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    className="cb-textarea"
                    placeholder="e.g. Client requested project scope cancellation prior to kickoff..."
                  />
                </div>
              </div>

              <div className="cb-modal-footer">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="cb-btn cb-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundSubmitting}
                  className="cb-btn cb-btn-primary"
                  style={{ gap: '6px', background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)' }}
                >
                  <RotateCcw size={14} className={refundSubmitting ? 'spin' : ''} />
                  {refundSubmitting ? 'Processing Ledger Reversal...' : 'Authorize Refund & Reverse Commission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Territory Modal */}
      {editingTerritory && (
        <div className="cb-modal-overlay">
          <div className="cb-modal" style={{ maxWidth: '500px' }}>
            <div className="cb-modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)' }}>
                Configure Territory: {editingTerritory.country_name} ({editingTerritory.id})
              </h3>
              <button
                onClick={() => setEditingTerritory(null)}
                style={{ background: 'none', border: 'none', color: 'var(--cb-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cb-modal-body">
              <div className="cb-form-group">
                <label className="cb-label">Default Payout Method</label>
                <select
                  value={editingTerritory.default_payout_method}
                  onChange={(e) => setEditingTerritory({ ...editingTerritory, default_payout_method: e.target.value })}
                  className="cb-select"
                >
                  <option value="BANK">BANK (Direct Wire / Flutterwave Transfer)</option>
                  <option value="MPESA">MPESA (Kenya Mobile Money Direct)</option>
                  <option value="MOBILE_MONEY">MOBILE_MONEY (Ghana / Uganda MoMo)</option>
                </select>
              </div>

              <div className="cb-form-group">
                <label className="cb-label">Default Commission Rate (Basis Points: 2000 = 20%)</label>
                <input
                  type="number"
                  value={editingTerritory.default_commission_rate_bps}
                  onChange={(e) => setEditingTerritory({ ...editingTerritory, default_commission_rate_bps: parseInt(e.target.value) || 2000 })}
                  className="cb-input"
                />
                <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)' }}>
                  {(editingTerritory.default_commission_rate_bps / 100).toFixed(2)}% commission rate
                </span>
              </div>

              <div className="cb-form-group">
                <label className="cb-label">Territory Status</label>
                <select
                  value={editingTerritory.is_active ? '1' : '0'}
                  onChange={(e) => setEditingTerritory({ ...editingTerritory, is_active: e.target.value === '1' ? 1 : 0 })}
                  className="cb-select"
                >
                  <option value="1">ACTIVE</option>
                  <option value="0">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="cb-modal-footer">
              <button
                type="button"
                onClick={() => setEditingTerritory(null)}
                className="cb-btn cb-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveTerritory(editingTerritory)}
                className="cb-btn cb-btn-primary"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={chatOpen}
        onClose={() => {
          setChatOpen(false);
          loadData();
        }}
        entityId={chatEntityId}
        entityType={chatEntityType}
        currentUser={currentUser}
      />
    </div>
  );
}
