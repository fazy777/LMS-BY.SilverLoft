"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Course {
  id: number
  title: string
  slug: string
  price_cents: number
  status: 'draft' | 'pending_review' | 'published' | 'rejected'
  thumbnail_url?: string
  student_count?: number
  rejection_reason?: string | null
  avg_rating?: number | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function statusPill(status: string) {
  switch (status) {
    case 'published':
      return <span className="pill pill-success text-[10px] font-bold">Published</span>
    case 'pending_review':
      return <span className="pill pill-warning text-[10px] font-bold">Pending Review</span>
    case 'rejected':
      return <span className="pill pill-danger text-[10px] font-bold">Rejected</span>
    default:
      return <span className="pill pill-gray text-[10px] font-bold">Draft</span>
  }
}

export default function InstructorDashboard({
  onNewCourse,
  onEditCourse,
  onEarnings,
  onStripeOnboard,
}: {
  onNewCourse?: () => void
  onEditCourse?: (id: string) => void
  onEarnings?: () => void
  onStripeOnboard?: () => void
}) {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<any>(null)
  const [stripeStatus, setStripeStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isInstructor, setIsInstructor] = useState(true)
  const [rejectionModal, setRejectionModal] = useState<string | null>(null)
  const [activatingInstructor, setActivatingInstructor] = useState(false)

  const loadInstructorData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Instructor Courses from SQL
      const coursesRes = await fetch('/api/v1/instructor/courses')
      const coursesJson = await coursesRes.json()
      if (coursesJson.success && Array.isArray(coursesJson.data)) {
        setCourses(coursesJson.data)
      } else if (coursesJson.error?.code === 'NOT_INSTRUCTOR') {
        setIsInstructor(false)
        setCourses([])
      } else {
        setCourses([])
      }

      // 2. Fetch Calculated Stats from SQL
      const statsRes = await fetch('/api/v1/instructor/stats')
      const statsJson = await statsRes.json()
      if (statsJson.success && statsJson.data) {
        setStats(statsJson.data)
      } else {
        setStats(null)
      }

      // 3. Fetch Stripe status
      const stripeRes = await fetch('/api/v1/instructor/stripe/status')
      const stripeJson = await stripeRes.json()
      if (stripeJson.success) {
        setStripeStatus(stripeJson.data)
      }
    } catch (e) {
      setCourses([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstructorData()
  }, [])

  const handleBecomeInstructor = async () => {
    setActivatingInstructor(true)
    try {
      const res = await fetch('/api/v1/users/me/become-instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: 'Instructor on Silver Loft' }),
      })
      const json = await res.json()
      if (json.success) {
        setIsInstructor(true)
        loadInstructorData()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActivatingInstructor(false)
    }
  }

  // Calculate genuine stats from real database responses
  const totalStudents = stats?.students?.total ?? courses.reduce((acc, c) => acc + (c.student_count || 0), 0)
  const netEarningsCents = stats?.earnings?.net_earnings_cents ?? 0
  const grossSalesCents = stats?.earnings?.gross_sales_cents ?? 0
  
  const totalRevenue = `$${(netEarningsCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const grossVolume = `$${(grossSalesCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  
  const avgRatingVal = stats?.ratings?.avg_rating
  const avgRatingDisplay = (avgRatingVal && avgRatingVal > 0 && stats?.ratings?.review_count > 0)
    ? `${Number(avgRatingVal).toFixed(1)} ★`
    : '—'

  const monthlyData = stats?.monthly || []
  const hasMonthlyActivity = monthlyData.some((m: any) => (m.amount_cents || 0) > 0)

  const handleEdit = (id: number | string) => {
    if (onEditCourse) {
      onEditCourse(String(id))
    } else {
      router.push(`/instructor/courses/${id}`)
    }
  }

  const handleCreate = () => {
    if (onNewCourse) {
      onNewCourse()
    } else {
      router.push('/instructor/courses/new')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#E2E8F0] rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse p-6"></div>
          ))}
        </div>
      </div>
    )
  }

  // If user is not yet an instructor
  if (!isInstructor) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="card p-8 sm:p-12 text-center bg-white border border-[#E2E8F0] shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#EAF1FA] text-[#112A46] flex items-center justify-center text-3xl mx-auto mb-4">
            🎤
          </div>
          <h2 className="h-card text-xl sm:text-2xl font-bold text-[#112A46] mb-2">
            Activate Your Instructor Studio
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mb-6 leading-relaxed">
            Turn your professional knowledge into recurring income. Create video lessons, build structured curricula, and earn 85% of every course sale deposited automatically to your bank account via Stripe Express.
          </p>
          <button
            onClick={handleBecomeInstructor}
            disabled={activatingInstructor}
            className="btn btn-primary font-bold px-8 h-12 text-sm shadow-md cursor-pointer"
          >
            {activatingInstructor ? 'Activating Instructor Profile...' : 'Activate Instructor Account →'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Studio Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="h-display2 text-[#112A46] text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight">
            Instructor Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Manage course curriculum, monitor earnings, and publish new content.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="btn btn-primary btn-sm font-bold shadow-sm text-xs sm:text-sm px-4 h-10 w-full sm:w-auto shrink-0 cursor-pointer"
        >
          + Create New Course
        </button>
      </div>

      {/* ── Stripe Alert Banner if incomplete ── */}
      {(!stripeStatus || !stripeStatus.onboarded) && (
        <div className="card p-4 sm:p-5 bg-[#FFFBEB] border-[#FDE68A] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="kbadge bg-[#FEF3C7] text-[#D97706] text-xl shrink-0">
            💳
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-[#78350F]">Payout Setup Incomplete</div>
            <div className="text-xs text-[#92400E] mt-0.5 font-medium leading-relaxed">
              Connect your bank account with Stripe Express to receive revenue deposits and publish courses.
            </div>
          </div>
          <button
            onClick={() => (onStripeOnboard ? onStripeOnboard() : router.push('/instructor/stripe'))}
            className="btn btn-primary btn-sm bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shrink-0 w-full sm:w-auto"
          >
            Connect Stripe Payouts →
          </button>
        </div>
      )}

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="stat-card">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#64748B]">Gross Sales</div>
          <div className="stat-num mt-1 text-[#112A46] font-black">{grossVolume}</div>
          <div className="text-[11px] sm:text-xs text-[#64748B] mt-1">Platform gross intake</div>
        </div>

        <div className="stat-card">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#64748B]">Net Earnings</div>
          <div className="stat-num mt-1 text-[#16A34A] font-black">{totalRevenue}</div>
          <div className="text-[11px] sm:text-xs text-[#16A34A] mt-1 font-semibold">✓ 85% creator share</div>
        </div>

        <div className="stat-card">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#64748B]">Active Students</div>
          <div className="stat-num mt-1 text-[#112A46] font-black">{totalStudents.toLocaleString()}</div>
          <div className="text-[11px] sm:text-xs text-[#64748B] mt-1">Learners across all courses</div>
        </div>

        <div className="stat-card">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#64748B]">Average Rating</div>
          <div className="stat-num mt-1 text-[#D97706] font-black">{avgRatingDisplay}</div>
          <div className="text-[11px] sm:text-xs text-[#64748B] mt-1">
            {stats?.ratings?.review_count ? `From ${stats.ratings.review_count} verified reviews` : 'No student reviews yet'}
          </div>
        </div>
      </div>

      {/* ── Monthly Earnings Chart ── */}
      <div className="card p-5 sm:p-6 shadow-sm bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h2 className="h-card text-base text-[#112A46] font-bold">Monthly Earnings Overview</h2>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">Performance across the last 12 calendar months</p>
          </div>
          {hasMonthlyActivity && (
            <span className="pill pill-success text-xs font-bold">
              📈 Active Sales
            </span>
          )}
        </div>

        {/* Visual Bar Chart */}
        {hasMonthlyActivity ? (
          <div className="flex items-end gap-2 sm:gap-4 h-40 pt-4 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
            {monthlyData.map((m: any, i: number) => {
              const height = Math.min(100, Math.max(10, Math.round(((m.amount_cents || 0) / 50000) * 100)))
              return (
                <div key={m.year_month || i} className="flex-1 min-w-[28px] flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-300 hover:opacity-80 bg-[#112A46]"
                    style={{ height: `${height}%` }}
                    title={`${m.month}: $${((m.amount_cents || 0) / 100).toFixed(2)}`}
                  ></div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#475569]">{m.month}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-10 text-center border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
            <p className="text-xs sm:text-sm text-[#64748B] font-medium">
              No sales activity recorded in the past 12 months. Payout volume will visualize here once students purchase your courses.
            </p>
          </div>
        )}
      </div>

      {/* ── Courses Table / Management Section ── */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="h-section text-[#112A46] text-base sm:text-lg font-bold">Course Management</h2>
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} total
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center shadow-sm bg-white border border-[#E2E8F0]">
            <div className="w-16 h-16 rounded-2xl bg-[#EAF1FA] text-[#112A46] flex items-center justify-center text-3xl mx-auto mb-4">
              ✨
            </div>
            <h3 className="h-card text-lg sm:text-xl font-bold text-[#112A46] mb-2">
              You haven&apos;t created any courses yet
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto mb-6 leading-relaxed">
              Start building your technical course curriculum with structured sections, video lessons, and interactive markdown content.
            </p>
            <button
              onClick={handleCreate}
              className="btn btn-primary btn-sm font-bold px-6 h-11 text-xs sm:text-sm shadow-md cursor-pointer"
            >
              + Create Your First Course
            </button>
          </div>
        ) : (
          <div className="card overflow-x-auto shadow-sm">
            <table className="data-table min-w-[600px]">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Price</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const price = `$${((c.price_cents || 0) / 100).toFixed(2)}`
                  return (
                    <tr key={c.id} className="hover:bg-[#F8FAFC]">
                      <td className="font-bold text-[#0B1B2E]">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=80&fit=crop'}
                            alt=""
                            className="table-thumb"
                          />
                          <span className="truncate max-w-xs">{c.title}</span>
                        </div>
                      </td>
                      <td className="font-bold text-[#112A46]">{price}</td>
                      <td className="text-[#64748B] font-semibold">{c.student_count || 0}</td>
                      <td>
                        <div>
                          {statusPill(c.status)}
                          {c.status === 'rejected' && c.rejection_reason && (
                            <div
                              onClick={() => setRejectionModal(c.rejection_reason || 'Course requires changes.')}
                              className="text-xs text-[#DC2626] font-semibold underline mt-1 cursor-pointer"
                            >
                              View feedback
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleEdit(c.id)}
                          className="btn btn-secondary btn-sm text-xs font-bold cursor-pointer"
                        >
                          {c.status === 'rejected' ? 'Edit & Resubmit' : c.status === 'draft' ? 'Continue Editing' : 'Manage Curriculum'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Rejection Feedback Modal ── */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-[#0B1B2E]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card modal-surface p-6 sm:p-8 max-w-md w-full bg-white">
            <div className="pill pill-danger mb-3 font-bold">Admin Quality Feedback</div>
            <h3 className="h-card text-[#DC2626] mb-2 font-bold">Rejection Notice</h3>
            <p className="p-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl text-xs sm:text-sm text-[#991B1B] leading-relaxed mb-6 font-medium">
              {rejectionModal}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setRejectionModal(null)}
                className="btn btn-primary btn-sm font-bold cursor-pointer"
              >
                Close Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
