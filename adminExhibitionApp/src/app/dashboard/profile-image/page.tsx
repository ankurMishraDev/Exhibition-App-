'use client';

import React, { useState } from 'react';

export default function ProfileImagePage() {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Profile Images Management</h1>
        <p style={{ color: '#9CA3AF', marginTop: 4, fontSize: 14 }}>Upload and manage exhibitor profile images</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', textAlign: 'center', border: '1px dashed #ccc' }}>
        <p style={{ color: '#6B7280', marginBottom: '1rem' }}>No profile images uploaded yet.</p>
        <button style={{
          padding: '10px 20px',
          background: '#0D4F4F',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600
        }}>
          Upload New Profile Image
        </button>
      </div>
    </div>
  );
}
