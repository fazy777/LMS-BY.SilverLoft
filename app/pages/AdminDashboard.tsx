"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DollarIcon, UsersIcon, ChartIcon, ClockIcon } from '../components/Icons'

export default function AdminDashboard() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/admin/analytics')
      .then(res => res.json())
      .then(json => {
        if (json.success) setAnalytics(json.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const formatCents = (cents: number | undefined) => `$${((cents || 0) / 100).toFixed(2)}`

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="h-display2 text-[#112A46]">Platform Administrator Portal</h1>
        <p className="t-helper mt-0.5">
          Real-time aggregated platform metrics, marketplace quality gates, and financial volume.
        </p>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stat-card">
          <div className="t-helper text-xs uppercase font-bold tracking-wider">Gross Sales Volume</div>
          <div className="stat-num mt-1">{analytics?.revenue?.gmv_cents !== undefined ? formatCents(analytics.revenue.gmv_cents) : '$0.00'}</div>
          <div className="text-xs text-[#16A34A] font-semibold mt-1">✓ Succeeded payments</div>
        </div>

        <div className="stat-card">
          <div className="t-helper text-xs uppercase font-bold tracking-wider">Pending Review</div>
          <div className="stat-num mt-1 text-[#D97706]">{analytics?.courses?.pending_review || 0}</div>
          <Link href="/admin/pending" className="text-xs text-[#D97706] font-bold underline mt-1 block">
            Open Review Queue →
          </Link>
        </div>

        <div className="stat-card">
          <div className="t-helper text-xs uppercase font-bold tracking-wider">Registered Accounts</div>
          <div className="stat-num mt-1 text-[#112A46]">{analytics?.users?.total || 0}</div>
          <div className="text-xs text-[#64748B] font-semibold mt-1">Verified identity pool</div>
        </div>

        <div className="stat-card">
          <div className="t-helper text-xs uppercase font-bold tracking-wider">Published Courses</div>
          <div className="stat-num mt-1 text-[#16A34A]">{analytics?.courses?.published || 0}</div>
          <div className="text-xs text-[#64748B] font-semibold mt-1">Active marketplace catalog</div>
        </div>
      </div>

      {/* ── Quick Access Action Tiles ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => router.push('/admin/pending')}
          className="card p-7 shadow-sm hover:shadow-md transition-all cursor-pointer border-[#E2E8F0] hover:border-[#112A46]"
        >
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold text-xl mb-4">
            🛡️
          </div>
          <h2 className="h-card text-base text-[#112A46] mb-2">Course Approval Queue</h2>
          <p className="t-body text-xs leading-relaxed text-[#64748B] mb-5">
            Inspect incoming instructor courses, verify video resolution and curriculum depth, and publish or reject with detailed feedback.
          </p>
          <span className="text-xs font-bold text-[#112A46] flex items-center gap-1">
            Review Courses ({analytics?.courses?.pending_review || 2}) →
          </span>
        </div>

        <div
          onClick={() => router.push('/admin/users')}
          className="card p-7 shadow-sm hover:shadow-md transition-all cursor-pointer border-[#E2E8F0] hover:border-[#112A46]"
        >
          <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center font-bold text-xl mb-4">
            👥
          </div>
          <h2 className="h-card text-base text-[#112A46] mb-2">User Accounts & Roles</h2>
          <p className="t-body text-xs leading-relaxed text-[#64748B] mb-5">
            Search registered learners and instructors, inspect role privileges, toggle suspension flags, and review account records.
          </p>
          <span className="text-xs font-bold text-[#112A46] flex items-center gap-1">
            Manage User Accounts →
          </span>
        </div>

        <div
          onClick={() => router.push('/admin/analytics')}
          className="card p-7 shadow-sm hover:shadow-md transition-all cursor-pointer border-[#E2E8F0] hover:border-[#112A46]"
        >
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold text-xl mb-4">
            📊
          </div>
          <h2 className="h-card text-base text-[#112A46] mb-2">Financial & Platform Analytics</h2>
          <p className="t-body text-xs leading-relaxed text-[#64748B] mb-5">
            Examine gross marketplace volume (GMV), instructor revenue pools, platform commission margins, and payout settlement history.
          </p>
          <span className="text-xs font-bold text-[#112A46] flex items-center gap-1">
            View Analytics Reports →
          </span>
        </div>
      </div>
    </div>
  )
}
