'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        toast.error('Invalid email or password');
      } else if (code === 'auth/user-not-found') {
        toast.error('No admin account found with this email');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0D4F4F 0%, #1A7F7F 50%, #083535 100%)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0D4F4F, #1A7F7F)',
            padding: '2rem 2rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.15)',
              marginBottom: '1rem',
              fontSize: 28,
            }}
          >
            🏭
          </div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 22, fontWeight: 800 }}>
            PlastPack Admin
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.5rem 0 0', fontSize: 13 }}>
            Exhibition Management Panel
          </p>
        </div>

        {/* Tricolor stripe */}
        <div style={{ display: 'flex', height: 4 }}>
          <div style={{ flex: 1, background: '#FF9933' }} />
          <div style={{ flex: 1, background: '#ffffff', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }} />
          <div style={{ flex: 1, background: '#138808' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="plastpack2026@admin.com"
              style={inputStyle}
              disabled={loading}
              autoFocus
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: '2.75rem' }}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: 52,
              background: loading ? '#9CA3AF' : '#0D4F4F',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
          </button>

          <p
            style={{
              textAlign: 'center',
              marginTop: '1.25rem',
              fontSize: 12,
              color: '#9CA3AF',
            }}
          >
            Admin access only. Contact the system administrator for credentials.
          </p>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#4B5563',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  padding: '0 14px',
  border: '1.5px solid #E5E7EB',
  borderRadius: 10,
  fontSize: 14,
  color: '#1A1A2E',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  transition: 'border-color 0.2s',
};
