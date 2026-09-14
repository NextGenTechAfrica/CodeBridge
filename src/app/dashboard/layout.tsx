// src/app/dashboard/layout.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/common/ThemeToggle';
import CodeBridgeLogo from '@/components/common/CodeBridgeLogo';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  LogOut,
  ShieldCheck,
  Globe2,
  AlertTriangle,
  Code,
  FolderGit2,
  CheckSquare,
  ChevronDown,
  User,
  Menu,
  X,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        if (data?.authenticated) {
          setUser(data.user);
          // Fetch unread count after auth
          fetch('/api/messages/unread-count')
            .then(res => res.json())
            .then(d => {
              if (d.unreadCount) setUnreadCount(d.unreadCount);
            })
            .catch(console.error);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Close dropdown and mobile drawer on navigation
  useEffect(() => {
    setIsDropdownOpen(false);
    setMobileSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--cb-bg-page)',
        color: 'var(--cb-text-secondary)',
        fontSize: '14px'
      }}>
        Verifying CodeBridge Authorization...
      </div>
    );
  }

  const role = user?.role;

  // Generate role-specific navigation menu
  const getNavLinks = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { href: '/dashboard/super-admin', label: 'Platform Executive', icon: ShieldCheck },
          { href: '/dashboard/admin', label: 'Operations & Approvals', icon: LayoutDashboard },
          { href: '/dashboard/representative', label: 'Rep View Simulator', icon: Users },
          { href: '/dashboard/country-manager', label: 'Regional View', icon: Globe2 },
          { href: '/dashboard/client', label: 'Client View Simulator', icon: Briefcase },
          { href: '/dashboard/developer', label: 'Developer View', icon: Code },
        ];
      case 'ADMIN':
        return [
          { href: '/dashboard/admin', label: 'Operations Console', icon: LayoutDashboard },
          { href: '/dashboard/country-manager', label: 'Regional Metrics', icon: Globe2 },
          { href: '/dashboard/developer', label: 'Engineering Queue', icon: Code },
        ];
      case 'COUNTRY_MANAGER':
        return [
          { href: '/dashboard/country-manager', label: 'Country Oversight', icon: Globe2 },
          { href: '/dashboard/representative', label: 'Reps Pipeline', icon: Users },
        ];
      case 'REPRESENTATIVE':
        return [
          { href: '/dashboard/representative', label: 'My Leads & Pipeline', icon: LayoutDashboard },
          { href: '/dashboard/representative/clients', label: 'My Clients & Projects', icon: Briefcase, badge: unreadCount },
        ];
      case 'DEVELOPER':
        return [
          { href: '/dashboard/developer', label: 'Assigned Engineering', icon: Code },
          { href: '/dashboard/client', label: 'Project Specs', icon: FolderGit2 },
        ];
      case 'CLIENT':
        return [
          { href: '/dashboard/client', label: 'My Projects & Milestones', icon: Briefcase, badge: unreadCount },
          { href: '/request-project', label: 'Request New Project', icon: CheckSquare },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const getRoleBadgeClass = () => {
    if (role === 'SUPER_ADMIN') return 'cb-badge-rose';
    if (role === 'ADMIN') return 'cb-badge-blue';
    if (role === 'COUNTRY_MANAGER') return 'cb-badge-emerald';
    if (role === 'REPRESENTATIVE') return 'cb-badge-amber';
    if (role === 'DEVELOPER') return 'cb-badge-blue';
    return 'cb-badge-neutral';
  };

  const initials = `${(user?.firstName || '').charAt(0)}${(user?.lastName || '').charAt(0)}`.toUpperCase() || 'CB';

  const isSettingsActive = pathname === '/dashboard/settings';

  // For Sales Representative CRM, render the complete edge-to-edge overhaul layout directly
  if (pathname.startsWith('/dashboard/representative')) {
    return <>{children}</>;
  }

  return (
    <div className="cb-dashboard-layout">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="cb-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
        />
      )}

      {/* Sidebar — Clean: Logo + Nav + Settings */}
      <aside className={`cb-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="cb-sidebar-header" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <CodeBridgeLogo size="md" variant="light-text" href="/" showTagline={true} />
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="cb-mobile-sidebar-close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cb-text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="cb-sidebar-nav">
          {navLinks.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard/representative' && item.href !== '/dashboard/admin' && item.href !== '/dashboard/client' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={idx}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`cb-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {(item as any).badge > 0 && (
                  <span style={{
                    backgroundColor: 'var(--cb-blue-600)',
                    color: '#FFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div style={{
            height: '1px',
            backgroundColor: 'var(--cb-border-subtle)',
            margin: '8px 12px',
          }} />

          {/* Settings & Profile Nav Link */}
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileSidebarOpen(false)}
            className={`cb-nav-link ${isSettingsActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span style={{ flex: 1 }}>Settings & Profile</span>
          </Link>
        </nav>
      </aside>

      {/* Main Dashboard Area */}
      <div className="cb-dashboard-main">
        {/* Topbar */}
        <header className="cb-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="cb-mobile-sidebar-toggle"
              aria-label="Toggle navigation menu"
              style={{
                background: 'none',
                border: '1px solid var(--cb-border-subtle)',
                color: 'var(--cb-text-primary)',
                padding: '7px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={18} />
            </button>
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--cb-text-secondary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {role?.replace(/_/g, ' ')} CONSOLE
            </span>
            {user?.country?.name && (
              <span style={{
                fontSize: '11px',
                color: 'var(--cb-text-muted)',
                backgroundColor: 'var(--cb-bg-subtle)',
                border: '1px solid var(--cb-border-subtle)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600,
              }}>
                {user.country.name} ({user.country.currency || ''})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ThemeToggle />

            {/* User Avatar Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px 4px 4px',
                  borderRadius: '10px',
                  backgroundColor: isDropdownOpen ? 'var(--cb-bg-subtle)' : 'transparent',
                  border: '1px solid',
                  borderColor: isDropdownOpen ? 'var(--cb-border-subtle)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isDropdownOpen) {
                    e.currentTarget.style.backgroundColor = 'var(--cb-bg-subtle)';
                    e.currentTarget.style.borderColor = 'var(--cb-border-subtle)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDropdownOpen) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {/* Avatar Circle */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284C7 0%, #00B4D8 100%)',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {initials}
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-1px',
                    right: '-1px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    border: '2px solid var(--cb-bg-card)',
                  }} />
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--cb-text-muted)',
                    transition: 'transform 0.15s ease',
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '260px',
                  backgroundColor: 'var(--cb-bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--cb-border-subtle)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)',
                  zIndex: 100,
                  overflow: 'hidden',
                  animation: 'fadeInDown 0.15s ease-out',
                }}>
                  {/* User Identity Header */}
                  <div style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--cb-border-subtle)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9px',
                        background: 'linear-gradient(135deg, #0284C7 0%, #00B4D8 100%)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--cb-text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--cb-text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span className={`cb-badge ${getRoleBadgeClass()}`} style={{ fontSize: '10px', padding: '2px 7px' }}>
                        {role?.replace(/_/g, ' ')}
                      </span>
                      {user?.country?.code && (
                        <span className="cb-badge cb-badge-neutral" style={{ fontSize: '10px', padding: '2px 7px', marginLeft: '6px' }}>
                          {user.country.code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ padding: '6px' }}>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--cb-text-primary)',
                        textDecoration: 'none',
                        transition: 'background-color 0.1s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--cb-bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <User size={16} style={{ color: 'var(--cb-text-secondary)' }} />
                      Account Settings
                    </Link>

                    {role === 'REPRESENTATIVE' && (
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--cb-text-primary)',
                          textDecoration: 'none',
                          transition: 'background-color 0.1s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--cb-bg-subtle)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Globe2 size={16} style={{ color: 'var(--cb-text-secondary)' }} />
                        Referral Portal
                      </Link>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', backgroundColor: 'var(--cb-border-subtle)', margin: '0 12px' }} />

                  {/* Sign Out */}
                  <div style={{ padding: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#EF4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Representative Approval Warning Banner if Pending */}
        {role === 'REPRESENTATIVE' && user?.representative?.status === 'PENDING' && (
          <div style={{
            backgroundColor: 'rgba(217, 119, 6, 0.15)',
            borderBottom: '1px solid rgba(217, 119, 6, 0.3)',
            padding: '12px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#FBBF24',
            fontSize: '13px'
          }}>
            <AlertTriangle size={18} />
            <div>
              <strong>Account Status: Pending Administrative Approval.</strong> Your representative application is currently in queue. You can explore the portal and review materials, but lead submission and active commission accrual are locked until approved by an administrator.
            </div>
          </div>
        )}

        {/* Content View */}
        <main className="cb-dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
