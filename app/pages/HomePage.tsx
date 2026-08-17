"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchIcon, StarIcon, CheckIcon, CertIcon, ClockIcon } from '../components/Icons'

interface Category {
  id: number
  name: string
  slug: string
}

interface Course {
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
}

const STATS = [
  { value: '180K+', label: 'Active Students' },
  { value: '2,400+', label: 'Courses Published' },
  { value: '320+', label: 'Expert Instructors' },
  { value: '98.4%', label: 'Satisfaction Rate' },
]

const FALLBACK_COURSES = [
  { id: 1, title: 'The Complete Next.js 16 Developer Course', slug: 'nextjs-16-developer-course', category: { name: 'Development', slug: 'development' }, instructor: { display_name: 'Marta Coelho' }, avg_rating: 4.8, review_count: 12480, price_cents: 6499, thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=338&fit=crop' },
  { id: 2, title: 'UI/UX Design Foundations: From Wireframe to Prototype', slug: 'ui-ux-design-foundations', category: { name: 'Design', slug: 'design' }, instructor: { display_name: 'Owen Faraday' }, avg_rating: 4.7, review_count: 8341, price_cents: 4999, thumbnail_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&h=338&fit=crop' },
  { id: 3, title: 'Financial Modeling & Valuation for Startups', slug: 'financial-modeling-startups', category: { name: 'Business', slug: 'business' }, instructor: { display_name: 'Priya Nandakumar' }, avg_rating: 4.6, review_count: 5210, price_cents: 7499, thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=338&fit=crop' },
  { id: 4, title: 'Growth Marketing: Funnels, SEO & Paid Acquisition', slug: 'growth-marketing-funnels', category: { name: 'Marketing', slug: 'marketing' }, instructor: { display_name: 'Diego Santoro' }, avg_rating: 4.5, review_count: 3987, price_cents: 5499, thumbnail_url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=600&h=338&fit=crop' },
  { id: 5, title: 'Python for Data Science and Machine Learning', slug: 'python-data-science-machine-learning', category: { name: 'Data Science', slug: 'data-science' }, instructor: { display_name: 'Hana Ishikawa' }, avg_rating: 4.9, review_count: 21032, price_cents: 6999, thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=338&fit=crop' },
  { id: 6, title: 'Portrait Photography: Studio Lighting Masterclass', slug: 'portrait-photography-lighting', category: { name: 'Photography', slug: 'photography' }, instructor: { display_name: 'Lucas Reyes' }, avg_rating: 4.7, review_count: 2765, price_cents: 3999, thumbnail_url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=338&fit=crop' },
  { id: 7, title: 'Advanced TypeScript: Architecture & Design Patterns', slug: 'advanced-typescript-architecture', category: { name: 'Development', slug: 'development' }, instructor: { display_name: 'Marta Coelho' }, avg_rating: 4.8, review_count: 6120, price_cents: 5999, thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=338&fit=crop' },
  { id: 8, title: 'Brand Identity Design with Figma', slug: 'brand-identity-figma', category: { name: 'Design', slug: 'design' }, instructor: { display_name: 'Owen Faraday' }, avg_rating: 4.6, review_count: 4108, price_cents: 4499, thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&h=338&fit=crop' },
]

const TESTIMONIALS = [
  {
    name: 'Adaeze Okonkwo',
    avatar: 'AO',
    role: 'Frontend Engineer at Shopify',
    quote: 'Silver Loft completely changed my career trajectory. I went from a marketing role to landing a high-impact engineering job in 9 months — the project-based curriculum was unmatched.',
  },
  {
    name: 'Ben Hartley',
    avatar: 'BH',
    role: 'DevOps Lead at Cloudflare',
    quote: 'The quality of instruction here is genuinely world-class. Every lesson delivers real production patterns without filler or fluff.',
  },
  {
    name: 'Mei-Ling Zhao',
    avatar: 'MZ',
    role: 'ML Engineer at DeepMind',
    quote: "The deep dive courses filled every practical gap between academic theory and real-world enterprise deployments. Highly recommended.",
  },
]

export default function HomePage({
  onBrowse,
  onSelectCourse,
}: {
  onBrowse?: (category?: string) => void
  onSelectCourse?: (slug: string) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    // 1. Fetch categories
    fetch('/api/v1/categories')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data)
        } else {
          setCategories([
            { id: 1, name: 'Development', slug: 'development' },
            { id: 2, name: 'Design', slug: 'design' },
            { id: 3, name: 'Business', slug: 'business' },
            { id: 4, name: 'Marketing', slug: 'marketing' },
            { id: 5, name: 'Data Science', slug: 'data-science' },
            { id: 6, name: 'Photography', slug: 'photography' },
          ])
        }
      })
      .catch(() => {
        setCategories([
          { id: 1, name: 'Development', slug: 'development' },
          { id: 2, name: 'Design', slug: 'design' },
          { id: 3, name: 'Business', slug: 'business' },
          { id: 4, name: 'Marketing', slug: 'marketing' },
          { id: 5, name: 'Data Science', slug: 'data-science' },
          { id: 6, name: 'Photography', slug: 'photography' },
        ])
      })

    // 2. Fetch courses
    fetch('/api/v1/courses?limit=8&sort=popular')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data?.courses) && json.data.courses.length > 0) {
          setCourses(json.data.courses)
        } else {
          setCourses(FALLBACK_COURSES as any)
        }
        setLoading(false)
      })
      .catch(() => {
        setCourses(FALLBACK_COURSES as any)
        setLoading(false)
      })
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (activeCategory) params.set('category', activeCategory)

    if (onBrowse) {
      onBrowse(activeCategory || undefined)
    } else {
      router.push(`/courses?${params.toString()}`)
    }
  }

  const handleCourseClick = (slug: string) => {
    if (onSelectCourse) {
      onSelectCourse(slug)
    } else {
      router.push(`/courses/${slug}`)
    }
  }

  const displayCourses = courses.length > 0 ? courses : FALLBACK_COURSES

  return (
    <div className="min-h-screen bg-[#F0F5FB]">
      {/* ── HERO SECTION ── */}
      <section className="hero py-10 sm:py-14 md:py-16">
        <div className="wrap hero-grid">
          <div>
            <div className="pill pill-tint inline-flex items-center gap-2 mb-3 sm:mb-4 text-[10px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              Admin-reviewed, quality-gated courses
            </div>

            <h1 className="h-display1 text-[#0B1B2E] my-2 sm:my-3 text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold leading-tight">
              Skills that move your career forward — taught by people who use them daily.
            </h1>

            <p className="text-[#334155] text-xs sm:text-sm md:text-base leading-relaxed mb-6 max-w-xl">
              Over 40,000 self-paced courses across web development, cloud architecture, product design, and AI. Learn at your pace, build real projects, and keep lifetime access.
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="relative max-w-lg mb-5 sm:mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-[#64748B] pointer-events-none transition-colors">
                <SearchIcon size={18} color={isSearchFocused ? '#112A46' : '#64748B'} />
              </span>

              <input
                className={`input w-full shadow-[0_6px_24px_rgba(17,42,70,0.07)] h-12 sm:h-14 rounded-full text-[#0B1B2E] bg-white border transition-all text-xs sm:text-sm md:text-base outline-none ${
                  isSearchFocused
                    ? 'border-[#112A46] ring-4 ring-[#112A46]/10 pl-11 pr-11'
                    : query
                    ? 'border-[#CBD5E1] pl-11 pr-11'
                    : 'border-[#CBD5E1] pl-11 pr-24 hover:border-[#94A3B8]'
                }`}
                placeholder="Search courses, skills, tools..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />

              {/* Clear button when text is entered */}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#64748B] hover:text-[#0B1B2E] text-xs font-bold transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}

              {/* Search button only visible when inactive and empty */}
              {!isSearchFocused && !query && (
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 btn btn-primary btn-sm rounded-full px-4 h-9 sm:h-10 text-xs font-bold shadow-sm cursor-pointer transition-all duration-200"
                >
                  Search
                </button>
              )}
            </form>

            {/* Category Filter Pills (Horizontal scroll on mobile) */}
            <div className="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto no-scrollbar py-1">
              {categories.map((c) => {
                const isActive = activeCategory === c.slug
                return (
                  <button
                    key={c.id}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#112A46] text-white border-[#112A46] shadow-sm'
                        : 'bg-white text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                    onClick={() => {
                      const next = isActive ? null : c.slug
                      setActiveCategory(next)
                      if (next) router.push(`/courses?category=${next}`)
                    }}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Hero Visual Panel with Floating Cards */}
          <div className="hero-visual hidden md:block">
            <div className="hero-mainpanel">
              <div className="hero-mainpanel-overlay"></div>
              <div className="hero-mainpanel-badge">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] inline-block animate-pulse"></span>
                <span>Verified Graduates • 180K+ Certified</span>
              </div>
            </div>

            {/* Float Card 1 */}
            <div className="float-card" style={{ top: '16px', right: '16px', width: '235px', zIndex: 20 }}>
              <div className="kbadge bg-[#DCFCE7] text-[#16A34A] shrink-0">
                <CheckIcon size={20} color="#16A34A" />
              </div>
              <div>
                <div className="font-bold text-[13.5px] text-[#0B1B2E] leading-tight">Lesson complete</div>
                <div className="text-[12px] text-[#64748B] leading-tight mt-1">Streak: 12 days active 🔥</div>
              </div>
            </div>

            {/* Float Card 2 */}
            <div className="float-card" style={{ bottom: '24px', right: '28px', width: '235px', zIndex: 20, animationDelay: '1.5s' }}>
              <div className="kbadge bg-[#EAF1FA] text-[#112A46] shrink-0">
                <CertIcon size={22} color="#112A46" />
              </div>
              <div>
                <div className="font-bold text-[13.5px] text-[#0B1B2E] leading-tight">Certificate earned</div>
                <div className="text-[12px] text-[#64748B] leading-tight mt-1">Next.js 16 Architecture</div>
              </div>
            </div>

            {/* Float Card 3 */}
            <div className="float-card" style={{ top: '160px', left: '16px', width: '185px', zIndex: 20, animationDelay: '0.8s' }}>
              <div className="stars text-[#D97706] font-bold">
                <span>★ 4.9</span>
                <span className="text-[#64748B] text-[12px] font-normal ml-1">(21K+ ratings)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="bg-white border-b border-[#E2E8F0] py-6 sm:py-8">
        <div className="wrap grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label} className="p-2">
              <div className="font-display font-black text-xl sm:text-2xl md:text-3xl text-[#112A46] leading-tight">{value}</div>
              <div className="text-[10px] sm:text-xs font-bold text-[#64748B] mt-1 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED COURSES SECTION ── */}
      <section className="wrap py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h2 className="h-display2 text-[#112A46] text-xl sm:text-2xl md:text-3xl font-extrabold">Featured Courses</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">Carefully curated by industry leaders and verified by administrators</p>
          </div>
          <Link href="/courses" className="btn btn-ghost btn-sm font-bold text-[#112A46] text-xs sm:text-sm self-start sm:self-auto pl-0 sm:pl-3">
            Browse all courses →
          </Link>
        </div>

        <div className="grid-courses">
          {displayCourses.slice(0, 8).map((c) => {
            const price = `$${((c.price_cents || 0) / 100).toFixed(2)}`
            return (
              <div
                key={c.id}
                onClick={() => handleCourseClick(c.slug || c.id.toString())}
                className="course-card"
              >
                <div
                  className="course-thumb"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(17,42,70,0.1) 0%, rgba(11,27,46,0.65) 100%), url(${c.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=520&h=292&fit=crop'})`,
                  }}
                >
                  <span className="pill bg-white/25 text-white backdrop-blur-md border border-white/30 font-bold text-[10px]">
                    {c.category?.name || 'Development'}
                  </span>
                </div>

                <div className="course-body">
                  <h3 className="course-title text-[#0B1B2E] text-sm sm:text-base">
                    {c.title}
                  </h3>

                  <div className="course-instr text-[#64748B] text-xs">
                    <span className="mini-avatar bg-[#112A46] text-white flex items-center justify-center text-[10px] font-bold">
                      {c.instructor?.display_name?.slice(0, 2).toUpperCase() || 'SL'}
                    </span>
                    <span className="truncate">{c.instructor?.display_name || 'Silver Loft Instructor'}</span>
                  </div>

                  <div className="course-meta-row text-xs">
                    <div className="stars">
                      <span>★ {c.avg_rating ? Number(c.avg_rating).toFixed(1) : '4.8'}</span>
                      <span className="text-[#64748B] text-[11px] font-normal">({c.review_count?.toLocaleString() || '1,240'})</span>
                    </div>
                  </div>

                  <div className="course-meta-row pt-2.5 mt-auto border-t border-[#F1F5F9]">
                    <span className="price text-[#112A46] text-base">{price}</span>
                    <span className="text-xs font-bold text-[#112A46] hover:underline">Enroll Now →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── TEACH ON SILVER LOFT CTA BANNER ── */}
      <section className="wrap pb-12 sm:pb-16">
        <div className="card modal-surface bg-gradient-to-br from-[#112A46] via-[#16385C] to-[#0B1B2E] p-6 sm:p-8 md:p-12 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
          <div className="max-w-xl">
            <span className="pill bg-white/20 text-[#ACC8E5] border border-white/25 mb-2 sm:mb-3 font-bold text-[10px]">
              Teach on Silver Loft
            </span>
            <h2 className="h-display2 text-white my-2 sm:my-3 text-xl sm:text-2xl md:text-3xl font-extrabold leading-snug">
              Turn your expertise into recurring income — no upfront approval needed to start building.
            </h2>
            <p className="text-[#C9D9EA] text-xs sm:text-sm md:text-base leading-relaxed mb-4">
              Build your video curriculum, set your price, and submit for quick administrative review. You keep control over your courses, and receive automated payouts via Stripe Connect.
            </p>
            <div className="flex gap-3 sm:gap-4 flex-wrap text-xs text-[#ACC8E5] font-bold">
              <span>✓ Keep 85% of sales</span>
              <span>✓ Instant video streaming</span>
              <span>✓ Automated payouts</span>
            </div>
          </div>

          <Link
            href="/instructor"
            className="btn btn-primary bg-white text-[#112A46] hover:bg-[#F0F5FB] px-6 sm:px-8 h-11 sm:h-12 flex-shrink-0 text-xs sm:text-base font-bold shadow-lg w-full md:w-auto"
          >
            Become an Instructor →
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section className="wrap pb-14 sm:pb-20">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="h-display2 text-[#112A46] text-xl sm:text-2xl md:text-3xl font-extrabold">What Our Students Say</h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">Real reviews from professionals who upgraded their skill set on Silver Loft</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow bg-white">
              <div>
                <div className="text-3xl text-[#ACC8E5] font-serif leading-none mb-2 sm:mb-3">“</div>
                <p className="text-xs sm:text-sm text-[#334155] mb-5 leading-relaxed">{t.quote}</p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-[#F1F5F9]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#ACC8E5] to-[#112A46] text-white flex items-center justify-center font-bold text-xs">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-[#0B1B2E]">{t.name}</div>
                  <div className="text-[11px] sm:text-xs text-[#64748B]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
