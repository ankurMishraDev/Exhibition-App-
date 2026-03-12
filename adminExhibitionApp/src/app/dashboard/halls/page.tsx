'use client';

import React, { useEffect, useState } from 'react';
import {
  getHalls,
  getStallsByHall,
  createHall,
  updateHall,
  deleteHall,
  createStall,
  updateStall,
  deleteStall,
  type Hall,
  type Stall,
  type StallStatus,
} from '@/lib/firebase/services';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const SPACE_TYPES = ['Bare Space', 'Shell Scheme', '2-Side Open', '3-Side Open'];
const FEATURES = ['Power', 'WiFi', 'Table', 'Chair', 'Carpet', 'Fascia Board', 'Storage', 'Lighting'];

function calcPricing(length: number, breadth: number) {
  const area = length * breadth;
  const basePrice = area * 7500;
  const gstAmount = Math.round(basePrice * 0.18);
  return { area, basePrice, gstAmount, totalPrice: basePrice + gstAmount };
}

export default function HallsPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStalls, setLoadingStalls] = useState(false);

  // Hall form
  const [showHallForm, setShowHallForm] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [hallName, setHallName] = useState('');
  const [hallCode, setHallCode] = useState('');
  const [hallDimensions, setHallDimensions] = useState('');
  const [hallSaving, setHallSaving] = useState(false);

  // Stall form
  const [showStallForm, setShowStallForm] = useState(false);
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [stallCode, setStallCode] = useState('');
  const [stallLength, setStallLength] = useState('3');
  const [stallBreadth, setStallBreadth] = useState('3');
  const [stallSpaceType, setStallSpaceType] = useState('Shell Scheme');
  const [stallFeatures, setStallFeatures] = useState<string[]>([]);
  const [stallRow, setStallRow] = useState('');
  const [stallCol, setStallCol] = useState('');
  const [stallSaving, setStallSaving] = useState(false);

  // Bulk stall creation
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [bulkStart, setBulkStart] = useState('1');
  const [bulkEnd, setBulkEnd] = useState('10');
  const [bulkLength, setBulkLength] = useState('3');
  const [bulkBreadth, setBulkBreadth] = useState('3');
  const [bulkSpaceType, setBulkSpaceType] = useState('Shell Scheme');
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    getHalls()
      .then((data) => {
        setHalls(data);
        if (data.length > 0) setSelectedHall(data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedHall) return;
    setLoadingStalls(true);
    getStallsByHall(selectedHall.id)
      .then(setStalls)
      .finally(() => setLoadingStalls(false));
  }, [selectedHall]);

  // ── Hall CRUD ──

  function openHallCreate() {
    setEditingHall(null);
    setHallName('');
    setHallCode('');
    setHallDimensions('');
    setShowHallForm(true);
  }

  function openHallEdit(hall: Hall) {
    setEditingHall(hall);
    setHallName(hall.hallName);
    setHallCode(hall.hallCode ?? '');
    setHallDimensions(hall.dimensions ?? '');
    setShowHallForm(true);
  }

  async function saveHall() {
    if (!hallName.trim()) { toast.error('Hall name required'); return; }
    setHallSaving(true);
    try {
      const code = hallCode.trim().toUpperCase();
      const dims = hallDimensions.trim();
      if (editingHall) {
        await updateHall(editingHall.id, { hallName: hallName.trim(), hallCode: code, dimensions: dims });
        setHalls((prev) => prev.map((h) => h.id === editingHall.id ? { ...h, hallName: hallName.trim(), hallCode: code, dimensions: dims } : h));
        toast.success('Hall updated');
      } else {
        const id = await createHall({ hallCode: code, hallName: hallName.trim(), dimensions: dims, stallCount: 0, availableCount: 0 });
        const newHall: Hall = {
          id, hallCode: code, hallName: hallName.trim(), dimensions: dims, stallCount: 0, availableCount: 0,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        setHalls((prev) => [...prev, newHall]);
        setSelectedHall(newHall);
        toast.success('Hall created');
      }
      setShowHallForm(false);
    } catch { toast.error('Failed to save hall'); }
    finally { setHallSaving(false); }
  }

  async function removeHall(hall: Hall) {
    if (!confirm(`Delete "${hall.hallName}"? This will also delete all its stalls.`)) return;
    try {
      await deleteHall(hall.id);
      setHalls((prev) => prev.filter((h) => h.id !== hall.id));
      if (selectedHall?.id === hall.id) setSelectedHall(halls.find((h) => h.id !== hall.id) ?? null);
      toast.success('Hall deleted');
    } catch { toast.error('Failed to delete hall'); }
  }

  // ── Stall CRUD ──

  function openStallCreate() {
    if (!selectedHall) { toast.error('Select a hall first'); return; }
    setEditingStall(null);
    setStallCode('');
    setStallLength('3'); setStallBreadth('3');
    setStallSpaceType('Shell Scheme'); setStallFeatures([]); setStallRow(''); setStallCol('');
    setShowStallForm(true);
  }

  function openStallEdit(stall: Stall) {
    setEditingStall(stall);
    setStallCode(stall.stallCode);
    setStallLength(String(stall.length)); setStallBreadth(String(stall.breadth));
    setStallSpaceType(stall.spaceType);
    setStallFeatures(stall.features); setStallRow(String(stall.row ?? ''));
    setStallCol(String(stall.col ?? ''));
    setShowStallForm(true);
  }

  async function saveStall() {
    if (!stallCode.trim() || !selectedHall) { toast.error('Stall code required'); return; }
    setStallSaving(true);
    try {
      const l = parseFloat(stallLength) || 3;
      const b = parseFloat(stallBreadth) || 3;
      const pricing = calcPricing(l, b);
      const data: Omit<Stall, 'id' | 'createdAt' | 'updatedAt'> = {
        stallCode: stallCode.trim().toUpperCase(),
        hallId: selectedHall.id,
        hallName: selectedHall.hallName,
        length: l, breadth: b, ...pricing,
        status: editingStall?.status ?? 'available',
        exhibitorId: editingStall?.exhibitorId ?? null,
        bookingId: editingStall?.bookingId ?? null,
        spaceType: stallSpaceType,
        features: stallFeatures,
        row: stallRow ? parseInt(stallRow) : undefined,
        col: stallCol ? parseInt(stallCol) : undefined,
      };
      if (editingStall) {
        await updateStall(editingStall.id, data);
        setStalls((prev) => prev.map((s) => s.id === editingStall.id ? { ...s, ...data } : s));
        toast.success('Stall updated');
      } else {
        const id = await createStall(data);
        setStalls((prev) => [...prev, { id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
        toast.success('Stall created');
      }
      setShowStallForm(false);
    } catch { toast.error('Failed to save stall'); }
    finally { setStallSaving(false); }
  }

  async function removeStall(stall: Stall) {
    if (!confirm(`Delete stall ${stall.stallCode}?`)) return;
    try {
      await deleteStall(stall.id);
      setStalls((prev) => prev.filter((s) => s.id !== stall.id));
      toast.success('Stall deleted');
    } catch { toast.error('Failed to delete stall'); }
  }

  // ── Bulk Create ──

  async function saveBulk() {
    if (!selectedHall || !bulkPrefix.trim()) { toast.error('Stall prefix required'); return; }
    const start = parseInt(bulkStart); const end = parseInt(bulkEnd);
    if (isNaN(start) || isNaN(end) || start > end) { toast.error('Invalid range'); return; }
    setBulkSaving(true);
    try {
      for (let i = start; i <= end; i++) {
        const code = `${bulkPrefix.trim().toUpperCase()}-${i}`;
        const l = parseFloat(bulkLength) || 3;
        const b = parseFloat(bulkBreadth) || 3;
        const pricing = calcPricing(l, b);
        const data: Omit<Stall, 'id' | 'createdAt' | 'updatedAt'> = {
          stallCode: code, hallId: selectedHall.id,
          hallName: selectedHall.hallName,
          length: l, breadth: b, ...pricing,
          status: 'available', exhibitorId: null, bookingId: null,
          spaceType: bulkSpaceType, features: [],
        };
        await createStall(data);
      }
      const updated = await getStallsByHall(selectedHall.id);
      setStalls(updated);
      toast.success(`Created ${end - start + 1} stalls`);
      setShowBulkForm(false);
    } catch { toast.error('Bulk creation failed'); }
    finally { setBulkSaving(false); }
  }

  function toggleFeature(f: string) {
    setStallFeatures((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  }

  const availCount = stalls.filter((s) => s.status === 'available').length;

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Halls & Stalls</h1>
          <p style={{ color: '#9CA3AF', marginTop: 4, fontSize: 14 }}>Configure exhibition halls and manage stalls</p>
        </div>
        <button onClick={openHallCreate} style={primaryBtn}>+ New Hall</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        {/* Hall list */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1rem', height: 'fit-content' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>HALLS ({halls.length})</div>
          {loading ? <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading...</p> :
            halls.length === 0 ? <p style={{ color: '#9CA3AF', fontSize: 13 }}>No halls yet. Create one!</p> :
              halls.map((hall) => (
                <div
                  key={hall.id}
                  onClick={() => setSelectedHall(hall)}
                  style={{
                    padding: '10px 12px', borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                    background: selectedHall?.id === hall.id ? '#E6F4F4' : 'transparent',
                    border: `1px solid ${selectedHall?.id === hall.id ? '#0D4F4F40' : 'transparent'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: selectedHall?.id === hall.id ? '#0D4F4F' : '#1A1A2E' }}>{hall.hallName}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{hall.stallCount} stalls</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={(e) => { e.stopPropagation(); openHallEdit(hall); }} style={iconBtn}>✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); removeHall(hall); }} style={iconBtn}>🗑️</button>
                  </div>
                </div>
              ))
          }
        </div>

        {/* Stall list */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1.5rem' }}>
          {!selectedHall ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
              <p>Select a hall to manage its stalls</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1A1A2E' }}>{selectedHall.hallName}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>{stalls.length} total · {availCount} available</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowBulkForm(true)} style={{ ...primaryBtn, background: '#7C3AED' }}>Bulk Create</button>
                  <button onClick={openStallCreate} style={primaryBtn}>+ Add Stall</button>
                </div>
              </div>

              {loadingStalls ? <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading stalls...</p> :
                stalls.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                    <p>No stalls configured. Add stalls or use bulk create.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {stalls.map((stall) => (
                      <div
                        key={stall.id}
                        style={{
                          padding: '10px', borderRadius: 10, border: `1.5px solid ${STATUS_COLOR[stall.status].border}`,
                          background: STATUS_COLOR[stall.status].bg, position: 'relative',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1A2E', marginBottom: 4 }}>{stall.stallCode}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{stall.length}m × {stall.breadth}m ({stall.area} sqm)</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', marginBottom: 8 }}>{formatCurrency(stall.totalPrice)}</div>
                        <span style={{
                          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                          background: STATUS_COLOR[stall.status].pillBg, color: STATUS_COLOR[stall.status].pillColor,
                          padding: '1px 6px', borderRadius: 100,
                        }}>
                          {stall.status}
                        </span>
                        <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 2 }}>
                          <button onClick={() => openStallEdit(stall)} style={{ ...iconBtn, fontSize: 11 }}>✏️</button>
                          <button onClick={() => removeStall(stall)} style={{ ...iconBtn, fontSize: 11 }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </>
          )}
        </div>
      </div>

      {/* Hall Modal */}
      {showHallForm && (
        <Modal title={editingHall ? 'Edit Hall' : 'Create Hall'} onClose={() => setShowHallForm(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <FormGroup label="Hall Code" required>
              <input value={hallCode} onChange={(e) => setHallCode(e.target.value)} placeholder="e.g. A" style={inputStyle} autoFocus />
            </FormGroup>
            <FormGroup label="Dimensions">
              <input value={hallDimensions} onChange={(e) => setHallDimensions(e.target.value)} placeholder="e.g. 30×60 M" style={inputStyle} />
            </FormGroup>
          </div>
          <FormGroup label="Hall Name" required>
            <input value={hallName} onChange={(e) => setHallName(e.target.value)} placeholder="e.g. Hall A" style={inputStyle} />
          </FormGroup>
          <ModalActions onCancel={() => setShowHallForm(false)} onConfirm={saveHall} loading={hallSaving} label={editingHall ? 'Update' : 'Create Hall'} />
        </Modal>
      )}

      {/* Stall Modal */}
      {showStallForm && (
        <Modal title={editingStall ? 'Edit Stall' : 'Add Stall'} onClose={() => setShowStallForm(false)}>
          <FormGroup label="Stall Code" required>
            <input value={stallCode} onChange={(e) => setStallCode(e.target.value)} placeholder="e.g. HA-01" style={inputStyle} />
          </FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <FormGroup label="Length (m)"><input value={stallLength} onChange={(e) => setStallLength(e.target.value)} type="number" style={inputStyle} /></FormGroup>
            <FormGroup label="Breadth (m)"><input value={stallBreadth} onChange={(e) => setStallBreadth(e.target.value)} type="number" style={inputStyle} /></FormGroup>
          </div>
          {stallLength && stallBreadth && (
            <div style={{ padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, marginBottom: '1rem', fontSize: 13, color: '#16A34A', fontWeight: 600 }}>
              Area: {(parseFloat(stallLength)||0)*(parseFloat(stallBreadth)||0)} sqm · Base: {formatCurrency((parseFloat(stallLength)||0)*(parseFloat(stallBreadth)||0)*7500)} + 18% GST = {formatCurrency(Math.round((parseFloat(stallLength)||0)*(parseFloat(stallBreadth)||0)*7500*1.18))}
            </div>
          )}
          <FormGroup label="Space Type">
            <select value={stallSpaceType} onChange={(e) => setStallSpaceType(e.target.value)} style={inputStyle}>
              {SPACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Features">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FEATURES.map((f) => (
                <button key={f} type="button" onClick={() => toggleFeature(f)}
                  style={{ padding: '4px 10px', borderRadius: 100, border: '1.5px solid', borderColor: stallFeatures.includes(f) ? '#0D4F4F' : '#E5E7EB', background: stallFeatures.includes(f) ? '#E6F4F4' : '#fff', color: stallFeatures.includes(f) ? '#0D4F4F' : '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {stallFeatures.includes(f) ? '✓ ' : ''}{f}
                </button>
              ))}
            </div>
          </FormGroup>
          <ModalActions onCancel={() => setShowStallForm(false)} onConfirm={saveStall} loading={stallSaving} label={editingStall ? 'Update Stall' : 'Create Stall'} />
        </Modal>
      )}

      {/* Bulk Modal */}
      {showBulkForm && (
        <Modal title="Bulk Create Stalls" onClose={() => setShowBulkForm(false)}>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 0 }}>
            Creates stalls with codes like A-1, A-2, ..., A-10
          </p>
          <FormGroup label="Code Prefix" required>
            <input value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} placeholder="e.g. A" style={inputStyle} />
          </FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <FormGroup label="Start Number"><input value={bulkStart} onChange={(e) => setBulkStart(e.target.value)} type="number" style={inputStyle} /></FormGroup>
            <FormGroup label="End Number"><input value={bulkEnd} onChange={(e) => setBulkEnd(e.target.value)} type="number" style={inputStyle} /></FormGroup>
            <FormGroup label="Length (m)"><input value={bulkLength} onChange={(e) => setBulkLength(e.target.value)} type="number" style={inputStyle} /></FormGroup>
            <FormGroup label="Breadth (m)"><input value={bulkBreadth} onChange={(e) => setBulkBreadth(e.target.value)} type="number" style={inputStyle} /></FormGroup>
          </div>
          <FormGroup label="Space Type">
            <select value={bulkSpaceType} onChange={(e) => setBulkSpaceType(e.target.value)} style={inputStyle}>
              {SPACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormGroup>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>Will create {Math.max(0, parseInt(bulkEnd) - parseInt(bulkStart) + 1) || 0} stalls</p>
          <ModalActions onCancel={() => setShowBulkForm(false)} onConfirm={saveBulk} loading={bulkSaving} label="Create Stalls" />
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
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

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<StallStatus, { bg: string; border: string; pillBg: string; pillColor: string }> = {
  available: { bg: '#DCFCE7', border: '#86EFAC', pillBg: '#DCFCE7', pillColor: '#16A34A' },
  reserved: { bg: '#FEF9C3', border: '#FDE047', pillBg: '#FEF9C3', pillColor: '#CA8A04' },
  booked: { bg: '#F3F4F6', border: '#D1D5DB', pillBg: '#F3F4F6', pillColor: '#6B7280' },
};

const primaryBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: 10, border: 'none', background: '#0D4F4F', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const iconBtn: React.CSSProperties = { padding: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1, borderRadius: 4 };
const inputStyle: React.CSSProperties = { width: '100%', height: 44, padding: '0 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, color: '#1A1A2E', outline: 'none', boxSizing: 'border-box', background: '#fff' };
