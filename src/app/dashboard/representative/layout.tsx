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
import AddClientModal from '@/components/dashboard/representative/AddClientModal';
import ChatDrawer from '@/components/dashboard/ChatDrawer';
import CodeBridgeLogo from '@/components/common/CodeBridgeLogo';
import ThemeToggle from '@/components/common/ThemeToggle';

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
      label: 'Overview',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard/representative',
    },
    {
      href: '/dashboard/representative/leads',
      label: 'My Clients',
      icon: Users,
      isActive: pathname.startsWith('/dashboard/representative/leads'),
    },
    {
      href: '/dashboard/representative/pipeline',
      label: 'Deal Progress',
      icon: Layers,
      isActive: pathname.startsWith('/dashboard/representative/pipeline'),
    },
    {
      href: '/dashboard/representative/clients',
      label: 'Active Projects',
      icon: Briefcase,
      isActive: pathname.startsWith('/dashboard/representative/clients'),
    },
    {
      href: '/dashboard/representative/performance',
      label: 'My Earnings',
      icon: TrendingUp,
      isActive: pathname.startsWith('/dashboard/representative/performance'),
    },
  ];

  // Route Title Mapping
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard/representative/leads')) return 'My Clients';
    if (pathname.startsWith('/dashboard/representative/pipeline')) return 'Deal Progress';
    if (pathname.startsWith('/dashboard/representative/clients')) return 'Active Projects';
    if (pathname.startsWith('/dashboard/representative/performance')) return 'My Earnings';
    return 'Representative Overview';
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
      className="cb-rep-workspace"
      style={{
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: 'var(--cb-bg-page)',
        color: 'var(--cb-text-primary)',
        fontFamily: 'var(--cb-font-sans, Inter, system-ui, -apple-system, sans-serif)',
        position: 'relative',
      }}
    >
      {/* ========================================================================= */}
      {/* SIDEBAR: Focused, Crisp Responsive Sidebar                                */}
      {/* ========================================================================= */}
      <aside
        style={{
          width: sidebarCollapsed ? '72px' : '260px',
          minWidth: sidebarCollapsed ? '72px' : '260px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--cb-bg-card)',
          borderRight: '1px solid var(--cb-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 50,
          transition: 'width 0.2s ease, min-width 0.2s ease',
          boxShadow: 'var(--cb-shadow-sm, 0 0 15px rgba(0,0,0,0.02))',
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
              borderBottom: '1px solid var(--cb-border-subtle)',
            }}
          >
            {!sidebarCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <CodeBridgeLogo
                  size="md"
                  variant="auto"
                  showTagline={false}
                  href="/dashboard/representative"
                />
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--cb-cyan-600, #0284C7)',
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
                color: 'var(--cb-text-muted)',
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
                  color: 'var(--cb-text-muted)',
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
                      backgroundColor: item.isActive ? 'var(--cb-bg-subtle)' : 'transparent',
                      color: item.isActive ? 'var(--cb-text-primary)' : 'var(--cb-text-secondary)',
                      fontWeight: item.isActive ? 700 : 500,
                      fontSize: '14px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={18} color={item.isActive ? 'var(--cb-text-primary)' : 'var(--cb-text-muted)'} />
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
            borderTop: '1px solid var(--cb-border-subtle)',
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
                      color: 'var(--cb-text-primary)',
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
                      color: 'var(--cb-text-muted)',
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

            {!sidebarCollapsed && <ChevronsUpDown size={16} color="var(--cb-text-muted)" />}
          </div>

          {/* Profile Dropdown Menu */}
          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '70px',
                left: '16px',
                right: '16px',
                backgroundColor: 'var(--cb-bg-card)',
                border: '1px solid var(--cb-border-subtle)',
                borderRadius: '12px',
                boxShadow: 'var(--cb-shadow-lg, 0 10px 25px rgba(0,0,0,0.15))',
                padding: '8px',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--cb-border-subtle)',
                  fontSize: '11px',
                  color: 'var(--cb-text-secondary)',
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
                color: 'var(--cb-text-primary)',
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
                  color: 'var(--cb-cyan-500, #2563EB)',
                  backgroundColor: 'var(--cb-bg-subtle, #EFF6FF)',
                  border: '1px solid var(--cb-border-subtle)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  letterSpacing: '0.02em',
                }}
              >
                {referralCode} • 20% Commission
              </span>
            </h1>
          </div>

          {/* Top Actions: ThemeToggle, Notification Bell, Add Sales Lead, Register Client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />

            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'var(--cb-bg-card)',
                border: '1px solid var(--cb-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cb-text-secondary)',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <Bell size={16} />
            </button>

            <button
              onClick={() => {
                setNewClientOnboardingUrl('');
                setLeadModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '24px',
                padding: '10px 22px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.4)';
              }}
            >
              <Plus size={16} /> Add Client
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

      {/* Global Unified Add Client Modal */}
      <AddClientModal />

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
