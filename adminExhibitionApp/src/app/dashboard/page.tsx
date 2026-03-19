'use client';

import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '@/lib/firebase/services';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency } from '@/lib/utils';

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  totalRevenue: number;
  totalExhibitors: number;
  totalHalls: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const greeting = getGreeting();

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>
          {greeting}, Admin 👋
        </h1>
        <p style={{ color: '#9CA3AF', marginTop: 6, fontSize: 14 }}>
           Here&apos;s what&apos;s happening with PlastPack today.
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          label="Total Bookings"
          value={loading ? '...' : String(stats?.totalBookings ?? 0)}
          icon="📋"
          color="#0D4F4F"
          bg="#E6F4F4"
        />
        <StatCard
          label="Pending Approval"
          value={loading ? '...' : String(stats?.pendingBookings ?? 0)}
          icon="⏳"
          color="#D97706"
          bg="#FEF3C7"
          urgent={(stats?.pendingBookings ?? 0) > 0}
        />
        <StatCard
          label="Approved Bookings"
          value={loading ? '...' : String(stats?.approvedBookings ?? 0)}
          icon="✅"
          color="#16A34A"
          bg="#DCFCE7"
        />
        <StatCard
          label="Total Revenue"
          value={loading ? '...' : formatCurrency(stats?.totalRevenue ?? 0)}
          icon="💰"
          color="#7C3AED"
          bg="#EDE9FE"
        />
        <StatCard
          label="Exhibitors"
          value={loading ? '...' : String(stats?.totalExhibitors ?? 0)}
          icon="🏢"
          color="#1D4ED8"
          bg="#DBEAFE"
        />
        <StatCard
          label="Halls Configured"
          value={loading ? '...' : String(stats?.totalHalls ?? 0)}
          icon="🏛️"
          color="#0D4F4F"
          bg="#E6F4F4"
        />
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '1.5rem',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 1.25rem' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <QuickAction href="/dashboard/bookings" label="Review Pending Bookings" icon="📋" primary />
          <QuickAction href="/dashboard/halls" label="Manage Halls & Stalls" icon="🏛️" />
          <QuickAction href="/dashboard/exhibitors" label="View Exhibitors" icon="🏢" />
          <QuickAction href="/dashboard/payments" label="Record Payments" icon="💳" />
          <QuickAction href="/dashboard/discounts" label="Generate Discount Codes" icon="🏷️" />
        </div>
      </div>

      {/* Event Overview */}
      <div
        style={{
          marginTop: '1.5rem',
          background: 'linear-gradient(135deg, #0D4F4F, #1A7F7F)',
          borderRadius: 16,
          padding: '1.5rem',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            transform: 'translate(50px, -80px)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Upcoming Event
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>PlastPack Exhibition</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>📅 13–16 February 2026</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>📍 Exhibition Ground, Mumbai</div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
  urgent,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  bg: string;
  urgent?: boolean;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '1.25rem',
        border: `1px solid ${urgent ? '#FDE68A' : '#E5E7EB'}`,
        boxShadow: urgent
          ? '0 0 0 2px #FDE68A40'
          : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'transform 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          {icon}
        </div>
        {urgent && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#D97706',
              background: '#FEF3C7',
              padding: '2px 8px',
              borderRadius: 100,
              border: '1px solid #FDE68A',
            }}
          >
            ACTION NEEDED
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon,
  primary,
}: {
  href: string;
  label: string;
  icon: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 10,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 600,
        background: primary ? '#0D4F4F' : '#F5F7FA',
        color: primary ? '#fff' : '#4B5563',
        border: primary ? 'none' : '1px solid #E5E7EB',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </a>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
