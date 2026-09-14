// src/components/common/PWAProvider.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, WifiOff } from 'lucide-react';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            // Check for updates periodically
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New content available; please refresh.');
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('[PWA] Service worker registration failed:', err);
          });
      });
    }

    // 2. Online / Offline Listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // 3. PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user has already dismissed the banner recently
      const dismissed = localStorage.getItem('cb_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('cb_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Offline Toast Indicator */}
      {isOffline && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <WifiOff size={15} />
          <span>You are currently offline. Viewing cached CodeBridge data.</span>
        </div>
      )}

      {/* PWA Install Promotion Banner (Mobile & Desktop App Install) */}
      {showInstallBanner && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            left: '20px',
            maxWidth: '420px',
            marginLeft: 'auto',
            zIndex: 9999,
            backgroundColor: '#0B1B3D',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid rgba(0, 180, 216, 0.4)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 180, 216, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 180, 216, 0.15)',
                border: '1px solid rgba(0, 180, 216, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00B4D8',
                flexShrink: 0,
              }}
            >
              <Download size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                Install CodeBridge App
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                Instant access &amp; offline capability
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleInstallClick}
              style={{
                backgroundColor: '#00B4D8',
                color: '#070F26',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Install
            </button>
            <button
              onClick={handleDismissBanner}
              aria-label="Dismiss installation prompt"
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
