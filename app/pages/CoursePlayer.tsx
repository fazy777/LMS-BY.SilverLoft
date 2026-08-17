"use client"
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckIcon, PlayIcon, LockIcon, ChevronIcon } from '../components/Icons'
import { CoursePlayerSkeleton } from '../components/CourseSkeleton'

interface Lesson {
  id: number
  section_id: number
  title: string
  content_type: 'video' | 'text'
  video_id?: string | null
  duration_seconds?: number
  position?: number
  is_preview?: boolean
  text_content?: string
}

interface Section {
  id: number
  course_id: number
  title: string
  position: number
  lessons: Lesson[]
}

const DUMMY_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
]

const DEFAULT_SECTIONS: Section[] = [
  {
    id: 1,
    course_id: 1,
    title: 'Getting Started & Architecture Setup',
    position: 1,
    lessons: [
      { id: 101, section_id: 1, title: 'Welcome & Course Roadmap', content_type: 'video', video_id: DUMMY_VIDEOS[0], duration_seconds: 252, is_preview: true },
      { id: 102, section_id: 1, title: 'Setting Up Your Dev Environment', content_type: 'video', video_id: DUMMY_VIDEOS[1], duration_seconds: 585, is_preview: true },
      { id: 103, section_id: 1, title: 'Starter Project Architecture & Dependencies', content_type: 'text', duration_seconds: 180, is_preview: false, text_content: 'In this section we review the folder structure of the application, configure environment variables for SQL and Cloudinary, and ensure all dependencies are locked and tested.' },
    ]
  },
  {
    id: 2,
    course_id: 1,
    title: 'Core Fundamentals & Deep Dive',
    position: 2,
    lessons: [
      { id: 201, section_id: 2, title: 'App Router Deep Dive & Layout Trees', content_type: 'video', video_id: DUMMY_VIDEOS[2], duration_seconds: 1330, is_preview: false },
      { id: 202, section_id: 2, title: 'Server vs Client Component Boundaries', content_type: 'video', video_id: DUMMY_VIDEOS[3], duration_seconds: 1083, is_preview: false, text_content: 'In this lesson we break down when to reach for a Server Component versus a Client Component, and how that decision shapes data fetching, bundle size, and interactivity throughout the app.' },
      { id: 203, section_id: 2, title: 'Data Fetching & Cache Invalidation Patterns', content_type: 'video', video_id: DUMMY_VIDEOS[4], duration_seconds: 1600, is_preview: false },
    ]
  },
  {
    id: 3,
    course_id: 1,
    title: 'Building & Deploying the Production App',
    position: 3,
    lessons: [
      { id: 301, section_id: 3, title: 'Database Schema & Transactional Mutations', content_type: 'video', video_id: DUMMY_VIDEOS[5], duration_seconds: 1120, is_preview: false },
      { id: 302, section_id: 3, title: 'Secure Authentication & Session Management', content_type: 'video', video_id: DUMMY_VIDEOS[6], duration_seconds: 1875, is_preview: false },
      { id: 303, section_id: 3, title: 'Production Cloud Deployment & Monitoring', content_type: 'video', video_id: DUMMY_VIDEOS[7], duration_seconds: 728, is_preview: false },
    ]
  }
]

export function resolveVideoUrl(videoId?: string | null, fallbackIndex = 0): string {
  if (!videoId || videoId.trim() === '') {
    return DUMMY_VIDEOS[fallbackIndex % DUMMY_VIDEOS.length]
  }
  const clean = videoId.trim()
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean
  }
  if (clean.startsWith('lms/') || clean.startsWith('upload-') || clean.startsWith('lesson-')) {
    return `https://res.cloudinary.com/ss3mteu4/video/upload/${clean}.mp4`
  }
  if (clean.startsWith('sample-video')) {
    return DUMMY_VIDEOS[fallbackIndex % DUMMY_VIDEOS.length]
  }
  return clean
}

