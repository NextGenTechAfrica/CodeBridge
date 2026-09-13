// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, KeyRound } from 'lucide-react';
import CodeBridgeLogo from '@/components/common/CodeBridgeLogo';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [showDemoLogins, setShowDemoLogins] = useState(false);

  // Handle OAuth redirect error & redirect parameters in useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRedirectPath(params.get('redirect'));
      const err = params.get('error');
      if (err === 'account_role_conflict') {
        setErrorMsg('This Google account is already registered under an administrative or client account. Please sign in with email and password.');
      } else if (err === 'oauth_cancelled') {
        setErrorMsg('Google authentication was cancelled.');
      } else if (err === 'oauth_exchange_failed' || err === 'oauth_server_error') {
        setErrorMsg('Google authentication encountered an error. Please try again.');
      }
    }
  }, []);

  const demoAccounts = [
    { label: 'Super Admin', email: 'superadmin@codebridge.com', role: 'SUPER_ADMIN' },
    { label: 'Admin / Ops', email: 'ops@codebridge.com', role: 'ADMIN' },
    { label: 'Country Manager', email: 'countrymanager.ke@codebridge.com', role: 'COUNTRY_MANAGER' },
    { label: 'Client', email: 'client@abcrestaurants.com', role: 'CLIENT' },
    { label: 'Developer', email: 'dev@codebridge.com', role: 'DEVELOPER' },
  ];

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('CodeBridge@2025!');
    setErrorMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        const target = redirectPath || data.redirectTo || '/dashboard';
        router.push(target);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Failed to authenticate.');
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
      padding: '30px 20px',
    }}>
      {/* Split-Screen Branded Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '920px',
        backgroundColor: 'var(--cb-bg-card)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.1)',
        border: '1px solid var(--cb-border-subtle)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
      }}>
        {/* =============================================================== */}
        {/* LEFT COLUMN: Clean Sign-In Form                                 */}
        {/* =============================================================== */}
        <div style={{ padding: '44px 38px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Logo & Return Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
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
            Welcome Back
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--cb-text-secondary)', marginBottom: '24px' }}>
            Sign in to your CodeBridge account
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
              lineHeight: 1.4,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Continue with Google Button */}
          <a
            href="/api/auth/google"
            className="cb-btn cb-btn-outline-pill"
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: 'var(--cb-bg-card)',
              color: 'var(--cb-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              border: '1px solid var(--cb-border-subtle)',
              marginBottom: '20px',
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </a>

          {/* "or" Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '0 0 20px 0',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--cb-border-subtle)' }} />
            <span style={{ padding: '0 12px', fontSize: '13px', color: 'var(--cb-text-muted)' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--cb-border-subtle)' }} />
          </div>

          {/* Email / Password Form (Clients, Admins, Operations, Devs) */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cb-text-muted)' }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--cb-border-subtle)',
                    backgroundColor: 'var(--cb-bg-input)',
                    color: 'var(--cb-text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00B4D8'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--cb-border-subtle)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--cb-text-primary)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cb-text-muted)' }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 38px 11px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--cb-border-subtle)',
                    backgroundColor: 'var(--cb-bg-input)',
                    color: 'var(--cb-text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00B4D8'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--cb-border-subtle)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--cb-text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--cb-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ borderRadius: '4px', accentColor: '#00B4D8' }}
                />
                Remember me
              </label>

              <Link href="/contact" style={{ color: '#00B4D8', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="cb-btn cb-btn-cyan"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                marginTop: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--cb-text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#00B4D8', fontWeight: 600 }}>
              Register here
            </Link>
          </div>

          {/* Quick-fill testing toggle */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowDemoLogins(!showDemoLogins)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cb-text-muted)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <KeyRound size={12} />
              {showDemoLogins ? 'Hide Demo Logins' : 'Quick Demo Logins'}
            </button>
            {showDemoLogins && (
              <div style={{
                marginTop: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                justifyContent: 'center',
              }}>
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickFill(acc.email)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--cb-border-subtle)',
                      backgroundColor: 'var(--cb-bg-subtle)',
                      color: 'var(--cb-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =============================================================== */}
        {/* RIGHT COLUMN: Dark Navy Branded Wave Panel                      */}
        {/* =============================================================== */}
        <div style={{
          backgroundColor: '#070F26',
          backgroundImage: 'radial-gradient(ellipse at 80% 90%, rgba(0, 180, 216, 0.4), transparent 60%), radial-gradient(ellipse at 20% 20%, rgba(30, 64, 175, 0.45), transparent 70%)',
          position: 'relative',
          padding: '48px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: '#FFFFFF',
          overflow: 'hidden',
        }}>
          {/* Decorative Glowing Wave SVGs */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.25,
            pointerEvents: 'none',
          }}>
            <svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="none">
              <path d="M 0 350 Q 150 200, 400 450 L 400 600 L 0 600 Z" fill="url(#wave-cyan)" />
              <path d="M 0 250 Q 200 450, 400 150 L 400 600 L 0 600 Z" fill="url(#wave-blue)" opacity="0.6" />
              <defs>
                <linearGradient id="wave-cyan" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00B4D8" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="wave-blue" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1E40AF" />
                  <stop offset="100%" stopColor="#0369A1" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '320px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px', display: 'inline-block' }}>
              <CodeBridgeLogo size="lg" variant="light-text" showTagline={true} />
            </div>

            <p style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#CBD5E1',
              fontWeight: 400,
            }}>
              Ideas to Impact &mdash; High-performance digital products and custom business software engineered for companies globally.
            </p>

            <div style={{
              marginTop: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '12px',
              color: '#94A3B8',
            }}>
              <span>Serving businesses globally</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
