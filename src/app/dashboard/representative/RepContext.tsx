// src/app/dashboard/representative/RepContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface RepContextType {
  currentUser: any;
  loading: boolean;
  currency: string;
  referralCode: string;
  referralLink: string;
  isApproved: boolean;
  copiedReferral: boolean;
  copyReferralLink: () => void;
  // Feedback
  feedback: string;
  setFeedback: (msg: string) => void;
  // Modals
  leadModalOpen: boolean;
  setLeadModalOpen: (open: boolean) => void;
  clientModalOpen: boolean;
  setClientModalOpen: (open: boolean) => void;
  // Lead Creation
  newLead: {
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    businessType: string;
    requirements: string;
    estimatedBudget: string;
    currency: string;
    notes: string;
  };
  setNewLead: React.Dispatch<React.SetStateAction<any>>;
  handleCreateLead: (e: React.FormEvent) => Promise<boolean>;
  // Offline Client Registration
  newClient: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    requirements: string;
    notes: string;
  };
  setNewClient: React.Dispatch<React.SetStateAction<any>>;
  newClientOnboardingUrl: string;
  setNewClientOnboardingUrl: (url: string) => void;
  copiedClientLink: boolean;
  copyClientOnboardingLink: () => void;
  handleRegisterOfflineClient: (e: React.FormEvent) => Promise<boolean>;
  // Chat
  chatOpen: boolean;
  chatEntityId: string | null;
  chatEntityType: 'LEAD' | 'PROJECT';
  openChat: (id: string, type: 'LEAD' | 'PROJECT') => void;
  closeChat: () => void;
  // Listener for lead created
  subscribeLeadCreated: (callback: () => void) => () => void;
  handleLogout: () => Promise<void>;
}

const RepContext = createContext<RepContextType | null>(null);

export function RepProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Feedback
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [feedback, setFeedbackState] = useState('');
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedClientLink, setCopiedClientLink] = useState(false);
  const [newClientOnboardingUrl, setNewClientOnboardingUrl] = useState('');

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatEntityId, setChatEntityId] = useState<string | null>(null);
  const [chatEntityType, setChatEntityType] = useState<'LEAD' | 'PROJECT'>('LEAD');

  // Lead listeners
  const [leadListeners, setLeadListeners] = useState<Array<() => void>>([]);

  const setFeedback = useCallback((msg: string) => {
    setFeedbackState(msg);
    if (msg) {
      setTimeout(() => setFeedbackState(''), 5000);
    }
  }, []);

  const openChat = useCallback((id: string, type: 'LEAD' | 'PROJECT') => {
    setChatEntityId(id);
    setChatEntityType(type);
    setChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setChatOpen(false);
  }, []);

  const subscribeLeadCreated = useCallback((cb: () => void) => {
    setLeadListeners((prev) => [...prev, cb]);
    return () => {
      setLeadListeners((prev) => prev.filter((fn) => fn !== cb));
    };
  }, []);

  // Form states
  const [newLead, setNewLead] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessType: 'Restaurant Websites & Ordering Systems',
    requirements: '',
    estimatedBudget: '',
    currency: 'KES',
    notes: '',
  });

  const [newClient, setNewClient] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    requirements: '',
    notes: '',
  });

  // Auth fetch
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          if (data.user.country?.currency) {
            setNewLead((prev) => ({
              ...prev,
              currency: data.user.country.currency,
            }));
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load user:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const currency = currentUser?.country?.currency || 'KES';
  const referralCode = currentUser?.representative?.referralCode || (currentUser?.country?.code === 'NG' ? 'NGA-001' : 'KEN-001');
  const isApproved = currentUser?.status === 'ACTIVE' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // Referral URL
  const appBaseUrl = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      return window.location.origin;
    }
    const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
    if (envUrl && !envUrl.includes('localhost')) {
      return envUrl;
    }
    return 'https://code-bridge-rosy.vercel.app';
  }, []);

  const referralLink = `${appBaseUrl}/start?ref=${referralCode}`;

  const copyReferralLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 3000);
  }, [referralLink]);

  const copyClientOnboardingLink = useCallback(() => {
    if (!newClientOnboardingUrl) return;
    navigator.clipboard.writeText(newClientOnboardingUrl);
    setCopiedClientLink(true);
    setTimeout(() => setCopiedClientLink(false), 3000);
  }, [newClientOnboardingUrl]);

  const handleCreateLead = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    try {
      const budgetFloat = parseFloat(newLead.estimatedBudget) || 0;
      const budgetMinor = Math.round(budgetFloat * 100);

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLead,
          estimatedBudgetMinor: budgetMinor,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setLeadModalOpen(false);
        setFeedback('New client added successfully!');
        setNewLead({
          businessName: '',
          contactPerson: '',
          email: '',
          phone: '',
          businessType: 'Business Websites',
          requirements: '',
          estimatedBudget: '',
          currency: currentUser?.country?.currency || 'KES',
          notes: '',
        });
        leadListeners.forEach((fn) => fn());
        return true;
      } else {
        alert(data.error || 'Failed to create lead.');
        return false;
      }
    } catch {
      alert('Network error submitting lead.');
      return false;
    }
  };

  const handleRegisterOfflineClient = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    try {
      const res = await fetch('/api/representative/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewClientOnboardingUrl(data.onboardingUrl);
        setFeedback('Prospect registered! Personalized onboarding link generated.');
        setNewClient({
          companyName: '',
          contactPerson: '',
          email: '',
          phone: '',
          requirements: '',
          notes: '',
        });
        leadListeners.forEach((fn) => fn());
        return true;
      } else {
        alert(data.error || 'Failed to register client.');
        return false;
      }
    } catch {
      alert('Network error submitting client prospect.');
      return false;
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <RepContext.Provider
      value={{
        currentUser,
        loading,
        currency,
        referralCode,
        referralLink,
        isApproved,
        copiedReferral,
        copyReferralLink,
        feedback,
        setFeedback,
        leadModalOpen,
        setLeadModalOpen,
        clientModalOpen,
        setClientModalOpen,
        newLead,
        setNewLead,
        handleCreateLead,
        newClient,
        setNewClient,
        newClientOnboardingUrl,
        setNewClientOnboardingUrl,
        copiedClientLink,
        copyClientOnboardingLink,
        handleRegisterOfflineClient,
        chatOpen,
        chatEntityId,
        chatEntityType,
        openChat,
        closeChat,
        subscribeLeadCreated,
        handleLogout,
      }}
    >
      {children}
    </RepContext.Provider>
  );
}

export function useRep() {
  const context = useContext(RepContext);
  if (!context) {
    throw new Error('useRep must be used within a RepProvider');
  }
  return context;
}