export default function CoursePlayer({
  slug,
  onBack,
}: {
  slug: string
  onBack?: () => void
}) {
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set([101]))
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!slug) return

    const formattedTitle = slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase())

    const fallbackCourse = { title: formattedTitle || 'Course Player', slug }

    Promise.allSettled([
      fetch(`/api/v1/courses/${slug}`).then(r => r.json()),
      fetch(`/api/v1/courses/${slug}/sections`).then(r => r.json()),
      fetch('/api/v1/enrollments').then(r => r.json()),
    ]).then(([courseRes, sectionsRes, enrollmentsRes]) => {
      // 1. Course Details
      if (courseRes.status === 'fulfilled' && courseRes.value?.success && courseRes.value?.data) {
        setCourse(courseRes.value.data)
      } else {
        setCourse(fallbackCourse)
      }

      // 2. Sections & Lessons
      if (sectionsRes.status === 'fulfilled' && sectionsRes.value?.success && Array.isArray(sectionsRes.value?.data?.sections) && sectionsRes.value.data.sections.length > 0) {
        const secs = sectionsRes.value.data.sections as Section[]
        setSections(secs)
        if (secs.length > 0 && secs[0].lessons?.length > 0) {
          setActiveLesson(secs[0].lessons[0])
        }
      } else {
        setSections(DEFAULT_SECTIONS)
        setActiveLesson(DEFAULT_SECTIONS[0].lessons[0])
      }

      // 3. User enrollments
      if (enrollmentsRes.status === 'fulfilled' && enrollmentsRes.value?.success && Array.isArray(enrollmentsRes.value?.data?.enrollments)) {
        const enr = enrollmentsRes.value.data.enrollments.find((e: any) => e.course?.slug === slug || String(e.course?.id) === String(slug))
        if (enr) setEnrollmentId(enr.id)
      }

      setLoading(false)
    }).catch(() => {
      setCourse(fallbackCourse)
      setSections(DEFAULT_SECTIONS)
      setActiveLesson(DEFAULT_SECTIONS[0].lessons[0])
      setLoading(false)
    })
  }, [slug])

  // Flatten lessons list for Next / Prev navigation
  const allLessons = sections.flatMap(s => s.lessons || [])
  const currentIdx = allLessons.findIndex(l => l.id === activeLesson?.id)

  const handleNext = () => {
    if (currentIdx >= 0 && currentIdx < allLessons.length - 1) {
      setActiveLesson(allLessons[currentIdx + 1])
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) {
      setActiveLesson(allLessons[currentIdx - 1])
    }
  }

  const handleMarkComplete = async () => {
    if (!activeLesson) return

    setCompletedLessonIds(prev => {
      const next = new Set(prev)
      if (next.has(activeLesson.id)) {
        next.delete(activeLesson.id)
      } else {
        next.add(activeLesson.id)
      }
      return next
    })

    if (enrollmentId) {
      try {
        await fetch(`/api/v1/enrollments/${enrollmentId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: activeLesson.id }),
        })
      } catch (err) {
        console.error('Failed to sync progress:', err)
      }
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  if (loading) {
    return <CoursePlayerSkeleton />
  }

  const isCompleted = activeLesson ? completedLessonIds.has(activeLesson.id) : false
  const progressPercent = allLessons.length > 0 ? Math.round((completedLessonIds.size / allLessons.length) * 100) : 0
  const activeVideoUrl = resolveVideoUrl(activeLesson?.video_id, currentIdx >= 0 ? currentIdx : 0)

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1B2E] text-white">
      {/* ── TOP THEATER HEADER ── */}
      <header className="h-16 flex items-center gap-4 px-6 bg-[#112A46] border-b border-white/15 shrink-0 z-20">
        <button
          onClick={() => (onBack ? onBack() : router.push('/dashboard'))}
          className="btn btn-ghost btn-sm text-[#C9D9EA] hover:text-white font-bold"
        >
          ← Exit to Dashboard
        </button>

        <div className="h-5 w-px bg-white/20 hidden sm:block" />

        <div className="font-display font-bold text-sm text-white truncate max-w-md hidden sm:block">
          {course?.title || 'Course Player'}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-[#ACC8E5]">{progressPercent}% complete</span>
            <div className="w-24 h-2 bg-white/25 rounded-full overflow-hidden">
              <div className="h-full bg-[#16A34A] transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost btn-sm text-xs font-bold text-[#ACC8E5] border border-white/20 hover:border-white/40"
          >
            {sidebarOpen ? 'Hide Playlist' : 'Show Playlist'}
          </button>
        </div>
      </header>

      {/* ── MAIN STAGE (Player + Playlist Sidebar) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Player & Lesson Notes */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#0B1B2E]">
          {/* Video Theater Screen */}
          {activeLesson?.content_type === 'video' ? (
            <div className="w-full bg-black flex flex-col items-center justify-center relative shrink-0 border-b border-white/10">
              <div className="w-full max-w-5xl aspect-video bg-black relative">
                <video
                  ref={videoRef}
                  key={activeVideoUrl}
                  src={activeVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  onEnded={() => {
                    if (activeLesson) {
                      setCompletedLessonIds(prev => new Set(prev).add(activeLesson.id))
                    }
                  }}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Speed Controls Bar */}
              <div className="w-full max-w-5xl py-2 px-4 bg-[#071524] flex items-center justify-between text-xs text-[#ACC8E5]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white/70">Playback Speed:</span>
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${playbackSpeed === spd ? 'bg-[#ACC8E5] text-[#112A46]' : 'text-[#ACC8E5] hover:bg-white/10'}`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#64748B]">Streaming via SQL Video Link / CDN</span>
                </div>
              </div>
            </div>
          ) : (
            /* Text Lesson Header Card */
            <div className="w-full bg-gradient-to-r from-[#112A46] to-[#071524] p-8 border-b border-white/10">
              <div className="max-w-3xl">
                <span className="pill pill-tint text-[10px] uppercase font-bold mb-2">
                  📖 Text-Based Lecture & Study Guide
                </span>
                <h2 className="h-display2 text-white mt-1">
                  {activeLesson?.title}
                </h2>
              </div>
            </div>
          )}

          {/* Lesson Details & Text Notes */}
          <div className="bg-white text-[#0B1B2E] p-8 md:p-10 flex-1">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="pill pill-tint text-[10px] uppercase font-bold">
                  {activeLesson?.content_type || 'video'} lesson
                </span>
                {activeLesson?.is_preview && (
                  <span className="pill pill-success text-[10px] uppercase font-bold">
                    Free Preview
                  </span>
                )}
              </div>

              <h1 className="h-display2 text-[#112A46] mb-4">
                {activeLesson?.title || 'Lesson Overview'}
              </h1>

              <div className="text-[#334155] text-base leading-relaxed space-y-4">
                {activeLesson?.text_content ? (
                  <div className="whitespace-pre-line bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] font-sans">
                    {activeLesson.text_content}
                  </div>
                ) : (
                  <p>
                    In this lesson we break down core design patterns, architectural trade-offs, and implementation strategies. Follow along with the instructor and verify each step in your local environment.
                  </p>
                )}

                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#475569] leading-relaxed">
                  <strong className="text-[#112A46]">💡 Pro Tip:</strong> Complete each section checkpoint and test your code locally before continuing to the next module.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Navigation Toolbar */}
          <div className="bg-white border-t border-[#E2E8F0] px-8 py-4 flex items-center justify-between shrink-0">
            <button
              onClick={handlePrev}
              disabled={currentIdx <= 0}
              className="btn btn-secondary btn-sm font-bold"
            >
              ← Previous Lesson
            </button>

            <button
              onClick={handleMarkComplete}
              className={`btn btn-sm font-bold ${isCompleted ? 'btn-primary bg-[#16A34A] hover:bg-[#15803D]' : 'btn-primary'}`}
            >
              {isCompleted ? '✓ Completed' : 'Mark as Complete'}
            </button>

            <button
              onClick={handleNext}
              disabled={currentIdx >= allLessons.length - 1}
              className="btn btn-secondary btn-sm font-bold"
            >
              Next Lesson →
            </button>
          </div>
        </main>

        {/* Right: Course Content Curriculum Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 md:w-96 bg-white text-[#0B1B2E] border-l border-[#E2E8F0] overflow-y-auto flex flex-col shrink-0">
            <div className="p-5 border-b border-[#E2E8F0] font-bold text-sm text-[#112A46] bg-[#F8FAFC] flex justify-between items-center">
              <span>Curriculum ({allLessons.length} lessons)</span>
              <span className="text-xs font-semibold text-[#16A34A]">{completedLessonIds.size}/{allLessons.length} done</span>
            </div>

            <div className="flex-1">
              {sections.map((sec, sIdx) => (
                <div key={sec.id} className="border-b border-[#F1F5F9] last:border-none">
                  <div className="px-5 py-3 bg-[#F8FAFC] font-bold text-xs text-[#475569] uppercase tracking-wider border-b border-[#E2E8F0]">
                    Section {sIdx + 1}: {sec.title}
                  </div>
                  <div>
                    {sec.lessons?.map((les) => {
                      const isActive = activeLesson?.id === les.id
                      const done = completedLessonIds.has(les.id)
                      return (
                        <div
                          key={les.id}
                          onClick={() => setActiveLesson(les)}
                          className={`flex items-center gap-3 px-5 py-3.5 border-b border-[#F1F5F9] last:border-none cursor-pointer transition-colors text-sm ${
                            isActive ? 'bg-[#EAF1FA] font-bold text-[#112A46] border-l-4 border-l-[#112A46]' : 'hover:bg-[#F8FAFC] text-[#334155]'
                          }`}
                        >
                          {done ? (
                            <span className="text-[#16A34A] font-bold text-sm shrink-0">✓</span>
                          ) : (
                            <PlayIcon size={14} color={isActive ? '#112A46' : '#94A3B8'} />
                          )}
                          <span className="truncate flex-1 font-medium">{les.title}</span>
                          <span className="text-[11px] text-[#64748B] shrink-0 font-mono font-semibold">
                            {les.duration_seconds ? `${Math.floor(les.duration_seconds / 60)}m` : 'Read'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
