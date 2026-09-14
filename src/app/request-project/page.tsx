// src/app/request-project/page.tsx
'use client';

import { Suspense } from 'react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import IntakeForm from '@/components/public/IntakeForm';

function RequestProjectContent() {
  const searchParams = useSearchParams();
  const initialService = searchParams.get('service') || 'Business Websites';

  return (
    <>
      <Navbar />

      <main style={{ minHeight: '100vh', backgroundColor: 'var(--cb-bg-page)' }}>
        <section style={{
          background: 'linear-gradient(180deg, var(--cb-bg-subtle) 0%, var(--cb-bg-page) 100%)',
          padding: '64px 0 44px',
          borderBottom: '1px solid var(--cb-border-subtle)',
        }}>
          <div className="cb-container" style={{ maxWidth: '840px', margin: '0 auto' }}>


            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
                borderRadius: '9999px', backgroundColor: 'rgba(0, 180, 216, 0.12)', border: '1px solid rgba(0, 180, 216, 0.25)',
                color: '#00B4D8', fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em',
                textTransform: 'uppercase', marginBottom: '20px',
              }}>
                <Sparkles size={14} />
                Architectural Scoping & Fixed-Price Proposal
              </div>

              <h1 style={{
                fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 900, letterSpacing: '-0.03em',
                lineHeight: 1.15, color: 'var(--cb-text-primary)', marginBottom: '16px',
              }}>
                Request a Project{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #0284C7 0%, #00B4D8 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Architecture Proposal
                </span>
              </h1>

              <p style={{ fontSize: '17px', lineHeight: 1.65, color: 'var(--cb-text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
                Provide your functional requirements below. Our engineering leads will review your specifications and formulate a structured milestone scope with institutional escrow guarantees.
              </p>
            </div>
          </div>
        </section>

        <section style={{ padding: '60px 0 90px' }}>
          <div className="cb-container" style={{ maxWidth: '1040px' }}>
            <div className="cb-request-grid">
              <div className="cb-request-form-col">
                <IntakeForm initialService={initialService} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Escrow Guarantee Card */}
                <div style={{
                  backgroundColor: '#0B1B3D',
                  borderRadius: '16px',
                  padding: '28px',
                  color: '#FFFFFF',
                  border: '1px solid var(--cb-border-subtle)',
                }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
                    borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', fontSize: '11px',
                    fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.04em',
                    marginBottom: '14px',
                  }}>
                    <ShieldCheck size={14} />
                    Commercial Milestone Escrow
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                    Client Capital Protection
                  </h3>

                  <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '20px' }}>
                    CodeBridge operates strictly under institutional milestone-based disbursement:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
                        <span style={{ color: '#38BDF8' }}>50% Initial Deposit</span>
                        <span style={{ color: '#E2E8F0' }}>Held in Escrow</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Released only upon 100% completion of Stage 1 Architecture & Design approval.</div>
                    </div>

                    <div style={{
                      padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
                        <span style={{ color: '#38BDF8' }}>30% Milestone 2</span>
                        <span style={{ color: '#E2E8F0' }}>Development</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Released upon delivery of fully functional staging environment.</div>
                    </div>

                    <div style={{
                      padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
                        <span style={{ color: '#38BDF8' }}>20% Final Release</span>
                        <span style={{ color: '#E2E8F0' }}>Production</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Released only after successful production deployment and client sign-off.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <style jsx>{`
        .cb-request-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          align-items: flex-start;
        }
        @media (min-width: 960px) {
          .cb-request-grid {
            grid-template-columns: 1.8fr 1fr;
            gap: 36px;
          }
        }
      `}</style>
    </>
  );
}

export default function RequestProjectPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <RequestProjectContent />
    </Suspense>
  );
}
