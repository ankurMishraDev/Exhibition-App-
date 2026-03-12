'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ─── PlastPack 2026 Hall Data ─────────────────────────────────────────────────

function calcPrice(length: number, breadth: number) {
  const area = length * breadth;
  const basePrice = area * 7500;
  const gstAmount = Math.round(basePrice * 0.18);
  return { area, basePrice, gstAmount, totalPrice: basePrice + gstAmount };
}

const HALLS = [
  { hallCode: 'A', hallName: 'Hall A', dimensions: '30×60 M', stallCount: 40 },
  { hallCode: 'B', hallName: 'Hall B', dimensions: '18×80 M', stallCount: 30 },
  { hallCode: 'C', hallName: 'Hall C', dimensions: '40×60 M', stallCount: 50 },
  { hallCode: 'D', hallName: 'Hall D — Live Machine', dimensions: '17×75 M', stallCount: 25 },
  { hallCode: 'E', hallName: 'Hall E — Live Machine', dimensions: '18×75 M', stallCount: 25 },
  { hallCode: 'F', hallName: 'Hall F', dimensions: '17×75 M', stallCount: 25 },
  { hallCode: 'G', hallName: 'Hall G', dimensions: '30×100 M', stallCount: 60 },
  { hallCode: 'H', hallName: 'Hall H', dimensions: '30×80 M', stallCount: 45 },
  { hallCode: 'I', hallName: 'Hall I', dimensions: '30×80 M', stallCount: 45 },
  { hallCode: 'J', hallName: 'Hall J', dimensions: '30×80 M', stallCount: 45 },
  { hallCode: 'EV', hallName: 'Event Hall', dimensions: '30×50 M', stallCount: 30 },
];

// Stall size variations: 6×9, 8×6, 6×6, 6×3, 3×3
const STALL_SIZES = [
  [6, 9],
  [8, 6],
  [6, 6],
  [6, 3],
  [3, 3],
] as [number, number][];

const SPACE_TYPES = ['Bare Space', 'Shell Scheme', '2-Side Open', '3-Side Open'];
const FEATURE_SETS = [
  ['Power', 'Fascia Board'],
  ['Power', 'WiFi', 'Fascia Board'],
  ['Power', 'WiFi', 'Table', 'Chair'],
  ['Power', 'WiFi', 'Table', 'Chair', 'Carpet'],
  ['Power', 'WiFi', 'Table', 'Chair', 'Carpet', 'Lighting'],
];

function makeStalls(hallId: string, hallName: string, hallCode: string, count: number) {
  const stalls = [];
  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(2, '0');
    const [length, breadth] = STALL_SIZES[i % STALL_SIZES.length];
    const { area, basePrice, gstAmount, totalPrice } = calcPrice(length, breadth);
    stalls.push({
      stallCode: `H${hallCode}-${num}`,
      hallId,
      hallName,
      length,
      breadth,
      area,
      basePrice,
      gstAmount,
      totalPrice,
      status: 'available' as const,
      exhibitorId: null,
      bookingId: null,
      spaceType: SPACE_TYPES[i % SPACE_TYPES.length],
      features: FEATURE_SETS[i % FEATURE_SETS.length],
      row: Math.ceil(i / 4),
      col: ((i - 1) % 4) + 1,
    });
  }
  return stalls;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  function addLog(msg: string) {
    setLog((prev) => [...prev, msg]);
  }

  async function runSeed() {
    setRunning(true);
    setLog([]);
    let totalStalls = 0;

    try {
      for (const hallData of HALLS) {
        const existing = await getDocs(
          query(collection(db, 'halls'), where('hallName', '==', hallData.hallName))
        );
        if (!existing.empty) {
          addLog(`⏭️  Already exists: ${hallData.hallName}`);
          continue;
        }

        const now = new Date().toISOString();
        const hallRef = await addDoc(collection(db, 'halls'), {
          hallCode: hallData.hallCode,
          hallName: hallData.hallName,
          dimensions: hallData.dimensions,
          stallCount: hallData.stallCount,
          availableCount: hallData.stallCount,
          createdAt: now,
          updatedAt: now,
        });
        addLog(`🏛️  Created: ${hallData.hallName} (${hallData.dimensions})`);

        const stalls = makeStalls(hallRef.id, hallData.hallName, hallData.hallCode, hallData.stallCount);
        for (const stall of stalls) {
          await addDoc(collection(db, 'stalls'), { ...stall, createdAt: now, updatedAt: now });
        }
        totalStalls += stalls.length;
        addLog(`   ✅ Seeded ${stalls.length} stalls (e.g. H${hallData.hallCode}-01 … H${hallData.hallCode}-${String(stalls.length).padStart(2, '0')})`);
      }

      addLog(`\n✅ Done! Created ${totalStalls} stalls across ${HALLS.length} halls.`);
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`❌ Error: ${msg}`);
      if (msg.includes('permission-denied')) {
        addLog('');
        addLog('⚠️  Firestore rules are blocking writes.');
        addLog('   Go to Firebase Console → Firestore → Rules');
        addLog('   and paste the rules from adminExhibitionApp/firestore.rules');
        addLog('   then click "Publish" and try again.');
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', padding: '2rem' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>
            🛠️ Admin Setup — PlastPack 2026
          </h1>
          <p style={{ color: '#6B7280', marginTop: 6 }}>
            Seed halls &amp; stalls for PlastPack 2026 · 27–30 Nov · Labhganga Exhibition Centre, Indore
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', marginTop: 0 }}>Halls to be created</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '6px 4px', color: '#9CA3AF', fontWeight: 700 }}>Hall</th>
                <th style={{ textAlign: 'left', padding: '6px 4px', color: '#9CA3AF', fontWeight: 700 }}>Size</th>
                <th style={{ textAlign: 'right', padding: '6px 4px', color: '#9CA3AF', fontWeight: 700 }}>Stalls</th>
              </tr>
            </thead>
            <tbody>
              {HALLS.map((h) => (
                <tr key={h.hallCode} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '6px 4px', color: '#1A1A2E', fontWeight: 600 }}>{h.hallName}</td>
                  <td style={{ padding: '6px 4px', color: '#6B7280' }}>{h.dimensions}</td>
                  <td style={{ padding: '6px 4px', color: '#0D4F4F', fontWeight: 700, textAlign: 'right' }}>{h.stallCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0.75rem 0 0' }}>
            Pricing: ₹7,500/sqm + 18% GST · StallID format: HA-01, HB-01, etc. · Safe to re-run (skips existing).
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={runSeed}
            disabled={running || done}
            style={{ height: 48, padding: '0 2rem', background: done ? '#16A34A' : running ? '#9CA3AF' : '#0D4F4F', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: running || done ? 'not-allowed' : 'pointer', marginRight: 12 }}
          >
            {done ? '✅ Seeding complete' : running ? '⏳ Running…' : '🚀 Seed PlastPack 2026 Data'}
          </button>
          {done && (
            <button
              onClick={() => router.push('/dashboard')}
              style={{ height: 48, padding: '0 2rem', background: '#0D4F4F', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Go to Dashboard →
            </button>
          )}
        </div>

        {log.length > 0 && (
          <div style={{ background: '#1A1A2E', borderRadius: 10, padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: 13, color: '#E5E7EB', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {log.map((line, i) => (
              <div key={i} style={{ color: line.startsWith('❌') ? '#F87171' : line.startsWith('✅') ? '#4ADE80' : '#E5E7EB' }}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
