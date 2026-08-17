"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CheckoutSuccess({
  onGoToCourse,
  onDashboard,
}: {
  onGoToCourse?: () => void
  onDashboard?: () => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')

  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      // Reconcile payment with SQL database
      fetch('/api/v1/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkout_session_id: sessionId }),
      })
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data?.enrollment) {
            setEnrollment(json.data.enrollment)
          }
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [sessionId])

  const handleStartLearning = () => {
    if (onGoToCourse) {
      onGoToCourse()
    } else if (enrollment?.course?.slug || enrollment?.course?.id) {
      router.push(`/learn/${enrollment.course.slug || enrollment.course.id}`)
    } else {
      router.push('/dashboard')
    }
  }

  const handleGoDashboard = () => {
    if (onDashboard) {
      onDashboard()
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #EAF1FA 0%, #ACC8E5 100%)',
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
          borderRadius: 28,
          boxShadow: '0 20px 60px rgba(17,42,70,0.14)',
          padding: '48px 40px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Animated Check */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(22,163,74,0.3)' }}>
            <svg width="36" height="36" viewBox="0 0 44 44" fill="none">
              <polyline points="10,22 19,31 34,13" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 26, color: '#112A46', margin: '0 0 8px' }}>
          Enrollment Confirmed!
        </h1>
        <p style={{ fontSize: 14.5, color: '#64748B', margin: '0 0 24px' }}>
          Your payment was verified and full lifetime access has been unlocked in your dashboard.
        </p>

        {enrollment?.course && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#EAF1FA', borderRadius: 14, padding: '14px 16px', marginBottom: 28, textAlign: 'left' }}>
            <img
              src={enrollment.course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=80&fit=crop'}
              alt=""
              style={{ width: 68, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 14, color: '#0B1B2E', lineHeight: 1.35, marginBottom: 2 }}>
                {enrollment.course.title}
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {enrollment.course.instructor?.display_name || 'Silver Loft Course'}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleStartLearning}
            style={{ height: 48, background: '#112A46', color: '#FFFFFF', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            Start Learning Now →
          </button>

          <button
            onClick={handleGoDashboard}
            style={{ height: 48, background: 'transparent', color: '#112A46', border: '1.5px solid #ACC8E5', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Go to Student Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
