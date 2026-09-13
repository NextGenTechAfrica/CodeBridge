// src/app/start/[code]/page.tsx
'use client';

import React, { use } from 'react';
import ClientIntakeFormStandalone from '@/components/public/ClientIntakeFormStandalone';

export default function ReferralStartCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  return <ClientIntakeFormStandalone initialRefCode={code} />;
}
