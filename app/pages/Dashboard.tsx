"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpenIcon, ClockIcon, CertIcon, PlayIcon, SearchIcon } from '../components/Icons'

interface Enrollment {
  id: number
  course: {
    id: number
    title: string
    slug: string
    thumbnail_url?: string
    currency?: string
    instructor?: { display_name: string }
  }
  progress_percent: number
  completed_at?: string | null
  enrolled_at?: string
}

export default function Dashboard({ onBrowse }: { onBrowse?: () => void }) {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 1. Fetch current user
    fetch('/api/v1/users/me')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setUser(json.data)
        } else {
          setUser(null)
        }
      })
      .catch(() => {
        setUser(null)
      })

    // 2. Fetch genuine student enrollments from SQL database
    fetch('/api/v1/enrollments?limit=50')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data?.enrollments)) {
          // Keep genuine enrollments directly (empty array if 0 courses enrolled)
          setEnrollments(json.data.enrollments)
        } else {
          setEnrollments([])
        }
        setLoading(false)
      })
      .catch(() => {
        setEnrollments([])
        setLoading(false)
      })
  }, [])

  const totalEnrolled = enrollments.length
  const completedCount = enrollments.filter(e => e.completed_at || (e.progress_percent && e.progress_percent >= 100)).length
  const inProgressCount = totalEnrolled - completedCount

  const recentCourse = enrollments.length > 0 ? enrollments[0] : null
  const greetingName = user?.display_name || user?.email?.split('@')[0] || 'Learner'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#E2E8F0] rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse p-6"></div>
          ))}
        </div>
        <div className="h-44 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="h-display2 text-[#112A46] text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight">
            Welcome back, {greetingName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Track your active course progress, resume lectures, and view earned certificates.
          </p>
        </div>

        <Link
          href="/courses"
          className="btn btn-primary btn-sm font-bold shadow-sm text-xs sm:text-sm px-4 h-10 w-full sm:w-auto shrink-0"
        >
          Browse Marketplace →
        </Link>
      </div>

      {/* ── Metric KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="stat-card">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#64748B]">Courses Enrolled</div>
          <div className="stat-num mt-1 text-[#112A46] font-black">{totalEnrolled}</div>
          <div className="text-[11px] sm:text-xs text-[#64748B] mt-1">Active curriculum access</div>
        </div>

        <div className="stat-card">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#64748B]">In Progress</div>
          <div className="stat-num mt-1 text-[#D97706] font-black">{inProgressCount}</div>
          <div className="text-[11px] sm:text-xs text-[#64748B] mt-1">Lessons currently underway</div>
        </div>

        <div className="stat-card">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#64748B]">Certificates Earned</div>
          <div className="stat-num mt-1 text-[#16A34A] font-black">{completedCount}</div>
          <div className="text-[11px] sm:text-xs text-[#16A34A] mt-1 font-semibold">
            {completedCount > 0 ? '✓ Verified credentials' : 'Complete 100% to earn'}
          </div>
        </div>
      </div>

      {/* ── Continue Learning Banner (Only if student has an active course) ── */}
      {recentCourse && (
        <div className="card modal-surface p-5 sm:p-7 md:p-8 bg-gradient-to-r from-[#112A46] via-[#1E4270] to-[#0B1B2E] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto">
            <div
              className="w-20 h-16 sm:w-28 sm:h-20 rounded-xl bg-cover bg-center shrink-0 border border-white/20 shadow-md"
              style={{
                backgroundImage: `url(${recentCourse.course?.thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=240&h=160&fit=crop'})`,
              }}
            ></div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#ACC8E5] block mb-0.5">
                Continue Learning
              </span>
              <h2 className="font-display font-bold text-base sm:text-lg text-white my-0.5 truncate max-w-md leading-snug">
                {recentCourse.course?.title}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-28 sm:w-36 md:w-48 progress-track bg-white/25">
                  <div className="progress-fill bg-[#ACC8E5]" style={{ width: `${recentCourse.progress_percent || 0}%` }}></div>
                </div>
                <span className="text-xs text-[#ACC8E5] font-bold">{Math.round(recentCourse.progress_percent || 0)}% done</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push(`/learn/${recentCourse.course?.slug || recentCourse.course?.id}`)}
            className="btn btn-primary bg-white text-[#112A46] hover:bg-[#F0F5FB] shrink-0 font-bold px-5 h-11 shadow-md w-full md:w-auto text-xs sm:text-sm"
          >
            <PlayIcon size={16} color="#112A46" /> Resume Lesson
          </button>
        </div>
      )}

      {/* ── My Courses Section ── */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="h-section text-[#112A46] text-base sm:text-lg font-bold">Your Enrolled Courses</h2>
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
            {totalEnrolled} {totalEnrolled === 1 ? 'course' : 'courses'}
          </span>
        </div>

        {enrollments.length === 0 ? (
          /* Clean Empty State when user has 0 enrollments */
          <div className="card p-8 sm:p-12 md:p-16 text-center shadow-sm bg-white border border-[#E2E8F0]">
            <div className="w-16 h-16 rounded-2xl bg-[#EAF1FA] text-[#112A46] flex items-center justify-center text-3xl mx-auto mb-4">
              📚
            </div>
            <h3 className="h-card text-lg sm:text-xl font-bold text-[#112A46] mb-2">
              You haven&apos;t enrolled in any courses yet
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto mb-6 leading-relaxed">
              Explore our curated marketplace of verified courses taught by experienced industry professionals. Lifetime access to all video lessons and source files.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/courses"
                className="btn btn-primary btn-sm font-bold px-6 h-11 text-xs sm:text-sm shadow-md"
              >
                Browse Course Catalog →
              </Link>
            </div>
          </div>
        ) : (
          /* Grid of Genuine Enrolled Courses */
          <div className="grid-courses">
            {enrollments.map((enr) => {
              const progress = Math.round(enr.progress_percent || 0)
              return (
                <div
                  key={enr.id}
                  onClick={() => router.push(`/learn/${enr.course?.slug || enr.course?.id}`)}
                  className="course-card"
                >
                  <div
                    className="course-thumb"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(17,42,70,0.1) 0%, rgba(11,27,46,0.65) 100%), url(${enr.course?.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=520&h=292&fit=crop'})`,
                    }}
                  >
                    <span className="pill bg-white/25 text-white backdrop-blur-md border border-white/30 text-[10px] font-bold">
                      {progress >= 100 ? '✓ Completed' : `${progress}% Complete`}
                    </span>
                  </div>

                  <div className="course-body">
                    <h3 className="course-title text-[#0B1B2E]">
                      {enr.course?.title}
                    </h3>

                    <div className="text-xs text-[#64748B] mb-2 font-medium truncate">
                      by {enr.course?.instructor?.display_name || 'Silver Loft Instructor'}
                    </div>

                    <div className="mt-auto pt-2.5 border-t border-[#F1F5F9] space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-[#64748B]">
                        <span>Progress</span>
                        <span className="font-bold text-[#112A46]">{progress}%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: progress >= 100 ? '#16A34A' : '#112A46'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
