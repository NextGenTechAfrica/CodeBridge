// src/app/start/page.tsx
'use client';

import React, { Suspense } from 'react';
import ClientIntakeFormStandalone from '@/components/public/ClientIntakeFormStandalone';

export default function StartPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#0A0F1D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>Loading...</div>}>
      <ClientIntakeFormStandalone />
    </Suspense>
  );
}
