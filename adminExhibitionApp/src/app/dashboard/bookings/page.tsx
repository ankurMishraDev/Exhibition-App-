'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  subscribeToAllBookings,
  approveBooking,
  rejectBooking,
  type Booking,
  type BookingStatus,
} from '@/lib/firebase/services';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const FILTERS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'approve' | 'reject'>('view');

  useEffect(() => {
    const unsubscribe = subscribeToAllBookings((data) => {
      setBookings(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered =
    filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  function openModal(booking: Booking, mode: 'view' | 'approve' | 'reject') {
    setSelected(booking);
    setModalMode(mode);
    setRejectNotes('');
    setApproveNotes('');
    setShowModal(true);
  }

  async function handleApprove() {
    if (!selected || !user) return;
    setActionLoading(true);
    try {
      await approveBooking(selected.id, selected.stallId, user.email!, approveNotes);
      toast.success(`Booking ${selected.stallCode} approved successfully`);
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve booking');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!selected || !rejectNotes.trim()) {
      toast.error('Please enter a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await rejectBooking(selected.id, selected.stallId, rejectNotes);
      toast.success(`Booking ${selected.stallCode} rejected`);
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject booking');
    } finally {
      setActionLoading(false);
    }
  }

  const pendingCount = bookings.filter((b) => b.status === 'pending_approval').length;

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Bookings</h1>
          <p style={{ color: '#9CA3AF', marginTop: 4, fontSize: 14 }}>
            Manage and approve exhibitor stall bookings
          </p>
        </div>
        {pendingCount > 0 && (
          <div
            style={{
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: '#D97706',
            }}
          >
            ⏳ {pendingCount} pending review
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {FILTERS.map((f) => {
          const count = f.value === 'all' ? bookings.length : bookings.filter((b) => b.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                border: '1.5px solid',
                borderColor: filter === f.value ? '#0D4F4F' : '#E5E7EB',
                background: filter === f.value ? '#0D4F4F' : '#fff',
                color: filter === f.value ? '#fff' : '#4B5563',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f.label}
              {count > 0 && (
                <span
                  style={{
                    background: filter === f.value ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                    color: filter === f.value ? '#fff' : '#6B7280',
                    borderRadius: 100,
                    padding: '1px 7px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p>No bookings found</p>
        </div>
      ) : (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Stall', 'Company', 'Exhibitor', 'Hall', 'Amount', 'Date', 'Status', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking, idx) => (
                <tr
                  key={booking.id}
                  style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                    background: booking.status === 'pending_approval' ? '#FFFBEB' : '#fff',
                  }}
                >
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 800, color: '#0D4F4F', fontSize: 15 }}>
                      {booking.stallCode}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: '#1A1A2E', fontSize: 13 }}>
                      {booking.companyName}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>{booking.exhibitorName}</div>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        background: '#E6F4F4',
                        color: '#0D4F4F',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {booking.hallName}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 700, color: '#7C3AED' }}>
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {formatDate(booking.createdAt)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={booking.status} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => openModal(booking, 'view')}
                        style={actionBtn}
                      >
                        View
                      </button>
                      {booking.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => openModal(booking, 'approve')}
                            style={{ ...actionBtn, background: '#DCFCE7', color: '#16A34A' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openModal(booking, 'reject')}
                            style={{ ...actionBtn, background: '#FEE2E2', color: '#DC2626' }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail/Action Modal */}
      {showModal && selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '2rem',
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1A1A2E' }}>
                {modalMode === 'approve' ? '✅ Approve Booking' :
                 modalMode === 'reject' ? '❌ Reject Booking' :
                 '📋 Booking Details'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}
              >
                ×
              </button>
            </div>

            {/* Booking Info */}
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <InfoItem label="Stall" value={selected.stallCode} highlight />
                <InfoItem label="Hall" value={selected.hallName} />
                <InfoItem label="Company" value={selected.companyName} />
                <InfoItem label="Exhibitor" value={selected.exhibitorName} />
                <InfoItem label="Amount" value={formatCurrency(selected.totalAmount)} />
                <InfoItem label="Status" value={selected.status.replace('_', ' ')} />
                <InfoItem label="Booked On" value={formatDate(selected.createdAt)} />
                {selected.adminNotes && (
                  <InfoItem label="Admin Notes" value={selected.adminNotes} />
                )}
              </div>
            </div>

            {/* Exhibitor snapshot */}
            {selected.exhibitorSnapshot && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Contact Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['mobile', 'email', 'city', 'country'].map((key) => {
                    const val = (selected.exhibitorSnapshot as any)?.[key];
                    return val ? <InfoItem key={key} label={key} value={String(val)} /> : null;
                  })}
                </div>
              </div>
            )}

            {/* Action sections */}
            {modalMode === 'approve' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>
                  Approval Notes (optional)
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Any notes for the exhibitor..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: 10,
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            )}

            {modalMode === 'reject' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>
                  Rejection Reason <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: 10,
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  required
                />
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '1.5px solid #E5E7EB',
                  background: '#fff',
                  color: '#6B7280',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalMode === 'approve' && (
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: actionLoading ? '#9CA3AF' : '#16A34A',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoading ? 'Approving...' : '✅ Confirm Approval'}
                </button>
              )}
              {modalMode === 'reject' && (
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: actionLoading ? '#9CA3AF' : '#DC2626',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoading ? 'Rejecting...' : '❌ Confirm Rejection'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    pending_approval: { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
    approved: { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
    rejected: { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
    cancelled: { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelled' },
  };
  const s = styles[status] || styles.cancelled;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: highlight ? 800 : 500, color: highlight ? '#0D4F4F' : '#1A1A2E' }}>
        {value}
      </div>
    </div>
  );
}

const tdStyle: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' };
const actionBtn: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 6,
  border: 'none',
  background: '#F3F4F6',
  color: '#4B5563',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
