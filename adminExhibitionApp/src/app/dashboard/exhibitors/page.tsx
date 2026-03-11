'use client';

import React, { useEffect, useState } from 'react';
import { getAllExhibitors, type Exhibitor } from '@/lib/firebase/services';

export default function ExhibitorsPage() {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [filtered, setFiltered] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Exhibitor | null>(null);

  useEffect(() => {
    getAllExhibitors()
      .then((data) => { setExhibitors(data); setFiltered(data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(exhibitors); return; }
    const q = search.toLowerCase();
    setFiltered(
      exhibitors.filter(
        (e) =>
          e.companyName?.toLowerCase().includes(q) ||
          e.contactPerson?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q),
      ),
    );
  }, [search, exhibitors]);

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Exhibitors</h1>
        <p style={{ color: '#9CA3AF', marginTop: 4, fontSize: 14 }}>
          {exhibitors.length} registered exhibitor{exhibitors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.25rem', maxWidth: 400 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, name, city or email…"
          style={{ width: '100%', height: 44, padding: '0 16px', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#1A1A2E', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>Loading exhibitors…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#9CA3AF' }}>
            {search ? 'No results found.' : 'No exhibitors yet.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Company', 'Contact', 'Email', 'Mobile', 'City', 'IPPF', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex) => (
                <tr
                  key={ex.id}
                  style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={ex.companyName} logoUrl={ex.logoUrl} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>{ex.companyName || '—'}</div>
                        {ex.website && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{ex.website}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#4B5563' }}>{ex.contactPerson || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#4B5563' }}>{ex.email || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#4B5563' }}>{ex.mobile || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#4B5563' }}>{ex.city || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {ex.ippfMember ? (
                      <span style={{ fontSize: 11, fontWeight: 700, background: '#DCFCE7', color: '#16A34A', padding: '2px 8px', borderRadius: 100 }}>Yes</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>No</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => setSelected(ex)}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', color: '#4B5563', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #0D4F4F 0%, #1A7F7F 100%)', borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={selected.companyName} logoUrl={selected.logoUrl} size={48} white />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>{selected.companyName}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {selected.contactPrefix} {selected.contactPerson}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', borderRadius: 8, padding: '4px 10px', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: '1.75rem' }}>
              {/* Contact info */}
              <Section title="Contact Information">
                <Grid2>
                  <Field label="Email" value={selected.email} />
                  <Field label="Mobile" value={selected.mobile} />
                  <Field label="Telephone" value={selected.telephone} />
                  <Field label="Website" value={selected.website} />
                </Grid2>
              </Section>

              {/* Address */}
              <Section title="Address">
                <Grid2>
                  <Field label="Address" value={selected.address} fullWidth />
                  <Field label="City" value={selected.city} />
                  <Field label="State" value={selected.state} />
                  <Field label="Pincode" value={selected.pincode} />
                  <Field label="Country" value={selected.country} />
                </Grid2>
              </Section>

              {/* Company */}
              <Section title="Company Details">
                <Field label="Company Profile" value={selected.companyProfile} />
                {selected.ippfMember && <Field label="IPPF Membership #" value={selected.membershipNumber} />}
              </Section>

              {/* Product details */}
              {selected.productDetails && (
                <Section title="Product Details">
                  {selected.productDetails.segments?.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>Segments</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {selected.productDetails.segments.map((s: string) => (
                          <span key={s} style={{ fontSize: 12, fontWeight: 600, background: '#E6F4F4', color: '#0D4F4F', padding: '3px 10px', borderRadius: 100 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Grid2>
                    <Field label="Categories" value={selected.productDetails.categories} />
                    <Field label="Machinery" value={selected.productDetails.machineryDescription} />
                    <Field label="Raw Materials" value={selected.productDetails.rawMaterialDescription} />
                  </Grid2>
                </Section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, logoUrl, size = 36, white }: { name?: string; logoUrl?: string; size?: number; white?: boolean }) {
  const initial = name ? name[0].toUpperCase() : '?';
  return logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={name} style={{ width: size, height: size, borderRadius: size / 2, objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: white ? 'rgba(255,255,255,0.25)' : '#0D4F4F25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.42, fontWeight: 800, color: white ? '#fff' : '#0D4F4F' }}>{initial}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
      {children}
    </div>
  );
}

function Field({ label, value, fullWidth }: { label: string; value?: string; fullWidth?: boolean }) {
  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: value ? '#1A1A2E' : '#D1D5DB', fontWeight: value ? 500 : 400 }}>{value || '—'}</div>
    </div>
  );
}
