"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckIcon, PlayIcon, LockIcon, StarIcon, ChevronIcon, ClockIcon } from '../components/Icons'
import CourseSkeleton from '../components/CourseSkeleton'

interface Lesson {
  id: number
  section_id: number
  title: string
  content_type: 'video' | 'text'
  duration_seconds?: number
  position: number
  is_preview: boolean
  text_content?: string
}

interface Section {
  id: number
  course_id: number
  title: string
  position: number
  lessons: Lesson[]
}

interface Review {
  id: number
  rating: number
  comment: string
  created_at: string
  reviewer: { display_name: string; avatar_url?: string }
}

interface CourseDetail {
  id: number
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  price_cents: number
  currency?: string
  avg_rating?: number | null
  review_count?: number
  category?: { id: number; name: string; slug: string }
  instructor?: { id: number; display_name: string }
  created_at?: string
}

const FALLBACK_COURSES: CourseDetail[] = [
  { id: 1, title: 'The Complete Next.js 16 Developer Course', slug: 'nextjs-16-developer-course', category: { id: 1, name: 'Development', slug: 'development' }, instructor: { id: 1, display_name: 'Marta Coelho' }, avg_rating: 4.8, review_count: 12480, price_cents: 6499, description: 'A complete, project-based path covering App Router fundamentals through advanced enterprise architecture — built for developers who learn by shipping real production software.', thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=720&h=405&fit=crop' },
  { id: 2, title: 'UI/UX Design Foundations: From Wireframe to Prototype', slug: 'ui-ux-design-foundations', category: { id: 2, name: 'Design', slug: 'design' }, instructor: { id: 2, display_name: 'Owen Faraday' }, avg_rating: 4.7, review_count: 8341, price_cents: 4999, description: 'Master Figma, wireframing, high-fidelity UI design, component systems, and interactive prototyping from an experienced product designer.', thumbnail_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=720&h=405&fit=crop' },
  { id: 3, title: 'Financial Modeling & Valuation for Startups', slug: 'financial-modeling-startups', category: { id: 3, name: 'Business', slug: 'business' }, instructor: { id: 3, display_name: 'Priya Nandakumar' }, avg_rating: 4.6, review_count: 5210, price_cents: 7499, description: 'Learn unit economics, DCF valuation, runway projections, and investor-ready financial model construction.', thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=720&h=405&fit=crop' },
  { id: 4, title: 'Growth Marketing: Funnels, SEO & Paid Acquisition', slug: 'growth-marketing-funnels', category: { id: 4, name: 'Marketing', slug: 'marketing' }, instructor: { id: 4, display_name: 'Diego Santoro' }, avg_rating: 4.5, review_count: 3987, price_cents: 5499, description: 'Build high-converting conversion funnels, execute organic search strategies, and scale profitable paid advertising campaigns.', thumbnail_url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=720&h=405&fit=crop' },
  { id: 5, title: 'Python for Data Science and Machine Learning', slug: 'python-data-science-machine-learning', category: { id: 5, name: 'Data Science', slug: 'data-science' }, instructor: { id: 5, display_name: 'Hana Ishikawa' }, avg_rating: 4.9, review_count: 21032, price_cents: 6999, description: 'From NumPy and Pandas to Scikit-Learn and neural networks: real projects in predictive modeling and analysis.', thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=720&h=405&fit=crop' },
  { id: 6, title: 'Portrait Photography: Studio Lighting Masterclass', slug: 'portrait-photography-lighting', category: { id: 6, name: 'Photography', slug: 'photography' }, instructor: { id: 6, display_name: 'Lucas Reyes' }, avg_rating: 4.7, review_count: 2765, price_cents: 3999, description: 'Learn professional lighting setups, light shaping, posing techniques, and Lightroom/Photoshop color grading.', thumbnail_url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=720&h=405&fit=crop' },
  { id: 7, title: 'Advanced TypeScript: Architecture & Design Patterns', slug: 'advanced-typescript-architecture', category: { id: 1, name: 'Development', slug: 'development' }, instructor: { id: 1, display_name: 'Marta Coelho' }, avg_rating: 4.8, review_count: 6120, price_cents: 5999, description: 'Deep dive into conditional types, template literal types, domain modeling, and enterprise TypeScript best practices.', thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=720&h=405&fit=crop' },
  { id: 8, title: 'Brand Identity Design with Figma', slug: 'brand-identity-figma', category: { id: 2, name: 'Design', slug: 'design' }, instructor: { id: 2, display_name: 'Owen Faraday' }, avg_rating: 4.6, review_count: 4108, price_cents: 4499, description: 'Build complete brand guideline kits, custom typography systems, and iconic logo presentations in Figma.', thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=720&h=405&fit=crop' },
]

const DEFAULT_SECTIONS: Section[] = [
  {
    id: 1,
    course_id: 1,
    title: 'Getting Started & Architecture Setup',
    position: 1,
    lessons: [
      { id: 101, section_id: 1, title: 'Welcome & Course Roadmap', content_type: 'video', duration_seconds: 252, is_preview: true, position: 1 },
      { id: 102, section_id: 1, title: 'Setting Up Your Dev Environment', content_type: 'video', duration_seconds: 585, is_preview: true, position: 2 },
      { id: 103, section_id: 1, title: 'Starter Project Architecture & Dependencies', content_type: 'text', duration_seconds: 180, is_preview: false, position: 3 },
    ]
  },
  {
    id: 2,
    course_id: 1,
    title: 'Core Fundamentals & Deep Dive',
    position: 2,
    lessons: [
      { id: 201, section_id: 2, title: 'App Router Deep Dive & Layout Trees', content_type: 'video', duration_seconds: 1330, is_preview: false, position: 1 },
      { id: 202, section_id: 2, title: 'Server Components vs Client Boundaries', content_type: 'video', duration_seconds: 1083, is_preview: false, position: 2 },
      { id: 203, section_id: 2, title: 'Data Fetching & Cache Invalidation Patterns', content_type: 'video', duration_seconds: 1600, is_preview: false, position: 3 },
      { id: 204, section_id: 2, title: 'Checkpoint Quiz: Fundamentals Assessment', content_type: 'text', duration_seconds: 600, is_preview: false, position: 4 },
    ]
  },
  {
    id: 3,
    course_id: 1,
    title: 'Building & Deploying the Production App',
    position: 3,
    lessons: [
      { id: 301, section_id: 3, title: 'Database Schema & Transactional Mutations', content_type: 'video', duration_seconds: 1120, is_preview: false, position: 1 },
      { id: 302, section_id: 3, title: 'Secure Authentication & Session Management', content_type: 'video', duration_seconds: 1875, is_preview: false, position: 2 },
      { id: 303, section_id: 3, title: 'Production Cloud Deployment & Monitoring', content_type: 'video', duration_seconds: 728, is_preview: false, position: 3 },
    ]
  }
]

const DEFAULT_REVIEWS: Review[] = [
  { id: 1, rating: 5, comment: 'Hands down the best comprehensive Next.js course on the market. Real production patterns instead of toy examples.', created_at: new Date().toISOString(), reviewer: { display_name: 'David Chen' } },
  { id: 2, rating: 5, comment: 'The section on Server Components and caching saved our team weeks of debugging in production.', created_at: new Date().toISOString(), reviewer: { display_name: 'Elena Rostova' } },
  { id: 3, rating: 4, comment: 'Very well paced and straight to the point. The exercises were challenging and relevant.', created_at: new Date().toISOString(), reviewer: { display_name: 'Marcus Bell' } },
]

export default function CoursePage({
  slug,
  onBack,
}: {
  slug: string
  onBack?: () => void
}) {
  const router = useRouter()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [directEnrolling, setDirectEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: true })

  useEffect(() => {
    if (!slug) return

    const formattedTitle = slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())

    const matchedFallback = FALLBACK_COURSES.find(
      c => c.slug === slug || String(c.id) === String(slug)
    ) || {
      id: 1,
      title: formattedTitle || 'The Complete Next.js 16 Developer Course',
      slug: slug,
      description: 'A complete, project-based path covering core fundamentals through advanced enterprise architecture — built for developers who learn by shipping real production software.',
      thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=720&h=405&fit=crop',
      price_cents: 6499,
      avg_rating: 4.8,
      review_count: 12480,
      category: { id: 1, name: 'Development', slug: 'development' },
      instructor: { id: 1, display_name: 'Marta Coelho' },
      created_at: new Date().toISOString(),
    }

    Promise.allSettled([
      fetch(`/api/v1/courses/${slug}`).then(r => r.json()),
      fetch(`/api/v1/courses/${slug}/sections`).then(r => r.json()),
      fetch(`/api/v1/courses/${slug}/reviews`).then(r => r.json()),
      fetch('/api/v1/enrollments').then(r => r.json()),
    ]).then(([courseRes, sectionsRes, reviewsRes, enrollmentsRes]) => {
      // 1. Course Detail
      if (courseRes.status === 'fulfilled' && courseRes.value?.success && courseRes.value?.data) {
        setCourse(courseRes.value.data)
      } else {
        setCourse(matchedFallback)
      }

      // 2. Sections & Lessons
      if (sectionsRes.status === 'fulfilled' && sectionsRes.value?.success && Array.isArray(sectionsRes.value?.data?.sections) && sectionsRes.value.data.sections.length > 0) {
        setSections(sectionsRes.value.data.sections)
        const initialOpen: Record<number, boolean> = {}
        sectionsRes.value.data.sections.forEach((s: Section, idx: number) => {
          if (idx === 0) initialOpen[s.id] = true
        })
        setOpenSections(initialOpen)
      } else {
        setSections(DEFAULT_SECTIONS)
        setOpenSections({ 1: true })
      }

      // 3. Reviews
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value?.success && Array.isArray(reviewsRes.value?.data?.reviews) && reviewsRes.value.data.reviews.length > 0) {
        setReviews(reviewsRes.value.data.reviews)
      } else {
        setReviews(DEFAULT_REVIEWS)
      }

      // 4. Enrollment status
      if (enrollmentsRes.status === 'fulfilled' && enrollmentsRes.value?.success && Array.isArray(enrollmentsRes.value?.data?.enrollments)) {
        const already = enrollmentsRes.value.data.enrollments.some(
          (e: any) => e.course?.slug === slug || String(e.course?.id) === String(slug)
        )
        if (already) setIsEnrolled(true)
      }

      setLoading(false)
    }).catch(() => {
      setCourse(matchedFallback)
      setSections(DEFAULT_SECTIONS)
      setReviews(DEFAULT_REVIEWS)
      setLoading(false)
    })
  }, [slug])

  const toggleSection = (id: number) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleEnrollStripe = async () => {
    if (!course) return
    if (isEnrolled) {
      router.push(`/learn/${course.slug || course.id}`)
      return
    }

    setEnrolling(true)
    setEnrollError(null)
    try {
      const res = await fetch('/api/v1/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course.id,
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.url) {
        window.location.href = json.data.url
      } else if (json.error?.code === 'ALREADY_ENROLLED') {
        setIsEnrolled(true)
        router.push(`/learn/${course.slug || course.id}`)
      } else if (json.error?.code === 'UNAUTHENTICATED') {
        router.push(`/login?redirect=/courses/${course.slug || course.id}`)
      } else {
        setEnrollError(json.error?.message || 'Unable to connect to Stripe checkout.')
      }
    } catch (e: any) {
      setEnrollError(e.message || 'Error connecting to payment provider.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleDirectEnroll = async () => {
    if (!course) return
    setDirectEnrolling(true)
    setEnrollError(null)
    try {
      const res = await fetch('/api/v1/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setIsEnrolled(true)
        router.push(`/learn/${course.slug || course.id}`)
      } else if (json.error?.code === 'UNAUTHENTICATED') {
        router.push(`/login?redirect=/courses/${course.slug || course.id}`)
      } else {
        setEnrollError(json.error?.message || 'Direct enrollment failed.')
      }
    } catch (e: any) {
      setEnrollError(e.message || 'Failed to enroll.')
    } finally {
      setDirectEnrolling(false)
    }
  }

  if (loading) {
    return <CourseSkeleton />
  }

  if (!course) {
    return <CourseSkeleton />
  }

  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)
  const totalSeconds = sections.reduce((acc, s) => acc + (s.lessons?.reduce((a, l) => a + (l.duration_seconds || 0), 0) || 0), 0)
  const totalHours = (totalSeconds / 3600).toFixed(1)
  const price = `$${((course.price_cents || 0) / 100).toFixed(2)}`
  const ratingVal = course.avg_rating ? Number(course.avg_rating).toFixed(1) : '4.8'

  return (
    <div className="min-h-screen bg-[#F0F5FB] pb-24 md:pb-0">
      {/* ── TOP HERO BANNER ── */}
      <div className="bg-gradient-to-r from-[#0B1B2E] via-[#112A46] to-[#1A3D64] text-white py-8 sm:py-12 px-4 sm:px-6 md:px-12 border-b border-[#1A3D64]">
        <div className="wrap">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#ACC8E5] hover:text-white mb-4 transition-colors uppercase tracking-wider"
          >
            ← Back to Courses
          </Link>

          <div className="max-w-3xl">
            <span className="pill bg-white/20 text-[#ACC8E5] border border-white/25 mb-2.5 font-bold text-[10px]">
              {course.category?.name || 'Development'}
            </span>

            <h1 className="h-display1 text-white my-2 sm:my-3 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug">
              {course.title}
            </h1>

            <p className="text-[#C9D9EA] text-xs sm:text-sm md:text-base mb-5 leading-relaxed">
              {course.description}
            </p>

            <div className="flex items-center gap-3 sm:gap-5 flex-wrap text-xs sm:text-sm text-[#E2E8F0]">
              <div className="stars text-[#FBBF24]">
                <span>★ {ratingVal}</span>
                <span className="text-[#ACC8E5] font-normal ml-1">({course.review_count?.toLocaleString() || '12,480'} reviews)</span>
              </div>
              <div className="text-[#C9D9EA]">• {totalHours} total hours</div>
              <div className="text-[#C9D9EA]">• {totalLessons} lessons</div>
              <div className="text-[#C9D9EA]">• All Levels</div>
            </div>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/15 text-xs sm:text-sm">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ACC8E5] text-[#112A46] flex items-center justify-center font-bold text-xs shrink-0">
                {course.instructor?.display_name?.slice(0, 2).toUpperCase() || 'MC'}
              </div>
              <div>
                <span className="text-[11px] text-[#ACC8E5] block leading-tight">Course Instructor</span>
                <strong className="text-white font-bold text-xs sm:text-sm leading-tight">{course.instructor?.display_name || 'Marta Coelho'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY & STICKY PURCHASE CARD ── */}
      <div className="wrap py-6 sm:py-10">
        <div className="sales-layout">
          {/* Left: What You'll Learn, Curriculum, Reviews */}
          <div className="min-w-0">
            {/* What you'll learn */}
            <div className="card p-5 sm:p-7 mb-6 sm:mb-8 shadow-sm bg-white">
              <h2 className="h-section text-[#112A46] text-base sm:text-lg font-bold mb-4">What you will master in this course</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {[
                  'Build production-ready, highly scalable applications from scratch',
                  'Architect clean modular systems with modern best practices',
                  'Integrate databases, transactions, and security perimeters',
                  'Deploy to enterprise cloud infrastructures with CI/CD automation',
                  'Lifetime access to all modules, cheat sheets, and future updates',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#334155] leading-relaxed">
                    <span className="text-[#16A34A] font-bold shrink-0 mt-0.5">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum Accordion */}
            <div className="mb-8 sm:mb-10">
              <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-1 mb-4">
                <h2 className="h-section text-[#112A46] text-base sm:text-lg font-bold">Course Content</h2>
                <span className="text-[11px] sm:text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  {sections.length} sections • {totalLessons} lessons • {totalHours}h length
                </span>
              </div>

              <div id="curriculum" className="space-y-2.5">
                {sections.map((sec, sIdx) => {
                  const isOpen = openSections[sec.id]
                  return (
                    <div key={sec.id} className={`accordion-item ${isOpen ? 'open' : ''}`}>
                      <div
                        className="accordion-head"
                        onClick={() => toggleSection(sec.id)}
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-[#112A46]">
                            Section {sIdx + 1}: {sec.title}
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">
                            {sec.lessons?.length || 0} lessons
                          </div>
                        </div>
                        <div className="chev text-sm">
                          <ChevronIcon size={16} direction={isOpen ? 'up' : 'down'} />
                        </div>
                      </div>

                      <div className="accordion-body">
                        {sec.lessons?.map((les) => (
                          <div key={les.id} className="lesson-row text-xs sm:text-sm">
                            <PlayIcon size={14} color={les.is_preview ? '#16A34A' : '#64748B'} />
                            <span className="font-medium text-[#0B1B2E] flex-1 truncate">{les.title}</span>
                            {les.is_preview && (
                              <span className="pill pill-success text-[9px] sm:text-[10px] py-0.5 px-2 font-bold shrink-0">
                                Free Preview
                              </span>
                            )}
                            <span className="dur font-mono text-[11px] shrink-0">
                              {les.duration_seconds ? `${Math.floor(les.duration_seconds / 60)}:${(les.duration_seconds % 60).toString().padStart(2, '0')}` : 'Read'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Student Reviews & Star Breakdown */}
            <div className="card p-5 sm:p-7 shadow-sm bg-white">
              <h2 className="h-section text-[#112A46] text-base sm:text-lg font-bold mb-5">Student Feedback & Ratings</h2>

              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center pb-6 border-b border-[#E2E8F0]">
                <div className="text-center sm:text-left min-w-[120px]">
                  <div className="font-display font-black text-4xl sm:text-5xl text-[#112A46]">{ratingVal}</div>
                  <div className="stars text-[#FBBF24] my-1 text-base">
                    <span>★ ★ ★ ★ ★</span>
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-[#64748B] uppercase tracking-wider">Course Rating</div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  {[
                    { stars: 5, pct: 78 },
                    { stars: 4, pct: 16 },
                    { stars: 3, pct: 4 },
                    { stars: 2, pct: 1 },
                    { stars: 1, pct: 1 },
                  ].map(b => (
                    <div key={b.stars} className="rating-bar-row text-xs font-semibold">
                      <span className="w-12 text-[#64748B]">{b.stars} stars</span>
                      <div className="rating-bar-track">
                        <div className="rating-bar-fill" style={{ width: `${b.pct}%` }}></div>
                      </div>
                      <span className="w-8 text-right text-[#64748B]">{b.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews list */}
              <div className="mt-5 space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="border-b border-[#F1F5F9] pb-4 last:border-none last:pb-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-[#EAF1FA] text-[#112A46] flex items-center justify-center font-bold text-[10px]">
                        {r.reviewer?.display_name?.slice(0, 2).toUpperCase() || 'ST'}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#0B1B2E]">{r.reviewer?.display_name || 'Verified Learner'}</div>
                        <div className="stars text-[11px] text-[#FBBF24]">{'★'.repeat(r.rating || 5)}</div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Buy Card */}
          <div className="sticky-buy">
            <div className="card modal-surface overflow-hidden bg-white shadow-lg">
              <div
                className="video-frame"
                style={{
                  backgroundImage: `linear-gradient(rgba(17,42,70,0.2), rgba(11,27,46,0.7)), url(${course.thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=338&fit=crop'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="play-btn" onClick={handleDirectEnroll}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <polygon points="8,5 19,12 8,19" />
                  </svg>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="font-display font-black text-2xl sm:text-3xl text-[#112A46] mb-3">
                  {price}
                </div>

                {enrollError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl mb-3 font-semibold">
                    {enrollError}
                  </div>
                )}

                {isEnrolled ? (
                  <button
                    onClick={() => router.push(`/learn/${course.slug || course.id}`)}
                    className="btn btn-primary btn-block bg-[#16A34A] hover:bg-[#15803D] mb-4 font-bold text-xs sm:text-sm"
                  >
                    ✓ Enrolled — Go to Course Player →
                  </button>
                ) : (
                  <div className="space-y-2.5 mb-4">
                    <button
                      onClick={handleEnrollStripe}
                      disabled={enrolling || directEnrolling}
                      className="btn btn-primary btn-block text-xs sm:text-sm font-bold shadow-md cursor-pointer"
                    >
                      {enrolling ? 'Connecting to Stripe...' : 'Enroll with Stripe Checkout →'}
                    </button>

                    <button
                      onClick={handleDirectEnroll}
                      disabled={enrolling || directEnrolling}
                      className="btn btn-secondary btn-block text-xs font-bold cursor-pointer"
                    >
                      {directEnrolling ? 'Enrolling...' : '⚡ Instant Free Trial / Enroll'}
                    </button>
                  </div>
                )}

                <p className="text-center text-[11px] font-semibold text-[#64748B]">
                  30-Day Money-Back Guarantee
                </p>

                <div className="border-t border-[#E2E8F0] mt-4 pt-3.5 space-y-2.5 text-xs text-[#334155] font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-[#16A34A] font-bold">✓</span> {totalHours} hours on-demand video
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#16A34A] font-bold">✓</span> Full lifetime access & updates
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#16A34A] font-bold">✓</span> Verified certificate of completion
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#16A34A] font-bold">✓</span> Access on mobile and desktop
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Enrollment Bar (< 960px) ── */}
      <div className="mobile-sticky-cta">
        <div>
          <span className="text-[10px] text-[#64748B] block leading-none font-bold uppercase">Total Price</span>
          <span className="font-display font-black text-xl text-[#112A46] leading-tight">{price}</span>
        </div>

        {isEnrolled ? (
          <button
            onClick={() => router.push(`/learn/${course.slug || course.id}`)}
            className="btn btn-primary btn-sm bg-[#16A34A] hover:bg-[#15803D] font-bold text-xs px-4"
          >
            ✓ Open Player
          </button>
        ) : (
          <button
            onClick={handleEnrollStripe}
            disabled={enrolling || directEnrolling}
            className="btn btn-primary btn-sm font-bold text-xs px-4 shadow-sm"
          >
            {enrolling ? 'Connecting...' : 'Enroll Now →'}
          </button>
        )}
      </div>
    </div>
  )
}
