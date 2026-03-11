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

// ─── Sample Data ─────────────────────────────────────────────────────────────

const HALLS = [
  { hallName: 'Hall A — Plastics Machinery', stallCount: 30, availableCount: 30 },
  { hallName: 'Hall B — Packaging Solutions', stallCount: 25, availableCount: 25 },
  { hallName: 'Hall C — Raw Materials', stallCount: 20, availableCount: 20 },
  { hallName: 'Hall D — Recycling & Sustainability', stallCount: 18, availableCount: 18 },
];

const SPACE_TYPES = ['Shell Scheme', 'Raw Space', 'Corner Stall', 'Island Stall', 'Premium Space'];
const FEATURE_SETS = [
  ['Power', 'Table'],
  ['Power', 'WiFi', 'Table'],
  ['Power', 'WiFi', 'Table', 'Chairs'],
  ['Power', 'WiFi', 'Table', 'Chairs', 'Carpet'],
  ['Power', 'WiFi', 'Table', 'Chairs', 'Carpet', 'Lighting'],
];

function makeStalls(hallId: string, hallName: string, prefix: string, count: number) {
  const stalls = [];
  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(2, '0');
    const spaceType = SPACE_TYPES[i % SPACE_TYPES.length];
    const sizes = [[3, 3], [3, 3], [4, 3], [6, 4], [9, 6]];
    const [length, breadth] = sizes[i % sizes.length];
    const price = length * breadth * 1650;
    stalls.push({
      stallCode: `${prefix}-${num}`,
      hallId,
      hallName,
      length,
      breadth,
      price,
      status: 'available' as const,
      exhibitorId: null,
      bookingId: null,
      spaceType,
      features: FEATURE_SETS[i % FEATURE_SETS.length],
      row: Math.ceil(i / 5),
      col: ((i - 1) % 5) + 1,
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

    const prefixes = ['A', 'B', 'C', 'D'];
    let totalStalls = 0;

    try {
      for (let hi = 0; hi < HALLS.length; hi++) {
        const hallData = HALLS[hi];
        const prefix = prefixes[hi];

        // Skip if already exists
        const existing = await getDocs(
          query(collection(db, 'halls'), where('hallName', '==', hallData.hallName))
        );
        if (!existing.empty) {
          addLog(`⏭️  Already exists: ${hallData.hallName}`);
          continue;
        }

        const now = new Date().toISOString();
        const hallRef = await addDoc(collection(db, 'halls'), {
          ...hallData,
          createdAt: now,
          updatedAt: now,
        });
        addLog(`🏛️  Created: ${hallData.hallName}`);

        const stalls = makeStalls(hallRef.id, hallData.hallName, prefix, hallData.stallCount);
        for (const stall of stalls) {
          await addDoc(collection(db, 'stalls'), { ...stall, createdAt: now, updatedAt: now });
        }
        totalStalls += stalls.length;
        addLog(`   ✅ Seeded ${stalls.length} stalls`);
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
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>
            🛠️ Admin Setup
          </h1>
          <p style={{ color: '#6B7280', marginTop: 6 }}>
            Seed sample halls &amp; stalls into Firestore for testing.
          </p>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', marginTop: 0 }}>
            What will be created
          </h2>
          <ul style={{ color: '#4B5563', fontSize: 14, paddingLeft: '1.25rem', lineHeight: 2 }}>
            {HALLS.map((h) => (
              <li key={h.hallName}>{h.hallName} — {h.stallCount} stalls</li>
            ))}
          </ul>
          <p style={{ color: '#9CA3AF', fontSize: 12, margin: 0 }}>
            Skips any hall that already exists. Safe to re-run.
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={runSeed}
            disabled={running || done}
            style={{
              height: 48,
              padding: '0 2rem',
              background: done ? '#16A34A' : running ? '#9CA3AF' : '#0D4F4F',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: running || done ? 'not-allowed' : 'pointer',
              marginRight: 12,
            }}
          >
            {done ? '✅ Seeding complete' : running ? '⏳ Running…' : '🚀 Seed Sample Data'}
          </button>
          {done && (
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                height: 48,
                padding: '0 2rem',
                background: '#0D4F4F',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Go to Dashboard →
            </button>
          )}
        </div>

        {log.length > 0 && (
          <div style={{
            background: '#1A1A2E',
            borderRadius: 10,
            padding: '1rem 1.25rem',
            fontFamily: 'monospace',
            fontSize: 13,
            color: '#E5E7EB',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}>
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
