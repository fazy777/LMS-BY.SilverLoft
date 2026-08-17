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
        if (json.success && Array.isArray(json.data)) {
          setCourses(json.data)
        } else {
          setCourses([])
        }
        setLoading(false)
      })
      .catch(() => {
        setCourses([])
        setLoading(false)
      })
  }, [])

  const filtered = courses.filter(c => {
    if (search.trim() && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#E2E8F0] rounded-xl animate-pulse"></div>
        <div className="h-64 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="h-display2 text-[#112A46] text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight">
            Your Courses
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Manage your course catalog, curriculum sections, and review submissions.
          </p>
        </div>

        <Link
          href="/instructor/courses/new"
          className="btn btn-primary btn-sm font-bold shadow-sm text-xs sm:text-sm px-4 h-10 w-full sm:w-auto shrink-0"
        >
          + Create New Course
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 pr-8 h-11 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-full focus:border-[#112A46] focus:ring-2 focus:ring-[#112A46]/20 transition-all text-[#0B1B2E]"
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

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {['all', 'published', 'pending_review', 'draft', 'rejected'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`btn btn-sm text-[11px] sm:text-xs font-bold capitalize whitespace-nowrap px-3 h-9 ${
                filterStatus === st ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Courses List or Empty State */}
      {courses.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center shadow-sm bg-white border border-[#E2E8F0]">
          <div className="w-14 h-14 rounded-2xl bg-[#EAF1FA] text-[#112A46] flex items-center justify-center text-2xl mx-auto mb-3">
            📚
          </div>
          <h3 className="h-card text-base sm:text-lg font-bold text-[#112A46] mb-1">
            No courses found
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mb-5 leading-relaxed">
            Create your first course to begin building curriculum modules and publishing content to students worldwide.
          </p>
          <Link
            href="/instructor/courses/new"
            className="btn btn-primary btn-sm font-bold px-5 h-10 text-xs shadow-md"
          >
            + Create New Course
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center bg-white">
          <p className="text-xs sm:text-sm text-[#64748B]">No courses match your filter or search criteria.</p>
          <button
            onClick={() => { setSearch(''); setFilterStatus('all'); }}
            className="mt-2 text-xs font-bold text-[#112A46] underline cursor-pointer"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto shadow-sm bg-white">
          <table className="data-table min-w-[550px]">
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
                        <span className="font-bold text-xs sm:text-sm text-[#0B1B2E] truncate max-w-xs">{c.title}</span>
                      </div>
                    </td>
                    <td className="font-bold text-xs sm:text-sm text-[#112A46]">{price}</td>
                    <td className="text-xs sm:text-sm font-semibold text-[#64748B]">{c.student_count || 0}</td>
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
      )}
    </div>
  )
}
