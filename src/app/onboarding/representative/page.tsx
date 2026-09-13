// src/app/onboarding/representative/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import CodeBridgeLogo from '@/components/common/CodeBridgeLogo';

export default function RepresentativeOnboardingPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/representative/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode: selectedCountry }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(data.redirectTo || '/dashboard/representative');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Failed to finalize representative onboarding.');
      }
    } catch {
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--cb-bg-page)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
    }}>
      {/* Top Header with Back and Logout */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
      }}>
        <Link 
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: 'var(--cb-bg-card)',
            border: '1px solid var(--cb-border-subtle)',
            color: 'var(--cb-text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </div>

      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
      }}>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: 'var(--cb-bg-card)',
            border: '1px solid var(--cb-border-subtle)',
            color: 'var(--cb-text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <CodeBridgeLogo size="md" variant="auto" href="/" />

        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '9999px',
          backgroundColor: '#E0F2FE',
          color: '#0284C7',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          Sales Representative Activation
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{
          backgroundColor: 'var(--cb-bg-card)',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.08)',
          border: '1px solid var(--cb-border-subtle)',
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cb-text-primary)', marginBottom: '8px', textAlign: 'center', letterSpacing: '-0.02em' }}>
            Which country will you operate in?
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--cb-text-secondary)', marginBottom: '28px', textAlign: 'center', lineHeight: 1.5 }}>
            Select your primary operating market. This assigns your localized currency, client lead pricing tiers, and direct commission settlement channel.
          </p>

          {errorMsg && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(225, 29, 72, 0.08)',
              border: '1px solid rgba(225, 29, 72, 0.25)',
              color: '#BE123C',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              fontSize: '13px',
            }}>
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleComplete}>
            <div style={{ textAlign: 'left' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--cb-text-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '10px',
                  }}
                >
                  Select Operating Country *
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                  }}
                >
                  {[
                    {
                      code: 'NG',
                      name: 'Nigeria',
                      flag: '🇳🇬',
                      currency: 'NGN (₦)',
                      region: 'West Africa Hub',
                      cities: 'Lagos, Abuja & Nationwide',
                      settlement: 'Direct Bank Settlement (NGN)',
                    },
                    {
                      code: 'KE',
                      name: 'Kenya',
                      flag: '🇰🇪',
                      currency: 'KES (KSh)',
                      region: 'East Africa Hub',
                      cities: 'Nairobi, Mombasa & Nationwide',
                      settlement: 'M-PESA & Bank Settlement (KES)',
                    },
                  ].map((country) => {
                    const isSelected = selectedCountry === country.code;
                    return (
                      <div
                        key={country.code}
                        onClick={() => setSelectedCountry(country.code)}
                        style={{
                          padding: '18px 16px',
                          borderRadius: '14px',
                          border: isSelected
                            ? '2px solid #00B4D8'
                            : '1px solid var(--cb-border-subtle)',
                          backgroundColor: isSelected
                            ? 'rgba(0, 180, 216, 0.08)'
                            : 'var(--cb-bg-input)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: isSelected
                            ? '0 6px 20px rgba(0, 180, 216, 0.25)'
                            : 'none',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px',
                          }}
                        >
                          <span style={{ fontSize: '32px', lineHeight: 1 }}>
                            {country.flag}
                          </span>
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              border: isSelected
                                ? '6px solid #00B4D8'
                                : '2px solid var(--cb-border-subtle)',
                              backgroundColor: '#FFFFFF',
                              transition: 'all 0.15s ease',
                            }}
                          />
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: '17px',
                              fontWeight: 800,
                              color: 'var(--cb-text-primary)',
                              letterSpacing: '-0.02em',
                              marginBottom: '4px',
                            }}
                          >
                            {country.name}
                          </div>
                          <div
                            style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: isSelected
                                ? '#00B4D8'
                                : 'var(--cb-bg-card)',
                              color: isSelected
                                ? '#FFFFFF'
                                : 'var(--cb-text-secondary)',
                              marginBottom: '8px',
                            }}
                          >
                            {country.currency}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--cb-text-muted)',
                              lineHeight: 1.3,
                            }}
                          >
                            {country.cities}
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              color: isSelected
                                ? '#0284C7'
                                : 'var(--cb-text-muted)',
                              fontWeight: 600,
                              marginTop: '6px',
                            }}
                          >
                            {country.settlement}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            <button
              type="submit"
              disabled={loading || !selectedCountry}
              className="cb-btn cb-btn-cyan"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading || !selectedCountry ? 'not-allowed' : 'pointer',
                opacity: loading || !selectedCountry ? 0.6 : 1,
                boxShadow: selectedCountry
                  ? '0 4px 14px rgba(0, 180, 216, 0.35)'
                  : 'none',
              }}
            >
              {loading
                ? 'Activating Profile...'
                : selectedCountry === 'NG'
                ? 'Activate Profile for Nigeria (NGN)'
                : selectedCountry === 'KE'
                ? 'Activate Profile for Kenya (KES)'
                : 'Select Nigeria or Kenya to Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
