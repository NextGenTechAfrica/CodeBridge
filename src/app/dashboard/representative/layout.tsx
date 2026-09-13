// src/app/dashboard/representative/layout.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Layers,
  Briefcase,
  TrendingUp,
  PanelLeft,
  PanelLeftClose,
  ChevronsUpDown,
  LogOut,
  Bell,
  Plus,
  UserPlus,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { RepProvider, useRep } from './RepContext';
import RegisterClientModal from '@/components/dashboard/representative/RegisterClientModal';
import AddLeadModal from '@/components/dashboard/representative/AddLeadModal';
import ChatDrawer from '@/components/dashboard/ChatDrawer';
import CodeBridgeLogo from '@/components/common/CodeBridgeLogo';

function RepresentativeLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    // Reset scroll position on route change — covers both the main container
    // and the window/document scroll in case the body is the scroll container
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [pathname]);
  const {
    currentUser,
    loading,
    referralCode,
    currency,
    feedback,
    setLeadModalOpen,
    setClientModalOpen,
    setNewClientOnboardingUrl,
    chatOpen,
    chatEntityId,
    chatEntityType,
    closeChat,
    handleLogout,
  } = useRep();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // User display info
  const repName = currentUser?.firstName
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
    : currentUser?.name || currentUser?.full_name || 'Sales Representative';
  const repEmail = currentUser?.email || 'rep@codebridge.com';
  const repInitials = `${repName.charAt(0)}${repName.split(' ')[1]?.charAt(0) || 'R'}`.toUpperCase();

  // Active navigation items
  const navItems = [
    {
      href: '/dashboard/representative',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard/representative',
    },
    {
      href: '/dashboard/representative/leads',
      label: 'Leads',
      icon: Users,
      isActive: pathname.startsWith('/dashboard/representative/leads'),
    },
    {
      href: '/dashboard/representative/pipeline',
      label: 'Deals in Progress',
      icon: Layers,
      isActive: pathname.startsWith('/dashboard/representative/pipeline'),
    },
    {
      href: '/dashboard/representative/clients',
      label: 'Clients',
      icon: Briefcase,
      isActive: pathname.startsWith('/dashboard/representative/clients'),
    },
    {
      href: '/dashboard/representative/performance',
      label: 'Your Results',
      icon: TrendingUp,
      isActive: pathname.startsWith('/dashboard/representative/performance'),
    },
  ];

  // Route Title Mapping
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard/representative/leads')) return 'Leads Management';
    if (pathname.startsWith('/dashboard/representative/pipeline')) return 'Pipeline Analytics';
    if (pathname.startsWith('/dashboard/representative/clients')) return 'Referred Clients & Projects';
    if (pathname.startsWith('/dashboard/representative/performance')) return 'Commercial Performance';
    return 'Dashboard';
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          color: '#64748B',
          fontSize: '14px',
          fontWeight: 600,
          gap: '10px',
        }}
      >
        <RefreshCw className="animate-spin" size={18} />
        Loading CodeBridge Sales Representative Console...
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      {/* ========================================================================= */}
      {/* SIDEBAR: Focused, Crisp White Sidebar                                    */}
      {/* ========================================================================= */}
      <aside
        style={{
          width: sidebarCollapsed ? '72px' : '260px',
          minWidth: sidebarCollapsed ? '72px' : '260px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 50,
          transition: 'width 0.2s ease, min-width 0.2s ease',
          boxShadow: '0 0 15px rgba(0,0,0,0.02)',
        }}
      >
        <div>
          {/* Brand Header */}
          <div
            style={{
              padding: '20px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'space-between',
              borderBottom: '1px solid #F1F5F9',
            }}
          >
            {!sidebarCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <CodeBridgeLogo
                  size="md"
                  variant="dark-text"
                  showTagline={false}
                  href="/dashboard/representative"
                />
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#2563EB',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    paddingLeft: '2px',
                  }}
                >
                  Sales Representative
                </div>
              </div>
            ) : (
              <CodeBridgeLogo
                size="sm"
                variant="icon-only"
                href="/dashboard/representative"
              />
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          {/* Navigation Items (Real Next.js Links) */}
          <nav style={{ padding: '16px 12px' }}>
            {!sidebarCollapsed && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94A3B8',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '0 12px 8px 12px',
                }}
              >
                CRM Navigation
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      backgroundColor: item.isActive ? '#F1F5F9' : 'transparent',
                      color: item.isActive ? '#0F172A' : '#64748B',
                      fontWeight: item.isActive ? 700 : 500,
                      fontSize: '14px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={18} color={item.isActive ? '#0F172A' : '#94A3B8'} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid #F1F5F9',
            position: 'relative',
          }}
        >
          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              transition: 'background-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                {repInitials}
              </div>
              {!sidebarCollapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#0F172A',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {repName}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94A3B8',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {repEmail}
                  </div>
                </div>
              )}
            </div>

            {!sidebarCollapsed && <ChevronsUpDown size={16} color="#94A3B8" />}
          </div>

          {/* Profile Dropdown Menu */}
          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '70px',
                left: '16px',
                right: '16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                padding: '8px',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid #F1F5F9',
                  fontSize: '11px',
                  color: '#64748B',
                }}
              >
                <div>
                  Territory:{' '}
                  <strong>
                    {currentUser?.country?.name || (currency === 'KES' ? 'Kenya (KES)' : 'Nigeria (NGN)')}
                  </strong>
                </div>
                <div>
                  Code: <strong>{referralCode}</strong>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#EF4444',
                  background: 'none',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginTop: '4px',
                }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT WITH PERSISTENT HEADER                                      */}
      {/* ========================================================================= */}
      <main
        ref={mainRef}
        style={{
          flex: 1,
          padding: '32px 40px',
          overflowY: 'auto',
          maxWidth: '1500px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#64748B',
                  letterSpacing: '0.02em',
                }}
              >
                CodeBridge
              </span>
              <span style={{ color: '#CBD5E1', fontSize: '12px' }}>/</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2563EB',
                }}
              >
                Representative Console
              </span>
            </div>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              {getPageTitle()}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#2563EB',
                  backgroundColor: '#EFF6FF',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  letterSpacing: '0.02em',
                }}
              >
                {referralCode} • 20% Commission
              </span>
            </h1>
          </div>

          {/* Top Actions: Notification Bell, Add Sales Lead, Register Client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <Bell size={16} />
            </button>

            <button
              onClick={() => setLeadModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '24px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'transform 0.15s ease, background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            >
              <Plus size={15} /> Add Sales Lead
            </button>

            <button
              onClick={() => {
                setNewClientOnboardingUrl('');
                setClientModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #E2E8F0',
                borderRadius: '24px',
                padding: '9px 16px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <UserPlus size={14} color="#64748B" /> Register Client
            </button>
          </div>
        </div>

        {/* Toast Feedback Banner */}
        {feedback && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={16} />
            {feedback}
          </div>
        )}

        {/* Sub-page content */}
        {children}
      </main>

      {/* Global Modals */}
      <RegisterClientModal />
      <AddLeadModal />

      {/* Global Live Chat Drawer */}
      {chatOpen && chatEntityId && (
        <ChatDrawer
          entityId={chatEntityId}
          entityType={chatEntityType}
          isOpen={chatOpen}
          onClose={closeChat}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

export default function RepresentativeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RepProvider>
      <RepresentativeLayoutContent>{children}</RepresentativeLayoutContent>
    </RepProvider>
  );
}
