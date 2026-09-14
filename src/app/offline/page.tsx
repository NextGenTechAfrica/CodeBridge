// src/app/offline/page.tsx
'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import CodeBridgeLogo from '@/components/common/CodeBridgeLogo';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#070F26',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        textAlign: 'center',
        fontFamily: 'var(--cb-font-sans, system-ui, -apple-system, sans-serif)',
      }}
    >
      <div style={{ marginBottom: '32px' }}>
        <CodeBridgeLogo size="lg" variant="light-text" href="/" />
      </div>

      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#0B1B3D',
          borderRadius: '20px',
          padding: '36px 28px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'rgba(0, 180, 216, 0.12)',
            border: '1px solid rgba(0, 180, 216, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: '#00B4D8',
          }}
        >
          <WifiOff size={30} />
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            marginBottom: '10px',
          }}
        >
          You are currently offline
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: '#94A3B8',
            lineHeight: 1.6,
            marginBottom: '28px',
          }}
        >
          CodeBridge has preserved your local session. Reconnect to the internet to submit requests, verify milestones, and sync real-time project updates.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#00B4D8',
              color: '#070F26',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <RefreshCw size={16} />
            Retry Connection
          </button>

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '12px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            <Home size={16} />
            Return to Homepage
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '24px', fontSize: '12px', color: '#64748B' }}>
        CodeBridge Progressive Web App &bull; Offline Resilient Mode
      </div>
    </div>
  );
}
