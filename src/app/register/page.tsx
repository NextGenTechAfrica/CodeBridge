// src/app/register/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Briefcase, Users, Mail, Lock, Building, Phone, Globe } from 'lucide-react';
import CodeBridgeLogo from '@/components/common/CodeBridgeLogo';

export default function RegisterPage() {
  const router = useRouter();

  const [accountType, setAccountType] = useState<'CLIENT' | 'REPRESENTATIVE'>('CLIENT');
  const [referralCode, setReferralCode] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    countryCode: 'NG',
    companyName: '',
    industry: 'Technology',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Read URL search params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) setReferralCode(ref.trim());
      const type = params.get('type')?.toUpperCase();
      if (type === 'REPRESENTATIVE' || type === 'REP') {
        setAccountType('REPRESENTATIVE');
      }
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          accountType,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(data.redirectTo || '/dashboard');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Failed to complete registration.');
      }
    } catch {
      setErrorMsg('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--cb-bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'var(--cb-bg-card)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.08)',
        border: '1px solid var(--cb-border-subtle)',
        padding: '40px 36px',
      }}>
        {/* Logo & Return Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <CodeBridgeLogo size="md" variant="auto" href="/" />
          
          <Link 
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--cb-text-secondary)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--cb-bg-subtle)',
              transition: 'background-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--cb-border-subtle)';
              e.currentTarget.style.color = 'var(--cb-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--cb-bg-subtle)';
              e.currentTarget.style.color = 'var(--cb-text-secondary)';
            }}
          >
            <ArrowLeft size={14} />
            Return to Home
          </Link>
        </div>

        <h1 style={{
          fontSize: '26px',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: 'var(--cb-text-primary)',
          marginBottom: '6px',
        }}>
          Create Your Account
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--cb-text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
          Join CodeBridge to launch custom software projects or partner as an authorized regional sales representative.
        </p>

        {/* Role Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '28px',
        }}>
          {/* Client Account Tab */}
          <button
            type="button"
            onClick={() => setAccountType('CLIENT')}
            style={{
              padding: '16px 14px',
              borderRadius: '12px',
              border: accountType === 'CLIENT' ? '2px solid #00B4D8' : '1px solid var(--cb-border-subtle)',
              backgroundColor: accountType === 'CLIENT' ? 'var(--cb-bg-subtle)' : 'var(--cb-bg-card)',
              color: 'var(--cb-text-primary)',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              backgroundColor: accountType === 'CLIENT' ? '#00B4D8' : 'var(--cb-bg-subtle)',
              color: accountType === 'CLIENT' ? '#FFFFFF' : 'var(--cb-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Briefcase size={16} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--cb-text-primary)' }}>Client Account</div>
            <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', lineHeight: 1.3 }}>
              Request tech services &amp; track projects
            </span>
          </button>

          {/* Sales Representative Tab (Highlighted in Cyan) */}
          <button
            type="button"
            onClick={() => setAccountType('REPRESENTATIVE')}
            style={{
              padding: '16px 14px',
              borderRadius: '12px',
              border: accountType === 'REPRESENTATIVE' ? '2px solid #00B4D8' : '1px solid var(--cb-border-subtle)',
              backgroundColor: accountType === 'REPRESENTATIVE' ? '#00B4D8' : 'var(--cb-bg-card)',
              color: accountType === 'REPRESENTATIVE' ? '#FFFFFF' : 'var(--cb-text-primary)',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              boxShadow: accountType === 'REPRESENTATIVE' ? '0 4px 14px rgba(0, 180, 216, 0.3)' : 'none',
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              backgroundColor: accountType === 'REPRESENTATIVE' ? 'rgba(255, 255, 255, 0.2)' : 'var(--cb-bg-subtle)',
              color: accountType === 'REPRESENTATIVE' ? '#FFFFFF' : 'var(--cb-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={16} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: accountType === 'REPRESENTATIVE' ? '#FFFFFF' : 'var(--cb-text-primary)' }}>
              Sales Representative
            </div>
            <span style={{ fontSize: '11px', color: accountType === 'REPRESENTATIVE' ? 'rgba(255, 255, 255, 0.9)' : 'var(--cb-text-muted)', lineHeight: 1.3 }}>
              Introduce client projects, earn commission
            </span>
          </button>
        </div>

        {referralCode && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 180, 216, 0.08)',
            border: '1px solid rgba(0, 180, 216, 0.3)',
            color: '#00B4D8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            <Briefcase size={16} style={{ flexShrink: 0 }} />
            <span>Referral code active: <strong>{referralCode}</strong>. Your account will be attributed to an authorized regional representative.</span>
          </div>
        )}

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
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Unified Registration Form */}
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {accountType === 'REPRESENTATIVE' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <a
                  href="/api/auth/google"
                  className="cb-btn cb-btn-outline-pill"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    backgroundColor: 'var(--cb-bg-card)',
                    color: 'var(--cb-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    border: '1px solid var(--cb-border-subtle)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </a>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '18px 0 12px',
                  color: 'var(--cb-text-muted)',
                  fontSize: '12px',
                }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--cb-border-subtle)' }} />
                  <span>OR REGISTER WITH EMAIL</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--cb-border-subtle)' }} />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                First Name
              </label>
              <input
                type="text"
                required
                placeholder="Jane"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--cb-border-subtle)',
                  backgroundColor: 'var(--cb-bg-input)',
                  color: 'var(--cb-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                Last Name
              </label>
              <input
                type="text"
                required
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--cb-border-subtle)',
                  backgroundColor: 'var(--cb-bg-input)',
                  color: 'var(--cb-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {accountType === 'CLIENT' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                Business / Company Name
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cb-text-muted)' }}>
                  <Building size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Acme Logistics Ltd"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--cb-border-subtle)',
                    backgroundColor: 'var(--cb-bg-input)',
                    color: 'var(--cb-text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                {accountType === 'REPRESENTATIVE' ? 'Email Address' : 'Work Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cb-text-muted)' }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  placeholder={accountType === 'REPRESENTATIVE' ? 'jane.rep@codebridge.com' : 'jane@company.com'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--cb-border-subtle)',
                    backgroundColor: 'var(--cb-bg-input)',
                    color: 'var(--cb-text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                {accountType === 'REPRESENTATIVE' ? 'Operating Country' : 'Country'}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cb-text-muted)' }}>
                  <Globe size={16} />
                </div>
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--cb-border-subtle)',
                    backgroundColor: 'var(--cb-bg-input)',
                    color: 'var(--cb-text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value="NG">Nigeria (NGN)</option>
                  <option value="KE">Kenya (KES)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
              {accountType === 'REPRESENTATIVE' ? 'Phone / WhatsApp' : 'Phone Number'}
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cb-text-muted)' }}>
                <Phone size={16} />
              </div>
              <input
                type="tel"
                placeholder={formData.countryCode === 'KE' ? '+254 712 345 678' : '+234 801 234 5678'}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--cb-border-subtle)',
                  backgroundColor: 'var(--cb-bg-input)',
                  color: 'var(--cb-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
              Password (min. 8 characters)
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cb-text-muted)' }}>
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--cb-border-subtle)',
                  backgroundColor: 'var(--cb-bg-input)',
                  color: 'var(--cb-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cb-btn cb-btn-cyan"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '15px',
              fontWeight: 700,
              marginTop: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading 
              ? 'Creating account...' 
              : accountType === 'REPRESENTATIVE'
              ? 'Create Sales Representative Account'
              : 'Create Client Account'}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '13px', color: 'var(--cb-text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#00B4D8', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
