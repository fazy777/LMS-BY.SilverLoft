'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Client-side action buttons for the dashboard. Both hit the project's own
 * API routes (same-origin fetch sends the session cookie automatically).
 * Styles are inline + dependency-free.
 */

const BUTTON = {
  background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

function useApiAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(url, { onSuccess } = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Something went wrong. Please try again.');
      }
      if (onSuccess) await onSuccess(json);
      // On success this component either refreshes or navigates away.
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return { busy, error, run, router };
}

/** POST /users/me/become-instructor, then re-render the server component. */
export function BecomeInstructorButton() {
  const { busy, error, run, router } = useApiAction();
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <button
        style={{ ...BUTTON, opacity: busy ? 0.6 : 1 }}
        disabled={busy}
        onClick={() =>
          run('/api/v1/users/me/become-instructor', { onSuccess: () => router.refresh() })
        }
      >
        {busy ? 'Applying…' : 'Become an instructor'}
      </button>
      {error && <span style={{ color: '#dc2626', fontSize: 12.5 }}>{error}</span>}
    </span>
  );
}

/** POST /instructor/stripe/onboard, then hand the browser to Stripe. */
export function StartOnboardingButton() {
  const { busy, error, run } = useApiAction();
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <button
        style={{ ...BUTTON, background: '#b45309', opacity: busy ? 0.6 : 1 }}
        disabled={busy}
        onClick={() =>
          run('/api/v1/instructor/stripe/onboard', {
            onSuccess: (json) => {
              if (json?.data?.url) window.location.href = json.data.url;
              else throw new Error('No onboarding URL returned.');
            },
          })
        }
      >
        {busy ? 'Opening Stripe…' : 'Complete payout setup'}
      </button>
      {error && <span style={{ color: '#dc2626', fontSize: 12.5 }}>{error}</span>}
    </span>
  );
}
