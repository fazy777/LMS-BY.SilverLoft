"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminGuard({ children }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    fetch('/api/v1/users/me')
      .then(res => {
        if (res.status === 401) {
          router.push('/login?redirect=/admin')
          return null
        }
        return res.json()
      })
      .then(json => {
        if (!json) return
        if (json.success && json.data) {
          const u = json.data
          setUser(u)
          const isAdmin = u.email === 'hafizmfaizanali@gmail.com' || u.is_admin
          if (isAdmin) {
            setAuthorized(true)
          } else {
            setErrorMsg(`Access restricted. You are logged in as ${u.email}. Administrator access requires logging in with hafizmfaizanali@gmail.com.`)
          }
        } else {
          router.push('/login?redirect=/admin')
        }
        setLoading(false)
      })
      .catch(() => {
        router.push('/login?redirect=/admin')
      })
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F5FB', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 40, backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(17,42,70,0.06)' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, fontWeight: 800, color: '#112A46', margin: '0 0 6px' }}>
            Verifying Admin Credentials...
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: 0 }}>
            Checking authorization for hafizmfaizanali@gmail.com
          </p>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F5FB', padding: 20, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 40, backgroundColor: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(17,42,70,0.08)' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
            ✕
          </div>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#112A46', margin: '0 0 10px' }}>
            Administrator Access Denied
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>
            {errorMsg}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => {
                fetch('/api/v1/auth/session', { method: 'DELETE' }).finally(() => {
                  router.push('/login?redirect=/admin')
                })
              }}
              style={{ height: 44, borderRadius: 10, border: 'none', backgroundColor: '#112A46', color: '#FFFFFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
            >
              Sign In as hafizmfaizanali@gmail.com →
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ height: 44, borderRadius: 10, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#64748B', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Return to Student Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
