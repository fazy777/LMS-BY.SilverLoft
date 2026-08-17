"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlayIcon, CheckIcon } from '../components/Icons'

interface PendingCourse {
  id: number
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  price_cents: number
  category?: { id: number; name: string }
  instructor?: { id: number; display_name: string; email?: string }
  updated_at?: string
  lessons_count?: number
  hours_count?: number
}

export default function AdminPendingCourses({ onBack }: { onBack?: () => void }) {
  const router = useRouter()
  const [courses, setCourses] = useState<PendingCourse[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<PendingCourse | null>(null)
  const [sections, setSections] = useState<any[]>([])
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null)
  const [loadingCurriculum, setLoadingCurriculum] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch live pending courses from SQL
      const res = await fetch('/api/v1/admin/courses/pending')
      const json = await res.json()
      if (json.success && Array.isArray(json.data?.courses)) {
        setCourses(json.data.courses)
        if (json.data.courses.length > 0) {
          const firstCourse = json.data.courses[0]
          setSelectedCourse(firstCourse)
          handleInspect(firstCourse)
        } else {
          setSelectedCourse(null)
          setSections([])
          setSelectedLesson(null)
        }
      }

      // 2. Fetch live admin analytics from SQL
      const aRes = await fetch('/api/v1/admin/analytics')
      const aJson = await aRes.json()
      if (aJson.success && aJson.data) {
        setAnalytics(aJson.data)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load pending queue from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInspect = async (c: PendingCourse) => {
    setSelectedCourse(c)
    setSelectedLesson(null)
    setLoadingCurriculum(true)
    try {
      const res = await fetch(`/api/v1/courses/${c.id}/sections`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data?.sections)) {
        setSections(json.data.sections)
        // Select first lesson if available
        if (json.data.sections.length > 0 && json.data.sections[0].lessons?.length > 0) {
          setSelectedLesson(json.data.sections[0].lessons[0])
        }
      } else {
        setSections([])
      }
    } catch (e) {
      setSections([])
    } finally {
      setLoadingCurriculum(false)
    }
  }

  const handleApprove = async (courseId: number) => {
    setSubmitting(true)
    setFeedback(null)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/courses/${courseId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'approve' }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback(`✓ "${selectedCourse?.title || 'Course'}" approved and published to the marketplace catalog!`)
        loadData()
      } else {
        setError(json.error?.message || 'Failed to approve course.')
      }
    } catch (e: any) {
      setError(e.message || 'Error approving course.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedCourse || !rejectionReason.trim()) return
    setSubmitting(true)
    setFeedback(null)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/courses/${selectedCourse.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'reject', rejection_reason: rejectionReason.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback(`✓ Course rejected with feedback sent to instructor: "${rejectionReason.trim()}"`)
        setRejectModal(false)
        setRejectionReason('')
        loadData()
      } else {
        setError(json.error?.message || 'Failed to reject course.')
      }
    } catch (e: any) {
      setError(e.message || 'Error rejecting course.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCents = (cents: number | undefined) => `$${((cents || 0) / 100).toFixed(2)}`

  return (
    <div className="space-y-8">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => (onBack ? onBack() : router.push('/admin'))}
            className="btn btn-ghost btn-sm text-[#64748B] hover:text-[#112A46] font-bold pl-0 mb-1"
          >
            ← Back to Admin Portal
          </button>
          <h1 className="h-display2 text-[#112A46]">Course Review & Quality Gate Queue</h1>
          <p className="text-sm text-[#64748B] mt-1 font-medium">
            Evaluate instructor submissions, inspect curriculum completeness, and verify video resolution and audio quality.
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn btn-secondary btn-sm text-xs font-bold"
        >
          🔄 Refresh Queue
        </button>
      </div>

      {/* ── KPI Stat Cards (Real Live Analytics from SQL) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stat-card">
          <div className="text-xs uppercase font-bold tracking-wider text-[#64748B]">Platform Revenue</div>
          <div className="stat-num mt-1 text-[#112A46]">
            {analytics?.revenue?.platform_revenue_cents ? formatCents(analytics.revenue.platform_revenue_cents) : '$0.00'}
          </div>
          <div className="text-xs text-[#16A34A] mt-1 font-semibold">✓ 15% platform commission margin</div>
        </div>

        <div className="stat-card">
          <div className="text-xs uppercase font-bold tracking-wider text-[#64748B]">Gross Sales Volume</div>
          <div className="stat-num mt-1 text-[#16A34A]">
            {analytics?.revenue?.gmv_cents ? formatCents(analytics.revenue.gmv_cents) : '$0.00'}
          </div>
          <div className="text-xs text-[#64748B] mt-1">Total student GMV</div>
        </div>

        <div className="stat-card">
          <div className="text-xs uppercase font-bold tracking-wider text-[#64748B]">Registered Accounts</div>
          <div className="stat-num mt-1 text-[#112A46]">
            {analytics?.users?.total || 0}
          </div>
          <div className="text-xs text-[#64748B] mt-1">Verified user pool</div>
        </div>

        <div className="stat-card">
          <div className="text-xs uppercase font-bold tracking-wider text-[#64748B]">Pending Review</div>
          <div className="stat-num mt-1 text-[#D97706]">
            {courses.length}
          </div>
          <div className="text-xs text-[#D97706] mt-1 font-semibold">Awaiting administrator decision</div>
        </div>
      </div>

      {/* Feedback / Error notices */}
      {feedback && (
        <div className="p-4 bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] rounded-xl text-sm font-bold shadow-sm">
          {feedback}
        </div>
      )}
      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] rounded-xl text-sm font-bold shadow-sm">
          {error}
        </div>
      )}

      {/* ── 2-Column Inspector Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Left: Queue List */}
        <div className="card overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E2E8F0] font-bold text-sm text-[#112A46] bg-[#F8FAFC] flex justify-between items-center">
            <span>Pending Submissions ({courses.length})</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] font-bold">SQL Live</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-semibold text-[#64748B]">
              Loading review queue...
            </div>
          ) : courses.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="text-3xl">🎉</div>
              <div className="font-bold text-sm text-[#112A46]">All Caught Up!</div>
              <div className="text-xs text-[#64748B]">There are no courses currently pending review.</div>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9] max-h-[600px] overflow-y-auto">
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => handleInspect(c)}
                    className={`p-4 flex gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#EAF1FA] border-l-4 border-l-[#112A46]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <img
                      src={c.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=80&fit=crop'}
                      alt=""
                      className="w-16 h-11 rounded-lg object-cover shrink-0 border border-[#CBD5E1]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-[#0B1B2E] truncate">{c.title}</div>
                      <div className="text-[11.5px] text-[#64748B] mt-0.5 font-medium">
                        by {c.instructor?.display_name || 'Instructor'} • {formatCents(c.price_cents)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Inspector Detail View */}
        {selectedCourse ? (
          <div className="card p-7 shadow-sm space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Course ID #{selectedCourse.id} • Category: {selectedCourse.category?.name || 'General'}
                </span>
                <h2 className="h-card text-xl text-[#112A46] font-bold leading-snug">{selectedCourse.title}</h2>
                <div className="text-xs text-[#64748B] mt-1 font-medium">
                  Instructor: <strong className="text-[#0B1B2E]">{selectedCourse.instructor?.display_name || 'Instructor'}</strong> • Price: <strong className="text-[#16A34A]">{formatCents(selectedCourse.price_cents)}</strong>
                </div>
              </div>
              <span className="pill pill-warning shrink-0 font-bold">Pending Review ⏳</span>
            </div>

            {/* Description */}
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#334155] leading-relaxed">
              <strong className="text-[#112A46] block mb-1">Overview Description:</strong>
              {selectedCourse.description || 'No description provided.'}
            </div>

            {/* Interactive Admin Video Quality Inspector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-[#112A46] uppercase tracking-wider">
                  🎬 Video Quality & Streaming Inspector
                </h3>
                {selectedLesson && (
                  <span className="text-xs text-[#64748B] font-semibold">
                    Inspecting: <strong className="text-[#112A46]">{selectedLesson.title}</strong>
                  </span>
                )}
              </div>

              <div className="w-full bg-black rounded-2xl overflow-hidden aspect-video border border-[#CBD5E1] relative flex items-center justify-center">
                {selectedLesson?.video_id ? (
                  <video
                    key={selectedLesson.video_id}
                    src={selectedLesson.video_id}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-white/70 space-y-2">
                    <div className="text-3xl">🎥</div>
                    <div className="text-xs font-bold">Select a video lesson below to test playback and inspect quality</div>
                  </div>
                )}
              </div>
            </div>

            {/* Curriculum Breakdown */}
            <div>
              <h3 className="h-card text-sm text-[#112A46] mb-3 font-bold">
                Submitted Curriculum Structure ({sections.length} Sections)
              </h3>

              {loadingCurriculum ? (
                <div className="text-xs font-semibold text-[#64748B] py-4">Loading curriculum...</div>
              ) : sections.length === 0 ? (
                <div className="p-4 bg-[#FEE2E2] rounded-xl text-xs text-[#DC2626] font-bold">
                  ⚠️ No curriculum sections or lessons found in this course.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {sections.map((sec, idx) => (
                    <div key={sec.id} className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-[#112A46]">
                        <span>Section {idx + 1}: {sec.title}</span>
                        <span className="text-[#64748B] font-semibold">{sec.lessons?.length || 0} lessons</span>
                      </div>

                      {sec.lessons && sec.lessons.length > 0 && (
                        <div className="divide-y divide-[#E2E8F0] bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
                          {sec.lessons.map((les: any, lIdx: number) => {
                            const isSelectedLesson = selectedLesson?.id === les.id
                            return (
                              <div
                                key={les.id}
                                onClick={() => setSelectedLesson(les)}
                                className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                  isSelectedLesson ? 'bg-[#EAF1FA] font-bold text-[#112A46]' : 'hover:bg-[#F8FAFC] text-[#334155]'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <PlayIcon size={12} color={isSelectedLesson ? '#112A46' : '#94A3B8'} />
                                  <span className="truncate">{lIdx + 1}. {les.title}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#E2E8F0] text-[#475569]">
                                    {les.content_type}
                                  </span>
                                  <span className="text-[11px] text-[#16A34A] font-bold">
                                    {les.video_id ? '▶ Play' : 'No Video'}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-[#E2E8F0] flex-wrap">
              <button
                onClick={() => handleApprove(selectedCourse.id)}
                disabled={submitting}
                className="btn btn-primary flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold h-12 text-sm shadow-md"
              >
                {submitting ? 'Processing...' : '✓ Approve & Publish Course to Catalog'}
              </button>

              <button
                onClick={() => setRejectModal(true)}
                disabled={submitting}
                className="btn btn-danger-ghost flex-1 border-2 border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] font-bold h-12 text-sm"
              >
                ✕ Reject Course with Feedback
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-16 text-center text-[#64748B] font-medium shadow-sm">
            <div className="text-3xl mb-2">📋</div>
            <div className="font-bold text-sm text-[#112A46]">Select a course from the queue</div>
            <p className="text-xs text-[#64748B] mt-1">
              Select any pending submission from the left panel to inspect the curriculum and test video playback.
            </p>
          </div>
        )}
      </div>

      {/* ── Rejection Feedback Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-[#0B1B2E]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card modal-surface p-8 max-w-lg w-full bg-white shadow-2xl">
            <h3 className="h-card text-lg text-[#DC2626] mb-2 font-bold">Reject Course Submission</h3>
            <p className="text-xs text-[#64748B] mb-4 font-medium">
              Specify the revisions, audio/video adjustments, or curriculum depth required before this course can be approved.
            </p>

            <textarea
              rows={4}
              placeholder="e.g. Please re-upload Lesson 2 with 1080p resolution and provide code resources in the final module..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="input h-auto p-3 text-sm mb-5 bg-white resize-vertical"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModal(false)}
                className="btn btn-secondary btn-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
                className="btn btn-primary btn-sm bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold"
              >
                {submitting ? 'Submitting...' : 'Submit Rejection Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
