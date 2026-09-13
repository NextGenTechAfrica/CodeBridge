// src/components/dashboard/representative/AddClientModal.tsx
'use client';

import React, { useState } from 'react';
import { UserPlus, Plus, X, Link as LinkIcon, CheckCircle2, Sparkles, Building2, Copy, Check } from 'lucide-react';
import { useRep } from '@/app/dashboard/representative/RepContext';

const SERVICE_OPTIONS = [
  'Restaurant Websites & Online Ordering Systems',
  'School Portals & Student Management Systems',
  'Real Estate Listings & CRM Portals',
  'Healthcare & Clinic Booking Systems',
  'Custom E-Commerce & Payment Solutions',
  'Enterprise SaaS & Custom Web Applications',
  'Mobile Applications (iOS & Android)',
  'Business Management Systems (BMS / ERP)',
  'Inventory & Point-of-Sale (POS) Systems',
  'Logistics, Fleet & Dispatch Tracking',
  'Hotel & Accommodation Reservation Engines',
  'Corporate Brand Websites & CMS',
  'Fintech, Escrow & Payment Integration',
  'Cloud Infrastructure & API Development',
  'Custom Solution / Other (Specify)',
];

export default function AddClientModal() {
  const {
    leadModalOpen,
    setLeadModalOpen,
    clientModalOpen,
    setClientModalOpen,
    newLead,
    setNewLead,
    handleCreateLead,
    newClient,
    setNewClient,
    newClientOnboardingUrl,
    setNewClientOnboardingUrl,
    copiedClientLink,
    copyClientOnboardingLink,
    handleRegisterOfflineClient,
    currency,
  } = useRep();

  const isOpen = leadModalOpen || clientModalOpen;
  const [activeTab, setActiveTab] = useState<'direct' | 'link'>('direct');
  const [selectedService, setSelectedService] = useState(SERVICE_OPTIONS[0]);
  const [customServiceText, setCustomServiceText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ clientName: string; link?: string } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setLeadModalOpen(false);
    setClientModalOpen(false);
    setSuccessInfo(null);
    setNewClientOnboardingUrl('');
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedService(val);
    if (val === 'Custom Solution / Other (Specify)') {
      setNewLead((prev: any) => ({ ...prev, businessType: customServiceText || 'Custom Solution' }));
    } else {
      setNewLead((prev: any) => ({ ...prev, businessType: val }));
    }
  };

  const handleCustomServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCustomServiceText(text);
    setNewLead((prev: any) => ({ ...prev, businessType: text || 'Custom Solution' }));
  };

  const onDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalService = selectedService === 'Custom Solution / Other (Specify)' ? (customServiceText || 'Custom Solution') : selectedService;
      newLead.businessType = finalService;
      const ok = await handleCreateLead(e);
      if (ok) {
        setSuccessInfo({ clientName: newLead.businessName });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await handleRegisterOfflineClient(e);
      if (ok) {
        // newClientOnboardingUrl is set in handleRegisterOfflineClient
        setSuccessInfo({ clientName: newClient.companyName });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        backdropFilter: 'blur(6px)',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--cb-bg-card)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          border: '1px solid var(--cb-border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxHeight: '92vh',
          overflowY: 'auto',
          color: 'var(--cb-text-primary)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: 0 }}>
                Add New Client
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', margin: '2px 0 0 0' }}>
                Register client details into your pipeline or generate an onboarding link
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cb-text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Screen */}
        {successInfo ? (
          <div
            style={{
              padding: '28px 24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              border: '1px solid rgba(5, 150, 105, 0.3)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(5, 150, 105, 0.2)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cb-text-primary)', margin: '0 0 6px 0' }}>
              Client Successfully Registered!
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              <strong>{successInfo.clientName}</strong> is now captured in your territory pipeline. Our engineering team will review requirements and prepare commercial proposals.
            </p>

            {newClientOnboardingUrl && (
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#34D399', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Client Direct Intake Link
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={newClientOnboardingUrl}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--cb-border-subtle)',
                      backgroundColor: 'var(--cb-bg-surface)',
                      color: 'var(--cb-text-primary)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    onClick={copyClientOnboardingLink}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: copiedClientLink ? '#059669' : '#2563EB',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {copiedClientLink ? <Check size={14} /> : <Copy size={14} />}
                    {copiedClientLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '11px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              Done &amp; Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Modal Tabs Navigation */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '4px',
                backgroundColor: 'var(--cb-bg-surface)',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid var(--cb-border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('direct')}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeTab === 'direct' ? '#2563EB' : 'transparent',
                  color: activeTab === 'direct' ? '#FFFFFF' : 'var(--cb-text-secondary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={14} /> Direct Client Intake
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('link')}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeTab === 'link' ? '#2563EB' : 'transparent',
                  color: activeTab === 'link' ? '#FFFFFF' : 'var(--cb-text-secondary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <LinkIcon size={14} /> Generate Client Link
              </button>
            </div>

            {/* Tab 1: Direct Intake */}
            {activeTab === 'direct' && (
              <form onSubmit={onDirectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                    Company / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Health Logistics"
                    value={newLead.businessName}
                    onChange={(e) => setNewLead({ ...newLead, businessName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--cb-border-subtle)',
                      backgroundColor: 'var(--cb-bg-surface)',
                      color: 'var(--cb-text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Jane Doe"
                      value={newLead.contactPerson}
                      onChange={(e) => setNewLead({ ...newLead, contactPerson: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--cb-border-subtle)',
                        backgroundColor: 'var(--cb-bg-surface)',
                        color: 'var(--cb-text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane@apexhealth.com"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--cb-border-subtle)',
                        backgroundColor: 'var(--cb-bg-surface)',
                        color: 'var(--cb-text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+254 700 000 000"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--cb-border-subtle)',
                        backgroundColor: 'var(--cb-bg-surface)',
                        color: 'var(--cb-text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                      Estimated Budget ({newLead.currency || currency})
                    </label>
                    <input
                      type="number"
                      placeholder="500000"
                      value={newLead.estimatedBudget}
                      onChange={(e) => setNewLead({ ...newLead, estimatedBudget: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--cb-border-subtle)',
                        backgroundColor: 'var(--cb-bg-surface)',
                        color: 'var(--cb-text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>

                {/* Service Focus Dropdown with Full Catalog & Custom Option */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                    Service Focus &amp; Solution Scope
                  </label>
                  <select
                    value={selectedService}
                    onChange={handleServiceChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--cb-border-subtle)',
                      backgroundColor: 'var(--cb-bg-surface)',
                      color: 'var(--cb-text-primary)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {SERVICE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} style={{ backgroundColor: 'var(--cb-bg-card)', color: 'var(--cb-text-primary)' }}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  {/* Dynamic Custom Service Input */}
                  {selectedService === 'Custom Solution / Other (Specify)' && (
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#38BDF8', marginBottom: '5px' }}>
                        Specify Custom Service / Project Need *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AI-powered WhatsApp booking bot with inventory sync"
                        value={customServiceText}
                        onChange={handleCustomServiceChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #38BDF8',
                          backgroundColor: 'var(--cb-bg-surface)',
                          color: 'var(--cb-text-primary)',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                    Project Requirements / Discovery Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Key features, timeline requirements, integrations, or client preferences..."
                    value={newLead.requirements}
                    onChange={(e) => setNewLead({ ...newLead, requirements: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--cb-border-subtle)',
                      backgroundColor: 'var(--cb-bg-surface)',
                      color: 'var(--cb-text-primary)',
                      fontSize: '13px',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--cb-border-subtle)',
                      backgroundColor: 'transparent',
                      color: 'var(--cb-text-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    {submitting ? 'Saving Client...' : 'Save Client to Pipeline'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Generate Onboarding Link */}
            {activeTab === 'link' && (
              <form onSubmit={onLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  fontSize: '12px',
                  color: 'var(--cb-text-secondary)',
                  lineHeight: 1.5,
                }}>
                  <strong style={{ color: 'var(--cb-text-primary)' }}>Personalized Client Onboarding Link:</strong> Generating this link allows your prospective client to submit their own project specifications. When they submit, they are auto-attributed to your representative commission account.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                    Company / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Heights Hotel"
                    value={newClient.companyName}
                    onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--cb-border-subtle)',
                      backgroundColor: 'var(--cb-bg-surface)',
                      color: 'var(--cb-text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Mwangi"
                      value={newClient.contactPerson}
                      onChange={(e) => setNewClient({ ...newClient, contactPerson: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--cb-border-subtle)',
                        backgroundColor: 'var(--cb-bg-surface)',
                        color: 'var(--cb-text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="david@royalheights.com"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--cb-border-subtle)',
                        backgroundColor: 'var(--cb-bg-surface)',
                        color: 'var(--cb-text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cb-text-primary)', marginBottom: '5px' }}>
                    Preliminary Project Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any early notes or target requirements..."
                    value={newClient.requirements}
                    onChange={(e) => setNewClient({ ...newClient, requirements: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--cb-border-subtle)',
                      backgroundColor: 'var(--cb-bg-surface)',
                      color: 'var(--cb-text-primary)',
                      fontSize: '13px',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--cb-border-subtle)',
                      backgroundColor: 'transparent',
                      color: 'var(--cb-text-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    {submitting ? 'Generating Link...' : 'Generate Onboarding Link'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
