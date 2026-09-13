// src/components/dashboard/representative/DeleteClientModal.tsx
'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2, Building2 } from 'lucide-react';
import { useRep } from '@/app/dashboard/representative/RepContext';

export default function DeleteClientModal() {
  const {
    deleteModalOpen,
    clientToDelete,
    closeDeleteModal,
    confirmDeleteClient,
  } = useRep();

  const [deleting, setDeleting] = useState(false);

  if (!deleteModalOpen || !clientToDelete) return null;

  const clientName =
    clientToDelete.business_name ||
    clientToDelete.company_name ||
    clientToDelete.title ||
    'Client';
  const contactPerson = clientToDelete.contact_person || '';
  const email = clientToDelete.email || '';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await confirmDeleteClient();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={closeDeleteModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--cb-bg-card, #0F172A)',
          borderRadius: '16px',
          border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.1))',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <Trash2 size={18} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'var(--cb-text-primary, #FFFFFF)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Delete Client Record
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--cb-text-secondary, #94A3B8)',
                  margin: '3px 0 0 0',
                }}
              >
                Remove this prospective client from your pipeline
              </p>
            </div>
          </div>

          <button
            onClick={closeDeleteModal}
            disabled={deleting}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--cb-text-secondary, #94A3B8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Target Client Preview Box */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.04))',
              border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.1))',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--cb-text-primary, #FFFFFF)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {clientName}
              </div>
              {(contactPerson || email) && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--cb-text-secondary, #94A3B8)',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {contactPerson} {contactPerson && email ? '•' : ''} {email}
                </div>
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              fontSize: '12px',
              color: '#F87171',
              lineHeight: 1.5,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              Are you sure you want to delete this client? This will permanently remove this record from your sales pipeline and update your dashboard metrics.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'var(--cb-bg-surface, rgba(255,255,255,0.02))',
            borderTop: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={closeDeleteModal}
            disabled={deleting}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid var(--cb-border-subtle, rgba(255,255,255,0.15))',
              backgroundColor: 'transparent',
              color: 'var(--cb-text-secondary, #94A3B8)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(220, 38, 38, 0.35)',
            }}
          >
            {deleting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 size={14} /> Delete Client
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
