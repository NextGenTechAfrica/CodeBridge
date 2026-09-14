'use client';

import { useState } from 'react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Globe,
  Code,
  CheckCircle2,
  Building2,
  Award,
  Sparkles,
  Lock,
  Layers,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqItems = [
    {
      q: 'How does CodeBridge milestone-based escrow protect our budget?',
      a: 'We divide every engineering engagement into clearly defined milestones (e.g. 50% kick-off deposit, 30% mid-project demo, 20% final user acceptance & launch). Funds are held securely and only settled once deliverables are tested, reviewed, and approved by your team.',
    },
    {
      q: 'Who owns the intellectual property and source code?',
      a: 'You retain 100% full legal ownership of the source code, system architectures, database schemas, and intellectual property. Complete repository transfer and production credentials handover are executed upon final project settlement with zero vendor lock-in.',
    },
    {
      q: 'How are regional field representatives compensated and managed?',
      a: 'Representatives receive unique partner codes (e.g. KEN-XXX or NGA-XXX). In field representative territories such as Kenya, representatives earn up to 20% commission on verified client payments, automatically tracked and disbursed via M-Pesa or local banking rails.',
    },
    {
      q: 'What technologies and frameworks does CodeBridge build with?',
      a: 'We engineer using proven, enterprise-grade technology stacks: Next.js, React, Node.js, and TypeScript for web platforms; React Native and Flutter for mobile apps; and PostgreSQL, Supabase, and Redis for high-performance data and backend services.',
    },
    {
      q: 'How does Google Play and Apple App Store publishing work?',
      a: 'CodeBridge prepares production bundles, signing certificates, app assets, and platform privacy documentation. We guide clients through registering their own developer accounts ($25 one-time for Google, $99/year for Apple) so you retain lifetime store ownership.',
    },
    {
      q: 'Can our business sign up directly to track projects and proposals?',
      a: 'Yes! Clients can register directly via /register to access their private client portal. From the dashboard, you can track development milestones, review commercial quotes, approve deliverables, and communicate securely with our engineering team.',
    },
  ];
  const corePillars = [
    {
      icon: Globe,
      title: 'Global Operational Footprint',
      desc: 'CodeBridge operates globally, seamlessly handling international project execution and cross-border collaboration.',
      highlights: [
        'Dedicated international management',
        'Strict currency boundary isolation (zero FX ambiguity)',
        'Global commercial presence with high engineering standards'
      ]
    },
    {
      icon: Code,
      title: 'Engineering Rigor, Not AI Hype',
      desc: 'While modern generative tools accelerate internal code analysis and boilerplate scaffolding, CodeBridge is not a low-code or AI gimmick startup. We build resilient, high-performance, production-ready software systems with strict human engineering oversight.',
      highlights: [
        'Enterprise relational data modeling (PostgreSQL / Supabase)',
        'Comprehensive unit, integration, and security test coverage',
        'Human code review by senior software architects'
      ]
    },
    {
      icon: Lock,
      title: '100% Milestone Escrow Protection',
      desc: 'Clients never pay 100% upfront into a black hole. Every commercial engagement is divided across verifiable milestones. Funds are allocated against measurable sprint deliverables, eliminating financial and operational risk.',
      highlights: [
        '50% deposit to commence sprint architecture',
        '30% upon mid-project demo and staging milestone',
        '20% upon final user acceptance and production launch'
      ]
    },
    {
      icon: Building2,
      title: 'Institutional Corporate Governance',
      desc: 'CodeBridge is a technology delivery platform under NextGen Tech. By combining structured governance with agile, vetted engineering squads, CodeBridge delivers the reliability of a tier-1 consultancy.',
      highlights: [
        'Legally binding service level agreements (SLAs)',
        'Full intellectual property transfer upon final settlement',
        'Dedicated legal and compliance oversight'
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } },
  };

  return (
    <>
      <Navbar />

      <main style={{ minHeight: '100vh', backgroundColor: 'var(--cb-bg-page)' }}>
        {/* ================================================================= */}
        {/* 1. HERO SECTION                                                   */}
        {/* ================================================================= */}
        <section style={{
          background: 'linear-gradient(180deg, rgba(0, 180, 216, 0.05) 0%, transparent 100%)',
          padding: '80px 0 60px',
          borderBottom: '1px solid var(--cb-border-subtle)',
        }}>
          <div className="cb-container" style={{ maxWidth: '820px', margin: '0 auto' }}>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ textAlign: 'center' }}
            >
            <motion.div variants={itemVariants} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 180, 216, 0.1)',
              border: '1px solid rgba(0, 180, 216, 0.2)',
              color: 'var(--cb-cyan-500)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}>
              <Sparkles size={14} />
              Corporate Structure &amp; Engineering Mission
            </motion.div>

            <motion.h1 variants={itemVariants} style={{
              fontSize: 'clamp(32px, 5vw, 46px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: 'var(--cb-text-primary)',
              marginBottom: '20px',
            }}>
              Engineering World-Class Digital Products &amp;{' '}
              <span className="cb-text-gradient">
                Custom Business Software
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} style={{
              fontSize: '17px',
              lineHeight: 1.65,
              color: 'var(--cb-text-secondary)',
              maxWidth: '740px',
              margin: '0 auto 24px',
            }}>
              CodeBridge is a technology delivery platform under NextGen Tech, built to help businesses and individuals access reliable digital solutions without the complexity of managing technology delivery alone.
            </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. CORPORATE GOVERNANCE CARD                                      */}
        {/* ================================================================= */}
        <section style={{ padding: '80px 0 40px' }}>
          <div className="cb-container">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="cb-glass"
              style={{
              borderRadius: '24px',
              padding: '44px 36px',
              boxShadow: 'var(--cb-shadow-md)',
              marginBottom: '64px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0, 180, 216, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cb-cyan-500)',
                }}>
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cb-cyan-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Institutional Backing
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cb-text-primary)', letterSpacing: '-0.02em' }}>
                    Corporate Governance
                  </h2>
                </div>
              </div>

              <p style={{ fontSize: '15px', color: 'var(--cb-text-secondary)', lineHeight: 1.7, marginBottom: '28px', maxWidth: '840px' }}>
                CodeBridge is a technology delivery platform under NextGen Tech, with its technology, infrastructure and platform development managed by NextGen Tech’s Technical Department. By combining structured governance with agile, vetted engineering squads, CodeBridge delivers the reliability of a tier-1 consultancy with the speed and capital efficiency of an elite product studio.
              </p>

              {/* Visual Governance Hierarchy Card */}
              <div style={{
                backgroundColor: 'var(--cb-bg-subtle)',
                borderRadius: '16px',
                border: '1px solid var(--cb-border-subtle)',
                padding: '24px 28px',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '20px',
                }}>
                  <div style={{
                    backgroundColor: 'var(--cb-bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--cb-border-subtle)',
                    padding: '20px',
                    boxShadow: 'var(--cb-shadow-sm)',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Technology Ecosystem
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cb-text-primary)', marginBottom: '4px' }}>
                      NextGen Tech
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--cb-text-secondary)' }}>
                      Project Governance, Legal Frameworks &amp; Milestone Security
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--cb-bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--cb-cyan-500)',
                    padding: '20px',
                    boxShadow: 'var(--cb-shadow-glow)',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cb-cyan-500)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Technology Platform
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cb-text-primary)', marginBottom: '4px' }}>
                      CodeBridge
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--cb-cyan-600)', fontWeight: 600 }}>
                      &ldquo;Ideas to Impact • Built for Business&rdquo;
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ============================================================= */}
            {/* 3. FOUR CORE PHILOSOPHY PILLARS                               */}
            {/* ============================================================= */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px' }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 180, 216, 0.1)',
                color: 'var(--cb-cyan-500)',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}>
                <Award size={14} />
                Our Core Principles
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cb-text-primary)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                The CodeBridge Standard
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--cb-text-secondary)' }}>
                Why modern companies trust CodeBridge for mission-critical software engineering.
              </p>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerVariants}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '28px',
                marginBottom: '64px',
              }}
            >
              {corePillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ y: -8 }}
                    className="cb-glass"
                    style={{
                      borderRadius: '20px',
                      padding: '32px 28px',
                      boxShadow: 'var(--cb-shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(0, 180, 216, 0.1)',
                      border: '1px solid rgba(0, 180, 216, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--cb-cyan-500)',
                      marginBottom: '18px',
                    }}>
                      <Icon size={24} />
                    </div>

                    <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--cb-text-primary)', marginBottom: '10px', lineHeight: 1.3 }}>
                      {pillar.title}
                    </h3>

                    <p style={{ fontSize: '14px', color: 'var(--cb-text-secondary)', lineHeight: 1.6, marginBottom: '20px', flex: 1 }}>
                      {pillar.desc}
                    </p>

                    <div style={{
                      backgroundColor: 'var(--cb-bg-subtle)',
                      borderRadius: '10px',
                      padding: '14px',
                      border: '1px solid var(--cb-border-subtle)',
                    }}>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0 }}>
                        {pillar.highlights.map((h, hIdx) => (
                          <li key={hIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--cb-text-primary)' }}>
                            <CheckCircle2 size={15} className="text-cyan-500" style={{ color: 'var(--cb-cyan-500)', flexShrink: 0, marginTop: '2px' }} />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* ============================================================= */}
            {/* 4. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION)                */}
            {/* ============================================================= */}
            <div id="faq" style={{ scrollMarginTop: '100px', marginBottom: '80px' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ textAlign: 'center', marginBottom: '40px' }}
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0, 180, 216, 0.1)',
                  color: 'var(--cb-cyan-500)',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}>
                  <HelpCircle size={14} />
                  Platform &amp; Engagement FAQs
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cb-text-primary)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                  Frequently Asked Questions
                </h2>
                <p style={{ fontSize: '15px', color: 'var(--cb-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                  Everything you need to know about our engineering process, commercial governance, and client guarantees.
                </p>
              </motion.div>

              <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {faqItems.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="cb-glass"
                      style={{
                        borderRadius: '14px',
                        border: isOpen ? '1px solid var(--cb-cyan-500)' : '1px solid var(--cb-border-subtle)',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        style={{
                          width: '100%',
                          padding: '20px 24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          color: 'var(--cb-text-primary)',
                        }}
                      >
                        <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em', paddingRight: '16px' }}>
                          {item.q}
                        </span>
                        <ChevronDown
                          size={18}
                          style={{
                            flexShrink: 0,
                            color: isOpen ? 'var(--cb-cyan-500)' : 'var(--cb-text-muted)',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease, color 0.2s ease',
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: '0 24px 22px 24px',
                            fontSize: '14px',
                            lineHeight: 1.65,
                            color: 'var(--cb-text-secondary)',
                            borderTop: '1px solid var(--cb-border-subtle)',
                            paddingTop: '14px',
                          }}
                        >
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================= */}
            {/* 5. CALL TO ACTION                                             */}
            {/* ============================================================= */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                background: 'linear-gradient(135deg, var(--cb-navy-950) 0%, var(--cb-navy-800) 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '48px 36px',
                textAlign: 'center',
                boxShadow: 'var(--cb-shadow-lg)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.15) 0%, transparent 60%)',
                pointerEvents: 'none',
              }}></div>
              
              <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
                <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
                  Partner with CodeBridge Today
                </h3>
                <p style={{ fontSize: '15px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '28px' }}>
                  Whether you are looking to build a high-performance business platform or apply to become a regional sales representative.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/request-project"
                      className="cb-btn cb-btn-cyan"
                      style={{ padding: '14px 28px', fontSize: '15px' }}
                    >
                      <span>Request Project Proposal</span>
                      <ArrowRight size={16} />
                    </Link>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/register"
                      className="cb-btn cb-btn-outline-light"
                      style={{
                        padding: '14px 28px',
                        fontSize: '15px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ color: '#FFFFFF' }}>Become a Representative</span>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
