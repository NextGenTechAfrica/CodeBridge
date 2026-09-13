// src/app/dashboard/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Globe,
  Share2,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Loader2,
  Save,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  BadgeCheck,
  ArrowLeft,
  Percent,
  Link as LinkIcon,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Referral copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Deletion states
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
          setFirstName(data.user.firstName || '');
          setLastName(data.user.lastName || '');
          setPhone(data.user.phone || '');
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--cb-text-secondary)',
        fontSize: '14px',
      }}>
        Loading account settings...
      </div>
    );
  }

  if (!user) return null;

  const role = user.role;
  const isRep = role === 'REPRESENTATIVE';
  const referralCode = user?.representative?.referralCode || '';
  const referralUrl = typeof window !== 'undefined' && referralCode
    ? `${window.location.origin}/start?ref=${referralCode}`
    : `https://code-bridge-rosy.vercel.app/start?ref=${referralCode || 'KEN-001'}`;
  const initials = `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase() || 'CB';
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const getRoleBadgeStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: '6px',
      letterSpacing: '0.03em',
      textTransform: 'uppercase' as const,
    };
    switch (role) {
      case 'SUPER_ADMIN': return { ...base, backgroundColor: 'rgba(244, 63, 94, 0.12)', color: '#F43F5E', border: '1px solid rgba(244, 63, 94, 0.25)' };
      case 'ADMIN': return { ...base, backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.25)' };
      case 'COUNTRY_MANAGER': return { ...base, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)' };
      case 'REPRESENTATIVE': return { ...base, backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.25)' };
      case 'DEVELOPER': return { ...base, backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#6366F1', border: '1px solid rgba(99, 102, 241, 0.25)' };
      default: return { ...base, backgroundColor: 'rgba(148, 163, 184, 0.12)', color: '#94A3B8', border: '1px solid rgba(148, 163, 184, 0.25)' };
    }
  };

  // Handlers
  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setUser({ ...user, firstName, lastName, phone });
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(data.error || 'Failed to update profile.');
      }
    } catch {
      setSaveError('Network error while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isRep && deleteConfirmationInput.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/representative/delete-account', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        router.push('/login?message=account_deleted');
        router.refresh();
      } else {
        setDeleteError(data.error || 'Failed to delete account.');
        setDeleting(false);
      }
    } catch {
      setDeleteError('An unexpected network error occurred.');
      setDeleting(false);
    }
  };

  // Shared card styles
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--cb-bg-card)',
    borderRadius: '16px',
    border: '1px solid var(--cb-border-subtle)',
    overflow: 'hidden',
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--cb-border-subtle)',
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: '24px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--cb-text-primary)',
    marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--cb-border-subtle)',
    backgroundColor: 'var(--cb-bg-input)',
    color: 'var(--cb-text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  const disabledInputStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: 'var(--cb-bg-subtle)',
    color: 'var(--cb-text-muted)',
    cursor: 'not-allowed',
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '8px 0 60px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--cb-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            marginBottom: '16px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cb-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--cb-text-secondary)'}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 800,
          color: 'var(--cb-text-primary)',
          letterSpacing: '-0.03em',
          marginBottom: '6px',
        }}>
          Account & Profile Settings
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--cb-text-secondary)', lineHeight: 1.5 }}>
          Manage your identity, regional credentials, and platform preferences.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CARD 1: Personal Information                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <div style={cardHeaderStyle}>
          {/* Profile Header with Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284C7 0%, #00B4D8 100%)',
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 180, 216, 0.3)',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--cb-text-primary)',
                  letterSpacing: '-0.02em',
                }}>
                  {user.firstName} {user.lastName}
                </h2>
                <span style={getRoleBadgeStyle()}>
                  {role?.replace(/_/g, ' ')}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '4px',
                fontSize: '12px',
                color: 'var(--cb-text-secondary)',
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={13} />
                  {user.email}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} />
                  Joined {joinDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={cardBodyStyle}>
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Success / Error Alerts */}
            {saveSuccess && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10B981',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Check size={16} />
                Profile updated successfully!
              </div>
            )}
            {saveError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#EF4444',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertTriangle size={16} />
                {saveError}
              </div>
            )}

            {/* Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label style={labelStyle}>
                Email Address
                <span style={{
                  marginLeft: '8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  verticalAlign: 'middle',
                }}>
                  <BadgeCheck size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                  Verified
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cb-text-muted)' }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  style={{ ...disabledInputStyle, paddingLeft: '36px' }}
                />
              </div>
            </div>

            {/* Phone + Region Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cb-text-muted)' }}>
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    style={{ ...inputStyle, paddingLeft: '36px' }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Operating Region</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cb-text-muted)' }}>
                    <Globe size={16} />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={user.country?.name ? `${user.country.name} (${user.country.currency || ''})` : 'Global Market'}
                    style={{ ...disabledInputStyle, paddingLeft: '36px' }}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                type="submit"
                disabled={saving}
                className="cb-btn cb-btn-cyan"
                style={{
                  padding: '10px 22px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CARD 2: Representative Identity & Commercial Credentials           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isRep && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={18} style={{ color: '#00B4D8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
                Representative Identity & Credentials
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              Share your personalized referral credentials with prospective clients. Projects requested via your link are attributed to your commission ledger.
            </p>
          </div>

          <div style={cardBodyStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Referral Code */}
              <div>
                <label style={labelStyle}>
                  <LinkIcon size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Unique Referral Code
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={referralCode || 'Pending Assignment'}
                    style={{
                      ...disabledInputStyle,
                      flex: 1,
                      fontSize: '15px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      color: 'var(--cb-text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    disabled={!referralCode}
                    className="cb-btn cb-btn-secondary"
                    style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    {copiedCode ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Direct Client Intake URL */}
              <div>
                <label style={labelStyle}>
                  <Globe size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Direct Client Intake URL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    style={{ ...disabledInputStyle, flex: 1, fontSize: '13px', color: 'var(--cb-text-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={!referralCode}
                    className="cb-btn cb-btn-cyan"
                    style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Commission & Status Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--cb-bg-subtle)',
                  border: '1px solid var(--cb-border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Percent size={14} style={{ color: 'var(--cb-text-muted)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      Commission Rate
                    </span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#00B4D8' }}>
                    {((user.representative?.commissionRateBps || 2000) / 100).toFixed(1)}%
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '4px', display: 'block' }}>
                    On confirmed milestone payments
                  </span>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--cb-bg-subtle)',
                  border: '1px solid var(--cb-border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--cb-text-muted)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      Approval Status
                    </span>
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: user.representative?.status === 'ACTIVE' ? '#10B981' : '#F59E0B',
                    marginTop: '2px',
                  }}>
                    {user.representative?.status || 'PENDING'}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--cb-text-secondary)', marginTop: '4px', display: 'block' }}>
                    {user.representative?.status === 'ACTIVE' ? 'Fully authorized representative' : 'Awaiting administrative verification'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CARD 3: Security & Session Info                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <div style={cardHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} style={{ color: 'var(--cb-text-secondary)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cb-text-primary)' }}>
              Security & Session
            </h3>
          </div>
        </div>
        <div style={cardBodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'var(--cb-bg-subtle)',
              border: '1px solid var(--cb-border-subtle)',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Session Status
              </span>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#10B981',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                Active
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'var(--cb-bg-subtle)',
              border: '1px solid var(--cb-border-subtle)',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Role Privileges
              </span>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--cb-text-primary)',
                marginTop: '6px',
              }}>
                {role?.replace(/_/g, ' ')}
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: 'var(--cb-bg-subtle)',
              border: '1px solid var(--cb-border-subtle)',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--cb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Auth Provider
              </span>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--cb-text-primary)',
                marginTop: '6px',
              }}>
                {user.googleId ? 'Google OAuth' : 'Email / Password'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CARD 4: Danger Zone                                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isRep && (
        <div style={{
          ...cardStyle,
          borderColor: 'rgba(239, 68, 68, 0.25)',
        }}>
          <div style={{
            ...cardHeaderStyle,
            borderBottomColor: 'rgba(239, 68, 68, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: '#EF4444' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#EF4444' }}>
                Danger Zone
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              Deleting your Sales Representative account will permanently remove your representative profile, deactivate your referral code,
              cancel your access to client pipelines, and unlink all assigned leads. Commissions will be closed. This action is irreversible.
            </p>
          </div>

          <div style={cardBodyStyle}>
            {deleteError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#EF4444',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}>
                <AlertTriangle size={16} />
                {deleteError}
              </div>
            )}

            {!confirmingDelete ? (
              <div>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EF4444';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#EF4444';
                  }}
                >
                  <Trash2 size={16} />
                  Delete Sales Representative Account
                </button>
              </div>
            ) : (
              <div style={{
                padding: '18px',
                borderRadius: '12px',
                backgroundColor: 'var(--cb-bg-subtle)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444' }}>
                  Confirm Permanent Deletion
                </div>
                <p style={{ fontSize: '12px', color: 'var(--cb-text-secondary)', lineHeight: 1.5 }}>
                  To permanently delete the <strong>{user.email}</strong> account, type <strong>DELETE</strong> below:
                </p>

                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  style={inputStyle}
                />

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeleteConfirmationInput('');
                      setDeleteError('');
                    }}
                    disabled={deleting}
                    className="cb-btn cb-btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmationInput.trim().toUpperCase() !== 'DELETE'}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: deleting || deleteConfirmationInput.trim().toUpperCase() !== 'DELETE' ? 'not-allowed' : 'pointer',
                      opacity: deleting || deleteConfirmationInput.trim().toUpperCase() !== 'DELETE' ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {deleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                    {deleting ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
