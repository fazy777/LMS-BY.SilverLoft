"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlayIcon, CheckIcon, ChevronIcon } from '../components/Icons'
import UniversalVideoPlayer from '../components/UniversalVideoPlayer'

interface Lesson {
  id: number
  section_id: number
  title: string
  content_type: 'video' | 'text'
  duration_seconds: number
  is_preview: boolean
  video_id?: string | null
  text_content?: string
}

interface Section {
  id: number
  course_id: number
  title: string
  position: number
  lessons: Lesson[]
}

type Tab = 'info' | 'curriculum' | 'review'

const SAMPLE_DEMO_VIDEOS = [
  { label: '🎬 Next.js 16 Overview (Big Buck Bunny HD)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { label: '🚀 Architecture Deep Dive (Elephants Dream)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { label: '⚡ Performance Masterclass (For Bigger Blazes)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { label: '🛡️ Production Security (Sintel Demo)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
]

export default function InstructorCourseEditor({
  courseId,
  onBack,
}: {
  courseId: string
  onBack?: () => void
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('curriculum')
  const [course, setCourse] = useState<any>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Expanded lesson editor state
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null)
  const [lessonVideoInputs, setLessonVideoInputs] = useState<Record<number, string>>({})
  const [lessonTextInputs, setLessonTextInputs] = useState<Record<number, string>>({})
  const [uploadingLessonId, setUploadingLessonId] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // New section / lesson state
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [activeAddLessonSecId, setActiveAddLessonSecId] = useState<number | null>(null)
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonType, setNewLessonType] = useState<'video' | 'text'>('video')
  const [newLessonPreview, setNewLessonPreview] = useState(false)

  // Course info edits
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceDollars, setPriceDollars] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  const loadData = async () => {
    if (!courseId) return
    setLoading(true)
    try {
      // 1. Fetch current user (check if admin)
      fetch('/api/v1/users/me')
        .then(r => r.json())
        .then(j => {
          if (j.success && j.data) setCurrentUser(j.data)
        })
        .catch(() => {})

      // 2. Fetch Course details
      const cRes = await fetch(`/api/v1/courses/${courseId}`)
      const cJson = await cRes.json()
      if (cJson.success && cJson.data) {
        setCourse(cJson.data)
        setTitle(cJson.data.title || '')
        setDescription(cJson.data.description || '')
        setPriceDollars(String(((cJson.data.price_cents || 0) / 100).toFixed(0)))
        setThumbnailUrl(cJson.data.thumbnail_url || '')
      }

      // 3. Fetch Curriculum
      const sRes = await fetch(`/api/v1/courses/${courseId}/sections`)
      const sJson = await sRes.json()
      if (sJson.success && sJson.data?.sections) {
        setSections(sJson.data.sections)
        // Initialize inputs for lessons
        const videoMap: Record<number, string> = {}
        const textMap: Record<number, string> = {}
        for (const s of sJson.data.sections) {
          for (const l of (s.lessons || [])) {
            if (l.video_id) videoMap[l.id] = l.video_id
            if (l.text_content) textMap[l.id] = l.text_content
          }
        }
        setLessonVideoInputs(videoMap)
        setLessonTextInputs(textMap)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load course.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [courseId])

  // Save info tab changes
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    setError(null)
    try {
      const priceCents = Math.round(parseFloat(priceDollars || '0') * 100)
      const res = await fetch(`/api/v1/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          price_cents: priceCents,
          thumbnail_url: thumbnailUrl || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback('Course details updated successfully in SQL database!')
        loadData()
      } else {
        setError(json.error?.message || 'Failed to update course.')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to update course.')
    } finally {
      setSaving(false)
    }
  }

  // Create section
  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSectionTitle.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setNewSectionTitle('')
        setShowAddSection(false)
        loadData()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // Delete section
  const handleDeleteSection = async (secId: number) => {
    if (!confirm('Are you sure you want to delete this section and all its lessons?')) return
    try {
      await fetch(`/api/v1/sections/${secId}`, { method: 'DELETE' })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  // Create lesson
  const handleCreateLesson = async (secId: number) => {
    if (!newLessonTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/sections/${secId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newLessonTitle.trim(),
          content_type: newLessonType,
          is_preview: newLessonPreview,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setNewLessonTitle('')
        setActiveAddLessonSecId(null)
        loadData()
        if (json.data?.id) {
          setExpandedLessonId(json.data.id)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // Direct video file upload to Cloudinary
  const handleFileUpload = async (lessonId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLessonId(lessonId)
    setUploadProgress(`Uploading ${file.name} to Cloudinary...`)
    setError(null)
    setFeedback(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/v1/lessons/${lessonId}/video`, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (json.success && json.data?.video_url) {
        setFeedback(`✓ Video uploaded to Cloudinary successfully & saved into SQL database!`)
        setLessonVideoInputs(prev => ({ ...prev, [lessonId]: json.data.video_url }))
        loadData()
      } else {
        setError(json.error?.message || 'Video upload failed.')
      }
    } catch (err: any) {
      setError(err.message || 'Video upload to Cloudinary failed.')
    } finally {
      setUploadingLessonId(null)
      setUploadProgress(null)
    }
  }

  // Save manual Video URL to SQL database
  const handleSaveVideoUrl = async (lessonId: number) => {
    const videoUrl = lessonVideoInputs[lessonId] || ''
    if (!videoUrl.trim()) return

    setSaving(true)
    setError(null)
    setFeedback(null)

    try {
      const res = await fetch(`/api/v1/lessons/${lessonId}/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: videoUrl.trim() }),
      })

      const json = await res.json()
      if (json.success) {
        setFeedback('✓ Video link saved in SQL database!')
        loadData()
      } else {
        setError(json.error?.message || 'Failed to save video URL.')
      }
    } catch (err: any) {
      setError(err.message || 'Error saving video link.')
    } finally {
      setSaving(false)
    }
  }

  // Save lesson text content to SQL database
  const handleSaveTextContent = async (lessonId: number) => {
    const text = lessonTextInputs[lessonId] || ''
    setSaving(true)
    setError(null)
    setFeedback(null)

    try {
      const res = await fetch(`/api/v1/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text_content: text.trim() || null }),
      })

      const json = await res.json()
      if (json.success) {
        setFeedback('✓ Lesson text saved in SQL database!')
        loadData()
      } else {
        setError(json.error?.message || 'Failed to save lesson text.')
      }
    } catch (err: any) {
      setError(err.message || 'Error saving lesson text.')
    } finally {
      setSaving(false)
    }
  }

  // Submit Course for Admin Approval
  const handleSubmitForAdminReview = async () => {
    setSaving(true)
    setError(null)
    setFeedback(null)
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/submit`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setFeedback('🚀 Course submitted for Admin Review! An administrator will inspect the curriculum and publish it to the marketplace.')
        loadData()
      } else {
        setError(json.error?.message || 'Could not submit course for review.')
      }
    } catch (e: any) {
      setError(e.message || 'Error submitting course for review.')
    } finally {
      setSaving(false)
    }
  }

  // Toggle preview flag on lesson
  const handleTogglePreview = async (lesson: Lesson) => {
    try {
      await fetch(`/api/v1/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_preview: !lesson.is_preview }),
      })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  // Delete lesson
  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return
    try {
      await fetch(`/api/v1/lessons/${lessonId}`, { method: 'DELETE' })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-[#64748B] font-semibold">
        Loading course editor from SQL database...
      </div>
    )
  }

  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)
  const isReady = !!(course?.title && course?.description && course?.thumbnail_url && sections.length > 0 && totalLessons > 0)
  const isPublished = course?.status === 'published'
  const isPending = course?.status === 'pending_review'
  const isRejected = course?.status === 'rejected'
  const isAdmin = currentUser?.is_admin || currentUser?.email === 'hafizmfaizanali@gmail.com'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => (onBack ? onBack() : router.push('/instructor'))}
            className="btn btn-ghost btn-sm text-[#64748B] hover:text-[#112A46] font-bold pl-0 mb-1"
          >
            ← Back to Studio
          </button>
          <h1 className="h-display2 text-[#112A46]">
            {course?.title || 'Edit Course'}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`pill font-bold ${
            isPublished ? 'pill-success' : isPending ? 'pill-warning' : isRejected ? 'pill-danger' : 'pill-gray'
          }`}>
            Status: {course?.status?.replace('_', ' ')}
          </span>

          {/* Submit / Status action */}
          {isPending ? (
            <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-3 py-1.5 rounded-lg border border-[#FDE68A]">
              ⏳ In Admin Review Queue
            </span>
          ) : !isPublished ? (
            <button
              onClick={handleSubmitForAdminReview}
              disabled={saving || !isReady}
              className="btn btn-primary btn-sm text-xs font-bold bg-[#112A46] hover:bg-[#1A3D64] shadow-sm"
            >
              {saving ? 'Submitting...' : isRejected ? 'Re-Submit for Admin Review →' : 'Submit for Admin Review →'}
            </button>
          ) : null}

          {/* Admin shortcut if current user is admin */}
          {isAdmin && isPending && (
            <Link
              href="/admin/pending"
              className="btn btn-secondary btn-sm text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]"
            >
              🛡️ Review in Admin Panel →
            </Link>
          )}

          {/* Link to Course Player & Catalog */}
          <Link
            href={`/learn/${course?.slug || course?.id}`}
            target="_blank"
            className="btn btn-secondary btn-sm text-xs font-bold"
          >
            ▶ Preview Course Player ↗
          </Link>
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

      {/* Rejection notice if rejected */}
      {isRejected && course?.rejection_reason && (
        <div className="p-5 bg-[#FEF2F2] border-2 border-[#F87171] rounded-2xl text-sm text-[#991B1B] shadow-sm space-y-1">
          <strong className="font-bold flex items-center gap-1.5 text-base">
            ⚠️ Admin Rejection Feedback:
          </strong>
          <p className="font-medium text-xs leading-relaxed text-[#7F1D1D]">
            {course.rejection_reason}
          </p>
          <div className="text-[11px] text-[#991B1B] pt-1">
            Please make the required changes below and click <strong>&ldquo;Re-Submit for Admin Review&rdquo;</strong>.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#E2E8F0] rounded-xl">
        {[
          { key: 'info', label: '1. Course Details' },
          { key: 'curriculum', label: `2. Curriculum & Video Uploads (${sections.length} Secs, ${totalLessons} Lessons)` },
          { key: 'review', label: '3. Admin Review & Status' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === t.key ? 'bg-white text-[#112A46] shadow-sm' : 'text-[#64748B] hover:text-[#112A46]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: INFO ── */}
      {activeTab === 'info' && (
        <div className="card p-8 shadow-sm">
          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div className="field">
              <label>Course Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input"
              />
            </div>

            <div className="field">
              <label>Price (USD $)</label>
              <input
                type="number"
                value={priceDollars}
                onChange={e => setPriceDollars(e.target.value)}
                className="input"
              />
            </div>

            <div className="field">
              <label>Thumbnail URL</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                className="input"
              />
            </div>

            <div className="field">
              <label>Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="input h-auto py-3 resize-vertical"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-sm font-bold shadow-sm mt-2"
            >
              {saving ? 'Saving...' : 'Save Changes to Database'}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 2: CURRICULUM BUILDER & VIDEO UPLOADER ── */}
      {activeTab === 'curriculum' && (
        <div className="space-y-5">
          {sections.map((sec, sIdx) => (
            <div key={sec.id} className="card p-6 shadow-sm">
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">SECTION {sIdx + 1}:</span>
                  <span className="font-bold text-base text-[#112A46]">{sec.title}</span>
                </div>
                <button
                  onClick={() => handleDeleteSection(sec.id)}
                  className="text-xs font-bold text-[#DC2626] hover:underline cursor-pointer"
                >
                  Delete Section
                </button>
              </div>

              {/* Lessons in Section */}
              <div className="space-y-3 mb-4">
                {sec.lessons?.map((les, lIdx) => {
                  const isExpanded = expandedLessonId === les.id
                  const isVideo = les.content_type === 'video'
                  const hasVideo = Boolean(les.video_id)

                  return (
                    <div key={les.id} className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-xs">
                      {/* Lesson header row */}
                      <div
                        onClick={() => setExpandedLessonId(isExpanded ? null : les.id)}
                        className="flex items-center justify-between p-3.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-[#94A3B8]">{lIdx + 1}.</span>
                          <PlayIcon size={14} color="#112A46" />
                          <span className="font-bold text-sm text-[#0B1B2E] truncate">{les.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E2E8F0] text-[#475569] uppercase">
                            {les.content_type}
                          </span>
                          {isVideo && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${hasVideo ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEF3C7] text-[#D97706]'}`}>
                              {hasVideo ? '✓ Video Attached' : '⚠️ Video Needed'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <label
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] cursor-pointer mr-2"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(les.is_preview)}
                              onChange={() => handleTogglePreview(les)}
                              className="accent-[#112A46]"
                            />
                            Free Preview
                          </label>

                          <span className="text-xs font-bold text-[#64748B] hover:text-[#112A46]">
                            {isExpanded ? '▲ Close' : '▼ Manage Video & Content'}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteLesson(les.id)
                            }}
                            className="text-xs text-[#DC2626] font-bold hover:underline cursor-pointer ml-2"
                            title="Delete Lesson"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Expanded Lesson Content & Video Upload Panel */}
                      {isExpanded && (
                        <div className="p-5 border-t border-[#E2E8F0] bg-white space-y-4">
                          {isVideo ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-[#112A46] uppercase tracking-wider">
                                  Video Attachment (YouTube, Vimeo, Cloudinary, MP4)
                                </h4>
                                {hasVideo && (
                                  <span className="text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                                    ✓ Video Linked
                                  </span>
                                )}
                              </div>

                              {/* Video Player Preview if attached */}
                              {hasVideo && (
                                <div className="rounded-xl overflow-hidden aspect-video bg-black max-w-lg border border-[#CBD5E1]">
                                  <UniversalVideoPlayer
                                    videoIdOrUrl={les.video_id}
                                    title={les.title}
                                    autoPlay={false}
                                  />
                                </div>
                              )}

                              {/* Direct Video / YouTube URL Input */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#475569]">
                                  Paste YouTube URL, Vimeo URL, or Direct MP4/Cloudinary Link:
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/... or .mp4 URL"
                                    value={lessonVideoInputs[les.id] || ''}
                                    onChange={e => setLessonVideoInputs({ ...lessonVideoInputs, [les.id]: e.target.value })}
                                    className="input text-xs flex-1 h-10 bg-white"
                                  />
                                  <button
                                    onClick={() => handleSaveVideoUrl(les.id)}
                                    disabled={saving}
                                    className="btn btn-primary btn-sm text-xs font-bold shrink-0 cursor-pointer"
                                  >
                                    Save Video Link
                                  </button>
                                </div>
                              </div>

                              {/* Cloudinary File Upload Box */}
                              <div className="p-4 bg-[#F0F5FB] border border-[#ACC8E5] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                  <div className="font-bold text-sm text-[#112A46]">☁️ Or Upload Video File to Cloudinary</div>
                                  <div className="text-xs text-[#64748B] mt-0.5">
                                    Directly upload MP4, MOV, or WebM video file from your computer.
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    accept="video/*"
                                    ref={el => { fileInputRefs.current[les.id] = el }}
                                    onChange={e => handleFileUpload(les.id, e)}
                                    className="hidden"
                                    id={`file-upload-${les.id}`}
                                  />
                                  <label
                                    htmlFor={`file-upload-${les.id}`}
                                    className={`btn btn-primary btn-sm text-xs font-bold shadow-sm cursor-pointer ${uploadingLessonId === les.id ? 'opacity-50 pointer-events-none' : ''}`}
                                  >
                                    {uploadingLessonId === les.id ? 'Uploading to Cloudinary...' : '📁 Select Video File'}
                                  </label>
                                </div>
                              </div>

                              {uploadingLessonId === les.id && uploadProgress && (
                                <div className="p-3 bg-[#EAF1FA] rounded-xl text-xs font-bold text-[#112A46] animate-pulse">
                                  ⏳ {uploadProgress}
                                </div>
                              )}

                              {/* Sample Demo Videos for 1-Click Instant Testing */}
                              <div className="pt-2">
                                <span className="text-[11px] font-bold uppercase text-[#64748B] block mb-1.5">
                                  ⚡ 1-Click Demo Video Presets (Instant Playable Stream):
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {SAMPLE_DEMO_VIDEOS.map((demo, dIdx) => (
                                    <button
                                      key={dIdx}
                                      type="button"
                                      onClick={() => {
                                        setLessonVideoInputs(prev => ({ ...prev, [les.id]: demo.url }))
                                        fetch(`/api/v1/lessons/${les.id}/video`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ video_url: demo.url }),
                                        }).then(() => {
                                          setFeedback(`✓ Attached "${demo.label}" to lesson!`)
                                          loadData()
                                        })
                                      }}
                                      className="btn btn-secondary btn-sm text-[11px] font-bold py-1 px-3 h-8 bg-white border border-[#CBD5E1] hover:border-[#112A46]"
                                    >
                                      {demo.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Text Lesson Editor */
                            <div className="space-y-3">
                              <label className="text-xs font-bold text-[#475569]">
                                Lesson Notes & Text Content:
                              </label>
                              <textarea
                                rows={5}
                                placeholder="Enter lecture notes, code snippets, key takeaways..."
                                value={lessonTextInputs[les.id] || ''}
                                onChange={e => setLessonTextInputs({ ...lessonTextInputs, [les.id]: e.target.value })}
                                className="input text-xs h-auto py-2.5 bg-white resize-vertical"
                              />
                              <button
                                onClick={() => handleSaveTextContent(les.id)}
                                disabled={saving}
                                className="btn btn-primary btn-sm text-xs font-bold"
                              >
                                Save Text Content
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Add Lesson form in this section */}
              {activeAddLessonSecId === sec.id ? (
                <div className="p-4 bg-[#F1F5F9] rounded-xl space-y-3">
                  <input
                    type="text"
                    placeholder="Lesson title..."
                    value={newLessonTitle}
                    onChange={e => setNewLessonTitle(e.target.value)}
                    className="input h-10 text-sm bg-white"
                  />
                  <div className="flex gap-3 items-center flex-wrap">
                    <select
                      value={newLessonType}
                      onChange={e => setNewLessonType(e.target.value as any)}
                      className="input h-9 text-xs w-36 bg-white"
                    >
                      <option value="video">Video Lesson</option>
                      <option value="text">Text / Notes</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#334155] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newLessonPreview}
                        onChange={e => setNewLessonPreview(e.target.checked)}
                        className="accent-[#112A46]"
                      />
                      Allow Free Preview
                    </label>
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => setActiveAddLessonSecId(null)}
                        className="btn btn-secondary btn-sm text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleCreateLesson(sec.id)}
                        className="btn btn-primary btn-sm text-xs font-bold"
                      >
                        Save Lesson
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveAddLessonSecId(sec.id)
                    setNewLessonTitle('')
                  }}
                  className="btn btn-secondary btn-sm text-xs font-bold border-dashed border-[#CBD5E1]"
                >
                  + Add Lesson to Section
                </button>
              )}
            </div>
          ))}

          {/* Add Section */}
          {showAddSection ? (
            <div className="card p-5 border-2 border-[#112A46] flex gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Section title (e.g. Next.js 16 Server Components)..."
                value={newSectionTitle}
                onChange={e => setNewSectionTitle(e.target.value)}
                className="input flex-1 h-11 text-sm bg-white"
              />
              <button
                onClick={handleCreateSection}
                className="btn btn-primary btn-sm font-bold"
              >
                Save Section
              </button>
              <button
                onClick={() => setShowAddSection(false)}
                className="btn btn-secondary btn-sm font-bold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSection(true)}
              className="btn btn-secondary btn-block h-14 font-display font-bold text-sm border-2 border-dashed border-[#CBD5E1] bg-white hover:border-[#112A46]"
            >
              + Add New Curriculum Section
            </button>
          )}
        </div>
      )}

      {/* ── TAB 3: REVIEW & SUBMIT TO ADMIN ── */}
      {activeTab === 'review' && (
        <div className="card p-8 shadow-sm space-y-6">
          <div>
            <h2 className="h-card text-lg text-[#112A46] mb-1 font-bold">
              Course Status & Administrator Approval Workflow
            </h2>
            <p className="text-sm text-[#64748B] font-medium">
              Every course must undergo administrator quality verification before going live on the marketplace.
            </p>
          </div>

          {/* Readiness Checklist */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className={`font-bold ${course?.title ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{course?.title ? '✓' : '✕'}</span>
              <span className="text-[#334155]">Course Title: <strong>{course?.title || 'Missing'}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className={`font-bold ${course?.description ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{course?.description ? '✓' : '✕'}</span>
              <span className="text-[#334155]">Course Description</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className={`font-bold ${course?.thumbnail_url ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{course?.thumbnail_url ? '✓' : '✕'}</span>
              <span className="text-[#334155]">Course Thumbnail</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className={`font-bold ${sections.length > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{sections.length > 0 ? '✓' : '✕'}</span>
              <span className="text-[#334155]">Curriculum Sections: {sections.length}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className={`font-bold ${totalLessons > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{totalLessons > 0 ? '✓' : '✕'}</span>
              <span className="text-[#334155]">Total Lessons: {totalLessons}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0]">
            {isPublished ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-[#16A34A] text-sm font-bold flex items-center gap-2">
                  <span>✓</span>
                  <span>This course has been approved by administrators and is live on the marketplace!</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/courses/${course?.slug || course?.id}`}
                    target="_blank"
                    className="btn btn-primary btn-sm font-bold"
                  >
                    View Public Marketplace Page ↗
                  </Link>
                  <Link
                    href={`/learn/${course?.slug || course?.id}`}
                    target="_blank"
                    className="btn btn-secondary btn-sm font-bold"
                  >
                    ▶ Open in Video Player ↗
                  </Link>
                </div>
              </div>
            ) : isPending ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-[#D97706] text-sm font-bold space-y-1">
                  <div className="flex items-center gap-2">
                    <span>⏳</span>
                    <span>Course is currently in the Administrator Review Queue.</span>
                  </div>
                  <p className="text-xs text-[#92400E] font-normal">
                    Administrators inspect curriculum completeness, video resolution, and audio quality before publishing.
                  </p>
                </div>
                {isAdmin && (
                  <Link
                    href="/admin/pending"
                    className="btn btn-primary btn-sm font-bold bg-[#D97706] hover:bg-[#B45309]"
                  >
                    🛡️ Open Admin Review Queue to Approve This Course →
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleSubmitForAdminReview}
                  disabled={saving || !isReady}
                  className="btn btn-primary font-bold shadow-md text-sm px-8 h-12 bg-[#112A46] hover:bg-[#1A3D64]"
                >
                  {saving ? 'Submitting to Queue...' : isRejected ? 'Re-Submit Course for Admin Review →' : '🚀 Submit Course for Admin Review →'}
                </button>
                {!isReady && (
                  <p className="text-xs text-[#DC2626] font-medium">
                    ⚠️ Complete all checklist items above (title, description, thumbnail, and at least 1 section with lessons) to submit.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
