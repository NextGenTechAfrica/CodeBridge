// src/components/public/ClientIntakeFormStandalone.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  FileText,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import CodeBridgeLogo from '@/components/common/CodeBridgeLogo';

interface ClientIntakeFormStandaloneProps {
  initialRefCode?: string;
}

const SOLUTION_OPTIONS = [
  'Business Websites & Web Portals',
  'Custom Web Applications (SaaS)',
  'Mobile Apps (iOS & Android)',
  'E-Commerce & Digital Storefronts',
  'Fintech & Payment Gateway Integration',
  'Enterprise ERP & Business Automation',
  'API Development & Microservices',
  'Cloud Infrastructure & DevOps',
  'UI/UX Design & Prototyping',
  'Database Architecture & Optimization',
  'AI Integration & Intelligent Workflows',
  'Cybersecurity & Compliance Audit',
  'Legacy System Migration & Modernization',
  'Custom Solution / Other',
];

export default function ClientIntakeFormStandalone({
  initialRefCode = '',
}: ClientIntakeFormStandaloneProps) {
  const [refCode, setRefCode] = useState(initialRefCode);
  const [repName, setRepName] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [leadId, setLeadId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    industry: 'Corporate & Commercial',
    countryCode: 'NG',
    currency: 'NGN',
    contactPerson: '',
    email: '',
    phone: '',
    serviceCategory: 'Business Websites & Web Portals',
    customServiceText: '',
    requirements: '',
    timeline: '1-3 months',
    estimatedBudget: '1500000',
  });

  // Automatically read ref parameter from URL if not passed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get('ref');
      if (urlRef) {
        setRefCode(urlRef);
      }
    }
  }, []);

  // Validate referral code & set cookie in background
  useEffect(() => {
    const codeToValidate = refCode || initialRefCode;
    if (codeToValidate) {
      fetch(`/api/referral/${encodeURIComponent(codeToValidate)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.name) {
            setRepName(data.data.name);
          }
        })
        .catch(() => {});
    }
  }, [refCode, initialRefCode]);

  const handleCountryChange = (country: 'NG' | 'KE') => {
    setFormData((prev) => ({
      ...prev,
      countryCode: country,
      currency: country === 'NG' ? 'NGN' : 'KES',
      estimatedBudget: country === 'NG' ? '1500000' : '250000',
    }));
  };

  const handleNext = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!formData.businessName.trim()) {
        setErrorMsg('Please provide your business or organization name.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.contactPerson.trim() || !formData.email.trim()) {
        setErrorMsg('Please enter your contact name and email address.');
        return;
      }
      if (!formData.email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.requirements.trim()) {
        setErrorMsg('Please describe what your project needs to do.');
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setErrorMsg('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const effectiveService =
        formData.serviceCategory === 'Custom Solution / Other' && formData.customServiceText.trim()
          ? `Custom: ${formData.customServiceText.trim()}`
          : formData.serviceCategory;

      const res = await fetch('/api/request-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName.trim(),
          contactPerson: formData.contactPerson.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          countryCode: formData.countryCode,
          businessType: formData.industry,
          serviceCategory: effectiveService,
          requirements: formData.requirements.trim(),
          estimatedBudget: formData.estimatedBudget,
          currency: formData.currency,
          timeline: formData.timeline,
          referralCode: refCode || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setLeadId(data.leadId || null);
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || 'Failed to submit request. Please verify your entries.');
      }
    } catch {
      setErrorMsg('A network error occurred while submitting your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--cb-bg-page, #0A0F1D)',
        color: 'var(--cb-text-primary, #F8FAFC)',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. DISTRACTION-FREE TOP BRAND HEADER (Only the Logo)                     */}
      {/* ========================================================================= */}
      <header
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
          backgroundColor: 'var(--cb-bg-card, #0F172A)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CodeBridgeLogo size="md" variant="auto" showTagline={true} href="/" />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FORM OR THANK YOU CONFIRMATION                                         */}
      {/* ========================================================================= */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}
      >
        <div style={{ maxWidth: '640px', width: '100%' }}>
          {submitted ? (
            /* ======================================================================= */
            /* SUCCESS / THANK YOU SCREEN: Simple, Polite, No Extras                  */
            /* ======================================================================= */
            <div
              style={{
                backgroundColor: 'var(--cb-bg-card, #0F172A)',
                borderRadius: '20px',
                border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.1))',
                padding: '48px 32px',
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto',
                  color: '#10B981',
                }}
              >
                <CheckCircle2 size={40} />
              </div>

              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--cb-text-primary, #FFFFFF)',
                  letterSpacing: '-0.02em',
                  margin: '0 0 12px 0',
                }}
              >
                Thank You!
              </h1>

              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--cb-text-secondary, #94A3B8)',
                  lineHeight: 1.6,
                  margin: '0 auto 20px auto',
                  maxWidth: '480px',
                }}
              >
                Your project specifications have been successfully submitted to CodeBridge.
              </p>

              <div
                style={{
                  backgroundColor: 'var(--cb-bg-subtle, rgba(255,255,255,0.04))',
                  borderRadius: '12px',
                  border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
                  padding: '16px 20px',
                  margin: '0 auto 28px auto',
                  maxWidth: '460px',
                  textAlign: 'left',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: 'var(--cb-text-secondary, #94A3B8)',
                }}
              >
                <div>
                  &bull; Our solutions engineering team is analyzing your functional scope.
                </div>
                {repName && (
                  <div style={{ marginTop: '6px' }}>
                    &bull; Your dedicated representative,{' '}
                    <strong style={{ color: '#38BDF8' }}>{repName}</strong>, will reach out to you directly.
                  </div>
                )}
                {leadId && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--cb-text-muted, #64748B)' }}>
                    Submission Reference: {leadId}
                  </div>
                )}
              </div>

              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--cb-text-muted, #64748B)',
                  margin: 0,
                }}
              >
                You may now safely close this window.
              </p>
            </div>
          ) : (
            /* ======================================================================= */
            /* INTAKE FORM: Clean, Human, Multi-Step                                   */
            /* ======================================================================= */
            <div
              style={{
                backgroundColor: 'var(--cb-bg-card, #0F172A)',
                borderRadius: '20px',
                border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.1))',
                padding: '32px 28px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Header Title & Subtitle */}
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#38BDF8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  <Sparkles size={12} /> Project Request
                </div>

                <h1
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--cb-text-primary, #FFFFFF)',
                    letterSpacing: '-0.02em',
                    margin: '0 0 6px 0',
                  }}
                >
                  Submit Your Project Requirements
                </h1>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--cb-text-secondary, #94A3B8)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {repName
                    ? `Working directly with ${repName} • Fixed-scope institutional delivery.`
                    : 'Provide your project requirements for an architectural milestone review.'}
                </p>
              </div>

              {/* Step Progress Indicators */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '26px',
                }}
              >
                {[
                  { step: 1, label: 'Company' },
                  { step: 2, label: 'Contact' },
                  { step: 3, label: 'Project Scope' },
                  { step: 4, label: 'Review & Send' },
                ].map((s) => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          currentStep === s.step
                            ? '#2563EB'
                            : currentStep > s.step
                            ? '#10B981'
                            : 'var(--cb-bg-subtle, rgba(255,255,255,0.06))',
                        color: currentStep >= s.step ? '#FFFFFF' : 'var(--cb-text-muted, #64748B)',
                        border:
                          currentStep === s.step
                            ? '2px solid #38BDF8'
                            : '1px solid var(--cb-border-subtle, rgba(255,255,255,0.1))',
                      }}
                    >
                      {currentStep > s.step ? <CheckCircle2 size={14} /> : s.step}
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: currentStep === s.step ? 700 : 500,
                        color: currentStep === s.step ? 'var(--cb-text-primary, #FFFFFF)' : 'var(--cb-text-muted, #64748B)',
                        display: 'none',
                      }}
                    >
                      {s.label}
                    </span>
                    {s.step < 4 && (
                      <div
                        style={{
                          width: '24px',
                          height: '2px',
                          backgroundColor:
                            currentStep > s.step
                              ? '#10B981'
                              : 'var(--cb-border-subtle, rgba(255,255,255,0.1))',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    color: '#F87171',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '20px',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Steps */}
              <form onSubmit={handleSubmit}>
                {/* STEP 1: BUSINESS */}
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 700,
                          marginBottom: '6px',
                          color: 'var(--cb-text-secondary, #CBD5E1)',
                        }}
                      >
                        Company / Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Global Logistics Ltd"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                          backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                          color: 'var(--cb-text-primary, #FFFFFF)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginBottom: '6px',
                            color: 'var(--cb-text-secondary, #CBD5E1)',
                          }}
                        >
                          Operating Country
                        </label>
                        <select
                          value={formData.countryCode}
                          onChange={(e) => handleCountryChange(e.target.value as 'NG' | 'KE')}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                            backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                            color: 'var(--cb-text-primary, #FFFFFF)',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        >
                          <option value="NG">Nigeria (NGN ₦)</option>
                          <option value="KE">Kenya (KES KSh)</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginBottom: '6px',
                            color: 'var(--cb-text-secondary, #CBD5E1)',
                          }}
                        >
                          Industry / Sector
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Retail, FinTech, Healthcare"
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                            backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                            color: 'var(--cb-text-primary, #FFFFFF)',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CONTACT */}
                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 700,
                          marginBottom: '6px',
                          color: 'var(--cb-text-secondary, #CBD5E1)',
                        }}
                      >
                        Contact Person (Full Name) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Adebayo Ogunlesi"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                          backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                          color: 'var(--cb-text-primary, #FFFFFF)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 700,
                          marginBottom: '6px',
                          color: 'var(--cb-text-secondary, #CBD5E1)',
                        }}
                      >
                        Work Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. adebayo@apexlogistics.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                          backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                          color: 'var(--cb-text-primary, #FFFFFF)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 700,
                          marginBottom: '6px',
                          color: 'var(--cb-text-secondary, #CBD5E1)',
                        }}
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +234 803 123 4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                          backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                          color: 'var(--cb-text-primary, #FFFFFF)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: PROJECT SCOPE */}
                {currentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 700,
                          marginBottom: '6px',
                          color: 'var(--cb-text-secondary, #CBD5E1)',
                        }}
                      >
                        Solution Focus
                      </label>
                      <select
                        value={formData.serviceCategory}
                        onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                          backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                          color: 'var(--cb-text-primary, #FFFFFF)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      >
                        {SOLUTION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.serviceCategory === 'Custom Solution / Other' && (
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginBottom: '6px',
                            color: 'var(--cb-text-secondary, #CBD5E1)',
                          }}
                        >
                          Specify Custom Solution *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. AI-driven logistics dispatch algorithm"
                          value={formData.customServiceText}
                          onChange={(e) => setFormData({ ...formData, customServiceText: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                            backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                            color: 'var(--cb-text-primary, #FFFFFF)',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    )}

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 700,
                          marginBottom: '6px',
                          color: 'var(--cb-text-secondary, #CBD5E1)',
                        }}
                      >
                        Project Description & Specifications *
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Tell us what you want to build, key features, user roles, integrations needed..."
                        value={formData.requirements}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                          backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                          color: 'var(--cb-text-primary, #FFFFFF)',
                          fontSize: '14px',
                          outline: 'none',
                          resize: 'vertical',
                          lineHeight: 1.5,
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginBottom: '6px',
                            color: 'var(--cb-text-secondary, #CBD5E1)',
                          }}
                        >
                          Target Timeline
                        </label>
                        <select
                          value={formData.timeline}
                          onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                            backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                            color: 'var(--cb-text-primary, #FFFFFF)',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        >
                          <option value="1-2 months">1–2 Months (Fast-track MVP)</option>
                          <option value="2-4 months">2–4 Months (Standard Build)</option>
                          <option value="4+ months">4+ Months (Enterprise Scope)</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginBottom: '6px',
                            color: 'var(--cb-text-secondary, #CBD5E1)',
                          }}
                        >
                          Estimated Budget ({formData.currency})
                        </label>
                        <input
                          type="number"
                          value={formData.estimatedBudget}
                          onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--cb-border-light, rgba(255,255,255,0.15))',
                            backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.03))',
                            color: 'var(--cb-text-primary, #FFFFFF)',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & CONFIRM */}
                {currentStep === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        backgroundColor: 'var(--cb-bg-subtle, rgba(255,255,255,0.04))',
                        borderRadius: '12px',
                        border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
                        padding: '18px',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: 'var(--cb-text-secondary, #CBD5E1)',
                      }}
                    >
                      <div style={{ fontWeight: 800, color: 'var(--cb-text-primary, #FFFFFF)', marginBottom: '8px', fontSize: '14px' }}>
                        Review Your Request
                      </div>
                      <div>
                        <strong>Company:</strong> {formData.businessName} ({formData.industry})
                      </div>
                      <div>
                        <strong>Contact:</strong> {formData.contactPerson} &bull; {formData.email}
                      </div>
                      {formData.phone && (
                        <div>
                          <strong>Phone:</strong> {formData.phone}
                        </div>
                      )}
                      <div>
                        <strong>Solution:</strong>{' '}
                        {formData.serviceCategory === 'Custom Solution / Other'
                          ? formData.customServiceText
                          : formData.serviceCategory}
                      </div>
                      <div>
                        <strong>Estimated Budget:</strong> {formData.currency}{' '}
                        {Number(formData.estimatedBudget).toLocaleString()} &bull; {formData.timeline}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '12px',
                        color: '#34D399',
                      }}
                    >
                      <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                      <span>
                        Milestone Escrow Guarantee: Payments are only disbursed upon 100% verified deliverable completion.
                      </span>
                    </div>
                  </div>
                )}

                {/* Form Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '26px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
                    gap: '12px',
                  }}
                >
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrev}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.15))',
                        backgroundColor: 'transparent',
                        color: 'var(--cb-text-secondary, #94A3B8)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '11px 22px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                      }}
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 26px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563EB 0%, #0284C7 100%)',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          Submit Project Request <CheckCircle2 size={16} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
