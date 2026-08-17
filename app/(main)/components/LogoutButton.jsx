'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Sign out — calls DELETE /api/v1/auth/session (revokes the Firebase
 * session cookie server-side), then lands back on "/".
 *
 * NOTE: the architecture (§3) also expects the Firebase client SDK's
 * signOut() to clear local SDK state — call it here too once the client
 * Firebase SDK is wired into the app.
 */
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    setBusy(true);
    try {
      await fetch('/api/v1/auth/session', { method: 'DELETE' });
    } catch {
      // Even if the API fails, let the server re-render decide.
    }
    router.refresh();
    router.push('/');
  }

  return (
    <button
      onClick={onLogout}
      disabled={busy}
      style={{
        background: 'none',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '7px 14px',
        fontSize: 13.5,
        fontWeight: 600,
        color: '#475569',
        cursor: 'pointer',
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
