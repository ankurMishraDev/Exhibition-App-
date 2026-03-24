'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createDiscount,
  getAllDiscounts,
  getAllExhibitors,
  type Discount,
  type DiscountType,
  type Exhibitor,
} from '@/lib/firebase/services';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

function generateCouponCode(): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PP26-${rand}`;
}

export default function DiscountsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);

  const [code, setCode] = useState(generateCouponCode());
  const [type, setType] = useState<DiscountType>('percentage');
  const [value, setValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [targetExhibitorId, setTargetExhibitorId] = useState('');
  const sampleCode = 'TEST-PLAST-10';

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [discountData, exhibitorData] = await Promise.all([
        getAllDiscounts(),
        getAllExhibitors(),
      ]);
      setDiscounts(discountData);
      setExhibitors(exhibitorData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load discounts';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void loadData();
  }, [authLoading, loadData]);

  const selectedExhibitor = useMemo(
    () => exhibitors.find((item) => item.id === targetExhibitorId) ?? null,
    [exhibitors, targetExhibitorId],
  );

  async function handleCreate() {
    if (!user) {
      toast.error('Please login first to create a discount code.');
      return;
    }

    const numericValue = parseFloat(value);

    if (!code.trim()) {
      toast.error('Please enter discount code');
      return;
    }

    if (!numericValue || numericValue <= 0) {
      toast.error('Discount value must be greater than zero');
      return;
    }

    if (type === 'percentage' && numericValue > 100) {
      toast.error('Percentage discount cannot be greater than 100');
      return;
    }

    setSaving(true);
    try {
      await createDiscount({
        code,
        type,
        value: numericValue,
        exhibitorIds: targetExhibitorId ? [targetExhibitorId] : undefined,
        isActive: true,
        expiryDate: expiryDate || undefined,
        createdBy: user?.email || 'admin',
      });

      toast.success('Discount code created');
      setCode(generateCouponCode());
      setValue('');
      setExpiryDate('');
      setTargetExhibitorId('');
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create discount code';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Discount Codes</h1>
        <p style={{ color: '#9CA3AF', marginTop: 4, fontSize: 14 }}>
          Generate one-time discount codes for exhibitors.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))',
        gap: '1rem',
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        padding: '1.25rem',
        marginBottom: '1.25rem',
      }}>
        <FormGroup label="Code" required>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={inputStyle} placeholder="e.g. PP26-AB123" />
            <button onClick={() => setCode(generateCouponCode())} style={secondaryBtn}>Generate</button>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(code.trim().toUpperCase());
                toast.success('Discount code copied');
              }}
              style={secondaryBtn}
              type="button"
            >
              Copy
            </button>
            <button
              onClick={() => {
                setCode(sampleCode);
                setType('percentage');
                setValue('10');
                setExpiryDate('');
                setTargetExhibitorId('');
                toast.success('Sample discount code loaded');
              }}
              style={secondaryBtn}
              type="button"
            >
              Use Sample
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
            Sample for testing: <strong>{sampleCode}</strong> (10% off, one-time)
          </div>
        </FormGroup>

        <FormGroup label="Discount Type" required>
          <select title="Discount Type" value={type} onChange={(e) => setType(e.target.value as DiscountType)} style={inputStyle}>
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat (INR)</option>
          </select>
        </FormGroup>

        <FormGroup label={type === 'percentage' ? 'Discount Percentage' : 'Flat Discount Amount'} required>
          <input value={value} onChange={(e) => setValue(e.target.value)} type="number" style={inputStyle} placeholder={type === 'percentage' ? 'e.g. 10' : 'e.g. 5000'} />
        </FormGroup>

        <FormGroup label="Expiry Date (Optional)">
          <input title="Expiry Date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} type="date" style={inputStyle} />
        </FormGroup>

        <div style={{ gridColumn: '1 / -1' }}>
          <FormGroup label="Target Exhibitor (Optional)">
            <select title="Target Exhibitor" value={targetExhibitorId} onChange={(e) => setTargetExhibitorId(e.target.value)} style={inputStyle}>
              <option value="">Any exhibitor</option>
              {exhibitors.map((exhibitor) => (
                <option key={exhibitor.id} value={exhibitor.id}>
                  {exhibitor.companyName} ({exhibitor.contactPerson})
                </option>
              ))}
            </select>
          </FormGroup>
          {selectedExhibitor && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: -8 }}>
              This code will be valid only for: <strong>{selectedExhibitor.companyName}</strong>
            </div>
          )}
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleCreate} disabled={saving} style={primaryBtn}>
            {saving ? 'Creating...' : 'Create Discount'}
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB', fontWeight: 700, color: '#1A1A2E' }}>
          Discount Records
        </div>

        {loading ? (
          <div style={{ padding: '2rem', color: '#9CA3AF', textAlign: 'center' }}>Loading discounts...</div>
        ) : discounts.length === 0 ? (
          <div style={{ padding: '2rem', color: '#9CA3AF', textAlign: 'center' }}>No discount codes yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Code', 'Discount', 'Status', 'Used By', 'Used Stall', 'Used On', 'Created By'].map((head) => (
                  <th key={head} style={thStyle}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => {
                const status = discount.used ? `Used (${discount.decision || 'accepted'})` : discount.isActive ? 'Active' : 'Inactive';
                const discountLabel = discount.type === 'percentage' ? `${discount.value}%` : `INR ${discount.value}`;
                return (
                  <tr key={discount.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}><strong>{discount.code}</strong></td>
                    <td style={tdStyle}>{discountLabel}</td>
                    <td style={tdStyle}>{status}</td>
                    <td style={tdStyle}>{discount.usedByExhibitorId || '-'}</td>
                    <td style={tdStyle}>{discount.usedByStallId || '-'}</td>
                    <td style={tdStyle}>{discount.usedAt ? formatDate(discount.usedAt) : '-'}</td>
                    <td style={tdStyle}>{discount.createdBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FormGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  border: '1.5px solid #E5E7EB',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 14,
  outline: 'none',
};

const primaryBtn: React.CSSProperties = {
  border: 'none',
  background: '#0D4F4F',
  color: '#fff',
  borderRadius: 10,
  padding: '10px 18px',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  border: '1.5px solid #E5E7EB',
  background: '#fff',
  color: '#374151',
  borderRadius: 10,
  padding: '0 12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
  color: '#1F2937',
};
