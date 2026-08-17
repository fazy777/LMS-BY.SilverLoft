"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

export default function CheckoutCancel({
  onResume,
  onBrowse,
}: {
  onResume?: () => void
  onBrowse?: () => void
}) {
  const router = useRouter()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F0F5FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          boxShadow: '0 10px 40px rgba(17,42,70,0.08)',
          padding: '44px 36px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          border: '1px solid #E2E8F0',
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>
          ⚠️
        </div>

        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 24, color: '#112A46', margin: '0 0 8px' }}>
          Checkout Cancelled
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 28px', lineHeight: 1.55 }}>
          Your payment was not completed and your card was not charged. You can resume checkout anytime.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => (onBrowse ? onBrowse() : router.push('/courses'))}
            style={{ height: 46, background: '#112A46', color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}
          >
            Browse Course Catalog →
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ height: 46, background: 'transparent', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
