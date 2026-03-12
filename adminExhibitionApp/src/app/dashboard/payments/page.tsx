'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  getAllBookings,
  getAllPayments,
  addPaymentRecord,
  createPaymentRecord,
  type Booking,
  type Payment,
  type PaymentRecord,
} from '@/lib/firebase/services';
import { storage } from '@/lib/firebase/config';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const PAYMENT_METHODS = ['Cash', 'NEFT', 'RTGS', 'Cheque', 'UPI', 'Bank Transfer', 'DD'];

type PaymentRow = {
  booking: Booking;
  payment: Payment | null;
};

export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [search, setSearch] = useState('');

  // Record payment modal
  const [recordTarget, setRecordTarget] = useState<PaymentRow | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('NEFT');
  const [reference, setReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View payment history modal
  const [historyTarget, setHistoryTarget] = useState<PaymentRow | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const bookings = await getAllBookings();
        const approved = bookings.filter((b) => b.status === 'approved');
        const payments = await getAllPayments();
        const paymentMap = new Map(payments.map((p) => [p.bookingId, p]));
        const compiled: PaymentRow[] = approved.map((b) => ({
          booking: b,
          payment: paymentMap.get(b.id) ?? null,
        }));
        setRows(compiled);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function getPaymentStatus(row: PaymentRow): 'unpaid' | 'partial' | 'paid' {
    if (!row.payment || row.payment.paidAmount === 0) return 'unpaid';
    if (row.payment.remainingAmount > 0) return 'partial';
    return 'paid';
  }

  const filtered = rows.filter((r) => {
    const s = getPaymentStatus(r);
    if (filter !== 'all' && s !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.booking.stallCode?.toLowerCase().includes(q) || r.booking.companyName?.toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const totalRevenue = rows.reduce((sum, r) => sum + (r.booking.totalAmount || 0), 0);
  const totalCollected = rows.reduce((sum, r) => sum + (r.payment?.paidAmount ?? 0), 0);
  const totalOutstanding = totalRevenue - totalCollected;

  function openRecordPayment(row: PaymentRow) {
    const remaining = row.payment ? row.payment.remainingAmount : row.booking.totalAmount || 0;
    setRecordTarget(row);
    setAmount(String(remaining));
    setMethod('NEFT');
    setReference('');
    setPayNotes('');
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setUploadProgress(0);
  }

  function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  async function uploadScreenshot(bookingId: string): Promise<string | undefined> {
    if (!screenshotFile) return undefined;
    const path = `payment-screenshots/${bookingId}/${Date.now()}_${screenshotFile.name}`;
    const fileRef = storageRef(storage, path);
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(fileRef, screenshotFile);
      task.on(
        'state_changed',
        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref)),
      );
    });
  }

  async function submitPayment() {
    if (!recordTarget) return;
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const { booking, payment } = recordTarget;
      const screenshotUrl = await uploadScreenshot(booking.id);
      const record: PaymentRecord = {
        amount: num,
        method,
        date: new Date().toISOString(),
        reference: reference.trim() || undefined,
        notes: payNotes.trim() || undefined,
        screenshotUrl,
        recordedBy: 'Admin',
      };

      let updatedPayment: Payment;
      if (!payment) {
        const total = booking.totalAmount || 0;
        const id = await createPaymentRecord({
          bookingId: booking.id,
          exhibitorId: booking.exhibitorId,
          stallId: booking.stallId,
          stallCode: booking.stallCode,
          companyName: booking.companyName,
          totalAmount: total,
          paidAmount: num,
          remainingAmount: Math.max(0, total - num),
          paymentRecords: [record],
        });
        updatedPayment = {
          id,
          bookingId: booking.id,
          exhibitorId: booking.exhibitorId,
          stallId: booking.stallId,
          stallCode: booking.stallCode,
          companyName: booking.companyName,
          totalAmount: total,
          paidAmount: num,
          remainingAmount: Math.max(0, total - num),
          paymentRecords: [record],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        await addPaymentRecord(booking.id, record);
        updatedPayment = {
          ...payment,
          paidAmount: payment.paidAmount + num,
          remainingAmount: Math.max(0, payment.remainingAmount - num),
          paymentRecords: [...payment.paymentRecords, record],
        };
      }

      setRows((prev) =>
        prev.map((r) =>
          r.booking.id === booking.id ? { ...r, payment: updatedPayment } : r,
        ),
      );
      toast.success('Payment recorded');
      setRecordTarget(null);
    } catch { toast.error('Failed to record payment'); }
    finally { setSaving(false); }
  }

  const counts = {
    all: rows.length,
    unpaid: rows.filter((r) => getPaymentStatus(r) === 'unpaid').length,
    partial: rows.filter((r) => getPaymentStatus(r) === 'partial').length,
    paid: rows.filter((r) => getPaymentStatus(r) === 'paid').length,
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Payments</h1>
        <p style={{ color: '#9CA3AF', marginTop: 4, fontSize: 14 }}>Record and track offline payments for approved bookings</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Expected" value={formatCurrency(totalRevenue)} sub={`${rows.length} approved bookings`} color="#0D4F4F" />
        <StatCard label="Total Collected" value={formatCurrency(totalCollected)} sub={`${counts.paid} fully paid`} color="#16A34A" />
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} sub={`${counts.unpaid + counts.partial} pending`} color="#DC2626" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 4, gap: 2 }}>
          {(['all', 'unpaid', 'partial', 'paid'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: filter === tab ? '#fff' : 'transparent', color: filter === tab ? '#1A1A2E' : '#9CA3AF', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: filter === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', whiteSpace: 'nowrap' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} <span style={{ fontSize: 11 }}>({counts[tab]})</span>
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stall or company…"
          style={{ flex: 1, maxWidth: 320, height: 38, padding: '0 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>Loading payment data…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#9CA3AF' }}>No approved bookings found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Stall', 'Company', 'Total', 'Paid', 'Remaining', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const status = getPaymentStatus(row);
                const { booking, payment } = row;
                const paid = payment?.paidAmount ?? 0;
                const remaining = payment ? payment.remainingAmount : (booking.totalAmount || 0);
                return (
                  <tr
                    key={booking.id}
                    style={{ borderBottom: '1px solid #F3F4F6', background: status === 'paid' ? '#F0FDF4' : 'transparent' }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0D4F4F' }}>{booking.stallCode}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{booking.hallName}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1A2E' }}>{booking.companyName || '—'}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{booking.exhibitorName}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>{formatCurrency(booking.totalAmount || 0)}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14, color: '#16A34A' }}>{formatCurrency(paid)}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14, color: remaining > 0 ? '#DC2626' : '#9CA3AF' }}>{formatCurrency(remaining)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <PayStatusBadge status={status} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {status !== 'paid' && (
                          <button onClick={() => openRecordPayment(row)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#0D4F4F', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            + Record
                          </button>
                        )}
                        {payment && payment.paymentRecords.length > 0 && (
                          <button onClick={() => setHistoryTarget(row)} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', color: '#4B5563', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            History ({payment.paymentRecords.length})
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Payment Modal */}
      {recordTarget && (
        <Modal title="Record Payment" onClose={() => setRecordTarget(null)}>
          <div style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, marginBottom: '1.25rem', fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>{recordTarget.booking.companyName} — {recordTarget.booking.stallCode}</div>
            <div style={{ color: '#6B7280' }}>
              Total: <strong>{formatCurrency(recordTarget.booking.totalAmount || 0)}</strong> ·
              Remaining: <strong style={{ color: '#DC2626' }}>{formatCurrency(recordTarget.payment ? recordTarget.payment.remainingAmount : (recordTarget.booking.totalAmount || 0))}</strong>
            </div>
          </div>

          <FormGroup label="Amount (₹)" required>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" style={inputStyle} placeholder="Enter amount" autoFocus />
          </FormGroup>
          <FormGroup label="Payment Method">
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Reference / Transaction ID">
            <input value={reference} onChange={(e) => setReference(e.target.value)} style={inputStyle} placeholder="Optional" />
          </FormGroup>
          <FormGroup label="Notes">
            <textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} style={{ ...inputStyle, height: 70, paddingTop: 10, resize: 'vertical' }} placeholder="Optional notes" />
          </FormGroup>
          <FormGroup label="Payment Screenshot">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleScreenshotChange}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed #E5E7EB', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'center', background: '#F9FAFB', fontSize: 13, color: '#6B7280' }}
            >
              {screenshotPreview ? (
                <img src={screenshotPreview} alt="Preview" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6, objectFit: 'contain' }} />
              ) : (
                <>📎 Click to attach screenshot (optional)</>
              )}
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#0D4F4F' }}>Uploading… {uploadProgress}%</div>
            )}
          </FormGroup>

          <ModalActions onCancel={() => setRecordTarget(null)} onConfirm={submitPayment} loading={saving} label="Record Payment" />
        </Modal>
      )}

      {/* Payment History Modal */}
      {historyTarget && historyTarget.payment && (
        <Modal title={`Payment History — ${historyTarget.booking.stallCode}`} onClose={() => setHistoryTarget(null)}>
          <div style={{ marginBottom: '1rem', fontSize: 13, color: '#6B7280' }}>
            {historyTarget.booking.companyName}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, padding: 12, background: '#F0FDF4', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, textTransform: 'uppercase' }}>Paid</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A' }}>{formatCurrency(historyTarget.payment.paidAmount)}</div>
            </div>
            <div style={{ flex: 1, padding: 12, background: '#FEF2F2', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, textTransform: 'uppercase' }}>Remaining</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#DC2626' }}>{formatCurrency(historyTarget.payment.remainingAmount)}</div>
            </div>
          </div>
          {historyTarget.payment.paymentRecords.map((r, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#1A1A2E' }}>{formatCurrency(r.amount)}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, background: '#E6F4F4', color: '#0D4F4F', padding: '2px 8px', borderRadius: 100 }}>{r.method}</span>
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(r.date)}</div>
              </div>
              {r.reference && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Ref: {r.reference}</div>}
              {r.notes && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{r.notes}</div>}
              {r.screenshotUrl && (
                <a href={r.screenshotUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 6 }}>
                  <img src={r.screenshotUrl} alt="Screenshot" style={{ maxHeight: 80, maxWidth: '100%', borderRadius: 6, objectFit: 'contain', border: '1px solid #E5E7EB' }} />
                </a>
              )}
              <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 4 }}>Recorded by {r.recordedBy}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setHistoryTarget(null)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#0D4F4F', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function PayStatusBadge({ status }: { status: 'unpaid' | 'partial' | 'paid' }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    paid: { bg: '#DCFCE7', color: '#16A34A', label: '✓ Paid' },
    partial: { bg: '#FEF9C3', color: '#CA8A04', label: '⚡ Partial' },
    unpaid: { bg: '#FEE2E2', color: '#DC2626', label: '✗ Unpaid' },
  };
  const s = styles[status];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 100 }}>{s.label}</span>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1A1A2E' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function ModalActions({ onCancel, onConfirm, loading, label }: { onCancel: () => void; onConfirm: () => void; loading: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
      <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
      <button onClick={onConfirm} disabled={loading} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: loading ? '#9CA3AF' : '#0D4F4F', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Saving...' : label}
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 12px',
  border: '1.5px solid #E5E7EB',
  borderRadius: 10,
  fontSize: 14,
  color: '#1A1A2E',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
};
