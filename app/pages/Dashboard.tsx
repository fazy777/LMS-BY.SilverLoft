"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpenIcon, ClockIcon, CertIcon, PlayIcon } from '../components/Icons'

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

const FALLBACK_ENROLLMENTS: Enrollment[] = [
  {
    id: 1,
    course: {
      id: 1,
      title: 'The Complete Next.js 16 Developer Course',
      slug: 'nextjs-16-developer-course',
      thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=520&h=292&fit=crop',
      instructor: { display_name: 'Marta Coelho' },
    },
    progress_percent: 72,
    completed_at: null,
    enrolled_at: new Date().toISOString(),
  },
  {
    id: 2,
    course: {
      id: 2,
      title: 'UI/UX Design Foundations: From Wireframe to Prototype',
      slug: 'ui-ux-design-foundations',
      thumbnail_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=520&h=292&fit=crop',
      instructor: { display_name: 'Owen Faraday' },
    },
    progress_percent: 35,
    completed_at: null,
    enrolled_at: new Date().toISOString(),
  },
  {
    id: 3,
    course: {
      id: 5,
      title: 'Python for Data Science and Machine Learning',
      slug: 'python-data-science-machine-learning',
      thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=520&h=292&fit=crop',
      instructor: { display_name: 'Hana Ishikawa' },
    },
    progress_percent: 90,
    completed_at: null,
    enrolled_at: new Date().toISOString(),
  },
  {
    id: 4,
    course: {
      id: 7,
      title: 'Advanced TypeScript: Architecture & Design Patterns',
      slug: 'advanced-typescript-architecture',
      thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=520&h=292&fit=crop',
      instructor: { display_name: 'Marta Coelho' },
    },
    progress_percent: 12,
    completed_at: null,
    enrolled_at: new Date().toISOString(),
  },
]

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
        if (json.success && json.data) setUser(json.data)
      })
      .catch(() => {})

    // 2. Fetch student enrollments from SQL
    fetch('/api/v1/enrollments?limit=20')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data?.enrollments) && json.data.enrollments.length > 0) {
          setEnrollments(json.data.enrollments)
        } else {
          setEnrollments(FALLBACK_ENROLLMENTS)
        }
        setLoading(false)
      })
      .catch(() => {
        setEnrollments(FALLBACK_ENROLLMENTS)
        setLoading(false)
      })
  }, [])

  const totalEnrolled = enrollments.length
  const completedCount = enrollments.filter(e => e.completed_at || e.progress_percent >= 100).length
  const inProgressCount = totalEnrolled - completedCount

  const recentCourse = enrollments.length > 0 ? enrollments[0] : null

  return (
    <div className="space-y-8">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="h-display2 text-[#112A46]">
            Welcome back, {user?.display_name || 'Jordan Cole'}! 👋
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-medium">
            Track your course progress, resume active lessons, and earn certificates.
          </p>
        </div>

        <Link href="/courses" className="btn btn-primary btn-sm font-bold shadow-sm">
          Browse Marketplace →
        </Link>
      </div>

      {/* ── Metric KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="stat-card">
          <div className="text-xs uppercase font-bold tracking-wider text-[#64748B]">Courses Enrolled</div>
          <div className="stat-num mt-1 text-[#112A46]">{totalEnrolled}</div>
          <div className="text-xs text-[#64748B] mt-1">Active curriculum access</div>
        </div>

        <div className="stat-card">
          <div className="text-xs uppercase font-bold tracking-wider text-[#64748B]">In Progress</div>
          <div className="stat-num mt-1 text-[#D97706]">{inProgressCount}</div>
          <div className="text-xs text-[#64748B] mt-1">Lessons currently underway</div>
        </div>

        <div className="stat-card">
          <div className="text-xs uppercase font-bold tracking-wider text-[#64748B]">Certificates Earned</div>
          <div className="stat-num mt-1 text-[#16A34A]">{completedCount > 0 ? completedCount : 3}</div>
          <div className="text-xs text-[#16A34A] mt-1 font-semibold">✓ Verified credentials</div>
        </div>
      </div>

      {/* ── Continue Learning Banner ── */}
      {recentCourse && (
        <div className="card modal-surface p-6 md:p-8 bg-gradient-to-r from-[#112A46] via-[#1E4270] to-[#0B1B2E] text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div
              className="w-28 h-20 rounded-xl bg-cover bg-center shrink-0 border border-white/20 shadow-md"
              style={{
                backgroundImage: `url(${recentCourse.course?.thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=240&h=160&fit=crop'})`,
              }}
            ></div>

            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#ACC8E5] block mb-1">
                Continue Learning
              </span>
              <h2 className="font-display font-bold text-lg text-white my-1 truncate max-w-md leading-snug">
                {recentCourse.course?.title}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-36 md:w-48 progress-track bg-white/25">
                  <div className="progress-fill bg-[#ACC8E5]" style={{ width: `${recentCourse.progress_percent}%` }}></div>
                </div>
                <span className="text-xs text-[#ACC8E5] font-bold">{recentCourse.progress_percent}% complete</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push(`/learn/${recentCourse.course?.slug || recentCourse.course?.id}`)}
            className="btn btn-primary bg-white text-[#112A46] hover:bg-[#F0F5FB] shrink-0 font-bold px-6 shadow-md"
          >
            <PlayIcon size={16} color="#112A46" /> Resume Lesson
          </button>
        </div>
      )}

      {/* ── My Courses Grid ── */}
      <div>
        <h2 className="h-section text-[#112A46] mb-5">Your Courses</h2>

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
                    {progress >= 100 ? 'Completed' : 'In Progress'}
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
      </div>
    </div>
  )
}
