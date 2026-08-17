"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchIcon } from '../components/Icons'

interface Course {
  id: number
  title: string
  slug: string
  price_cents: number
  status: 'draft' | 'pending_review' | 'published' | 'rejected'
  thumbnail_url?: string
  student_count?: number
  rejection_reason?: string | null
  created_at?: string
}

const FALLBACK_COURSES: Course[] = [
  { id: 1, title: 'The Complete Next.js 16 Developer Course', slug: 'nextjs-16-developer-course', price_cents: 6499, status: 'published', student_count: 1248, thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=120&h=80&fit=crop' },
  { id: 7, title: 'Advanced TypeScript: Architecture & Design Patterns', slug: 'advanced-typescript-architecture', price_cents: 5999, status: 'pending_review', student_count: 0, thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=80&fit=crop' },
  { id: 8, title: 'Microservices & Distributed Systems in Go', slug: 'microservices-go', price_cents: 7499, status: 'draft', student_count: 0, thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&h=80&fit=crop' },
  { id: 2, title: 'Modern Cloud Architecture & Kubernetes', slug: 'cloud-architecture-kubernetes', price_cents: 8999, status: 'rejected', student_count: 0, rejection_reason: 'Please provide higher resolution lesson previews in Section 2.', thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=120&h=80&fit=crop' },
]

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

export default function InstructorCourses() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetch('/api/v1/instructor/courses')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCourses(json.data)
        } else {
          setCourses(FALLBACK_COURSES)
        }
        setLoading(false)
      })
      .catch(() => {
        setCourses(FALLBACK_COURSES)
        setLoading(false)
      })
  }, [])

  const filtered = courses.filter(c => {
    if (search.trim() && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="h-display2 text-[#112A46]">Your Courses</h1>
          <p className="text-sm text-[#64748B] mt-1 font-medium">
            Manage your course catalog, curriculum sections, and review submissions.
          </p>
        </div>

        <Link href="/instructor/courses/new" className="btn btn-primary btn-sm font-bold shadow-sm">
          + Create New Course
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 pr-8 h-11 text-sm bg-white border border-[#CBD5E1] rounded-full focus:border-[#112A46] focus:ring-2 focus:ring-[#112A46]/20 transition-all text-[#0B1B2E]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#64748B] text-[10px] font-bold transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          {['all', 'published', 'pending_review', 'draft', 'rejected'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`btn btn-sm text-xs font-bold capitalize ${
                filterStatus === st ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Table */}
      <div className="card overflow-x-auto shadow-sm">
        <table className="data-table min-w-[600px]">
          <thead>
            <tr>
              <th>Course Title</th>
              <th>Price</th>
              <th>Enrolled</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const price = `$${((c.price_cents || 0) / 100).toFixed(2)}`
              return (
                <tr key={c.id} className="hover:bg-[#F8FAFC]">
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={c.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=80&fit=crop'}
                        alt=""
                        className="table-thumb"
                      />
                      <span className="font-bold text-sm text-[#0B1B2E] truncate max-w-sm">{c.title}</span>
                    </div>
                  </td>
                  <td className="font-bold text-sm text-[#112A46]">{price}</td>
                  <td className="text-sm font-semibold text-[#64748B]">{c.student_count || 0}</td>
                  <td>{statusPill(c.status)}</td>
                  <td className="text-right">
                    <Link
                      href={`/instructor/courses/${c.id}`}
                      className="btn btn-secondary btn-sm text-xs font-bold"
                    >
                      {c.status === 'rejected' ? 'Edit & Resubmit' : 'Manage Curriculum'}
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
