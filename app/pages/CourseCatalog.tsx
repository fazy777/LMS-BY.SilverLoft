"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SearchIcon, StarIcon, ClockIcon } from '../components/Icons'
import { CourseCatalogSkeleton } from '../components/CourseSkeleton'

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

const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'popular' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Newest Releases', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
]

const FALLBACK_COURSES: Course[] = [
  { id: 1, title: 'The Complete Next.js 16 Developer Course', slug: 'nextjs-16-developer-course', category: { id: 1, name: 'Development', slug: 'development' }, instructor: { id: 1, display_name: 'Marta Coelho' }, avg_rating: 4.8, review_count: 12480, price_cents: 6499, thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=338&fit=crop' },
  { id: 2, title: 'UI/UX Design Foundations: From Wireframe to Prototype', slug: 'ui-ux-design-foundations', category: { id: 2, name: 'Design', slug: 'design' }, instructor: { id: 2, display_name: 'Owen Faraday' }, avg_rating: 4.7, review_count: 8341, price_cents: 4999, thumbnail_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&h=338&fit=crop' },
  { id: 3, title: 'Financial Modeling & Valuation for Startups', slug: 'financial-modeling-startups', category: { id: 3, name: 'Business', slug: 'business' }, instructor: { id: 3, display_name: 'Priya Nandakumar' }, avg_rating: 4.6, review_count: 5210, price_cents: 7499, thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=338&fit=crop' },
  { id: 4, title: 'Growth Marketing: Funnels, SEO & Paid Acquisition', slug: 'growth-marketing-funnels', category: { id: 4, name: 'Marketing', slug: 'marketing' }, instructor: { id: 4, display_name: 'Diego Santoro' }, avg_rating: 4.5, review_count: 3987, price_cents: 5499, thumbnail_url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=600&h=338&fit=crop' },
  { id: 5, title: 'Python for Data Science and Machine Learning', slug: 'python-data-science-machine-learning', category: { id: 5, name: 'Data Science', slug: 'data-science' }, instructor: { id: 5, display_name: 'Hana Ishikawa' }, avg_rating: 4.9, review_count: 21032, price_cents: 6999, thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=338&fit=crop' },
  { id: 6, title: 'Portrait Photography: Studio Lighting Masterclass', slug: 'portrait-photography-lighting', category: { id: 6, name: 'Photography', slug: 'photography' }, instructor: { id: 6, display_name: 'Lucas Reyes' }, avg_rating: 4.7, review_count: 2765, price_cents: 3999, thumbnail_url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=338&fit=crop' },
  { id: 7, title: 'Advanced TypeScript: Architecture & Design Patterns', slug: 'advanced-typescript-architecture', category: { id: 1, name: 'Development', slug: 'development' }, instructor: { id: 1, display_name: 'Marta Coelho' }, avg_rating: 4.8, review_count: 6120, price_cents: 5999, thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=338&fit=crop' },
  { id: 8, title: 'Brand Identity Design with Figma', slug: 'brand-identity-figma', category: { id: 2, name: 'Design', slug: 'design' }, instructor: { id: 2, display_name: 'Owen Faraday' }, avg_rating: 4.6, review_count: 4108, price_cents: 4499, thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&h=338&fit=crop' },
]

export default function CourseCatalog({
  onSelectCourse,
}: {
  onSelectCourse?: (slug: string) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlQ = searchParams?.get('q') || ''
  const urlCategory = searchParams?.get('category') || 'all'

  const [search, setSearch] = useState(urlQ)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(urlCategory)
  const [categories, setCategories] = useState<Category[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('popular')
  const [priceFilter, setPriceFilter] = useState<'all' | 'under25' | '25to75' | '75plus'>('all')
  const [minRating, setMinRating] = useState<number>(0)
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const [prevUrlState, setPrevUrlState] = useState({ q: urlQ, cat: urlCategory })
  if (prevUrlState.q !== urlQ || prevUrlState.cat !== urlCategory) {
    setPrevUrlState({ q: urlQ, cat: urlCategory })
    setSearch(urlQ)
    setSelectedCategory(urlCategory)
  }

  // Fetch categories
  useEffect(() => {
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
  }, [])

  // Debounce sync to browser URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory)
      if (sort && sort !== 'popular') params.set('sort', sort)

      const newQueryString = params.toString()
      const currentQueryString = searchParams?.toString() || ''
      if (newQueryString !== currentQueryString) {
        router.replace(newQueryString ? `/courses?${newQueryString}` : '/courses', { scroll: false })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, selectedCategory, sort])

  // Fetch courses from SQL
  useEffect(() => {
    let isCancelled = false
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory)
    params.set('sort', sort)
    params.set('limit', '50')

    fetch(`/api/v1/courses?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        if (isCancelled) return
        if (json.success && Array.isArray(json.data?.courses)) {
          setCourses(json.data.courses)
        } else {
          setCourses(FALLBACK_COURSES)
        }
        setLoading(false)
      })
      .catch(() => {
        if (isCancelled) return
        setCourses(FALLBACK_COURSES)
        setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [search, selectedCategory, sort])

  // Filter client-side
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (search.trim()) {
        const term = search.trim().toLowerCase()
        const titleMatch = c.title?.toLowerCase().includes(term)
        const descMatch = c.description?.toLowerCase().includes(term)
        const instrMatch = c.instructor?.display_name?.toLowerCase().includes(term)
        const catMatch = c.category?.name?.toLowerCase().includes(term)
        if (!titleMatch && !descMatch && !instrMatch && !catMatch) return false
      }

      // Price Filter
      const priceDollars = (c.price_cents || 0) / 100
      if (priceFilter === 'under25' && priceDollars >= 25) return false
      if (priceFilter === '25to75' && (priceDollars < 25 || priceDollars > 75)) return false
      if (priceFilter === '75plus' && priceDollars < 75) return false

      // Rating Filter
      const rating = c.avg_rating ? Number(c.avg_rating) : 4.8
      if (minRating > 0 && rating < minRating) return false

      // Category Filter
      if (selectedCategory !== 'all' && c.category?.slug !== selectedCategory) return false

      return true
    })
  }, [courses, search, priceFilter, minRating, selectedCategory])

  const handleCourseClick = (slug: string) => {
    if (onSelectCourse) {
      onSelectCourse(slug)
    } else {
      router.push(`/courses/${slug}`)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setSelectedCategory('all')
    setPriceFilter('all')
    setMinRating(0)
    setSort('popular')
    setSelectedLevel('all')
    router.replace('/courses', { scroll: false })
  }

  const activeFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (priceFilter !== 'all' ? 1 : 0) + (minRating > 0 ? 1 : 0) + (selectedLevel !== 'all' ? 1 : 0)

  return (
    <div className="wrap py-6 sm:py-10 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="h-display2 text-[#112A46] text-xl sm:text-2xl md:text-3xl font-extrabold">Course Catalog</h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
          {search.trim() ? (
            <span>
              Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'result' : 'results'} for &ldquo;<strong className="text-[#112A46]">{search.trim()}</strong>&rdquo;
            </span>
          ) : (
            <span>
              Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} available for enrollment
            </span>
          )}
        </p>
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-white border border-[#CBD5E1] rounded-2xl text-xs font-bold text-[#112A46] shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>⚙️ Filter Options</span>
            {activeFilterCount > 0 && (
              <span className="pill bg-[#112A46] text-white text-[10px] px-2 py-0.5 font-bold">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <span>{mobileFilterOpen ? '▲ Hide' : '▼ Expand'}</span>
        </button>
      </div>

      {/* Layout: Filters Sidebar + Grid */}
      <div className="catalog-layout">
        {/* Sidebar Filters */}
        <aside className={`${mobileFilterOpen ? 'block mb-6' : 'hidden'} md:block`}>
          <div className="card p-5 sm:p-6 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#E2E8F0]">
              <span className="font-bold text-xs text-[#112A46] uppercase tracking-wider">Filters</span>
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-[#64748B] hover:text-[#112A46] underline cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Category Checkboxes */}
            <div className="filter-block">
              <div className="filter-title">Category</div>
              <label className="filter-check text-xs sm:text-sm">
                <input
                  type="radio"
                  name="cat"
                  checked={selectedCategory === 'all'}
                  onChange={() => setSelectedCategory('all')}
                />
                All Topics
              </label>
              {categories.map((cat) => (
                <label key={cat.id} className="filter-check text-xs sm:text-sm">
                  <input
                    type="radio"
                    name="cat"
                    checked={selectedCategory === cat.slug}
                    onChange={() => setSelectedCategory(cat.slug)}
                  />
                  {cat.name}
                </label>
              ))}
            </div>

            {/* Price Range */}
            <div className="filter-block">
              <div className="filter-title">Price Range</div>
              <label className="filter-check text-xs sm:text-sm">
                <input
                  type="radio"
                  name="price_f"
                  checked={priceFilter === 'all'}
                  onChange={() => setPriceFilter('all')}
                />
                All Prices
              </label>
              <label className="filter-check text-xs sm:text-sm">
                <input
                  type="radio"
                  name="price_f"
                  checked={priceFilter === 'under25'}
                  onChange={() => setPriceFilter('under25')}
                />
                Under $25
              </label>
              <label className="filter-check text-xs sm:text-sm">
                <input
                  type="radio"
                  name="price_f"
                  checked={priceFilter === '25to75'}
                  onChange={() => setPriceFilter('25to75')}
                />
                $25 – $75
              </label>
              <label className="filter-check text-xs sm:text-sm">
                <input
                  type="radio"
                  name="price_f"
                  checked={priceFilter === '75plus'}
                  onChange={() => setPriceFilter('75plus')}
                />
                $75+
              </label>
            </div>

            {/* Rating Stars */}
            <div className="filter-block">
              <div className="filter-title">Rating</div>
              <label className="filter-check text-xs sm:text-sm">
                <input
                  type="radio"
                  name="rating_f"
                  checked={minRating === 0}
                  onChange={() => setMinRating(0)}
                />
                All Ratings
              </label>
              <label className="filter-check text-xs sm:text-sm">
                <input
                  type="radio"
                  name="rating_f"
                  checked={minRating === 4.5}
                  onChange={() => setMinRating(4.5)}
                />
                <span className="stars font-bold">★ 4.5 & up</span>
              </label>
              <label className="filter-check text-xs sm:text-sm">
                <input
                  type="radio"
                  name="rating_f"
                  checked={minRating === 4.0}
                  onChange={() => setMinRating(4.0)}
                />
                <span className="stars font-bold">★ 4.0 & up</span>
              </label>
            </div>

            {/* Difficulty Level */}
            <div className="filter-block border-none pb-0 mb-0">
              <div className="filter-title">Level</div>
              {['All Levels', 'Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                <label key={lvl} className="filter-check text-xs sm:text-sm">
                  <input
                    type="radio"
                    name="level"
                    checked={selectedLevel === lvl.toLowerCase()}
                    onChange={() => setSelectedLevel(lvl.toLowerCase())}
                  />
                  {lvl}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Courses Main Grid Area */}
        <div className="min-w-0">
          {/* Top Search + Sort Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mb-6">
            <form onSubmit={e => e.preventDefault()} className="relative w-full sm:max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none transition-colors">
                <SearchIcon size={17} color={isSearchFocused ? '#112A46' : '#94A3B8'} />
              </span>
              <input
                type="text"
                placeholder="Search courses, topics, skills..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`input pl-10 pr-10 h-11 text-xs sm:text-sm bg-white border rounded-full transition-all text-[#0B1B2E] outline-none ${
                  isSearchFocused
                    ? 'border-[#112A46] ring-3 ring-[#112A46]/10'
                    : 'border-[#CBD5E1] hover:border-[#94A3B8]'
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#64748B] hover:text-[#0B1B2E] text-xs font-bold transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </form>

            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <span className="text-xs font-bold text-[#64748B] uppercase shrink-0">Sort:</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="input h-11 text-xs sm:text-sm font-semibold w-full sm:w-48 bg-white cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Search Filter Badge */}
          {search.trim() && (
            <div className="flex items-center justify-between mb-5 bg-[#EAF1FA] border border-[#CBD5E1] rounded-xl px-4 py-2 text-xs text-[#112A46]">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Filtered by:</span>
                <span className="pill bg-[#112A46] text-white px-2 py-0.5 text-[11px] font-bold">
                  &ldquo;{search.trim()}&rdquo;
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[#112A46] hover:text-[#DC2626] font-bold text-xs underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Grid or Empty Notice */}
          {loading ? (
            <CourseCatalogSkeleton />
          ) : filteredCourses.length === 0 ? (
            <div className="card p-8 sm:p-14 text-center shadow-sm bg-white">
              <div className="text-3xl sm:text-4xl mb-3">🔍</div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#112A46] mb-1">
                {search.trim()
                  ? `No courses found matching "${search.trim()}"`
                  : 'No courses match your filter criteria'}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] mb-5 font-medium max-w-sm mx-auto">
                {search.trim()
                  ? 'Try searching with other keywords or clear your active filters.'
                  : 'Try relaxing your price, rating, or category parameters.'}
              </p>
              <div className="flex justify-center gap-3">
                {search.trim() && (
                  <button
                    onClick={() => setSearch('')}
                    className="btn btn-secondary btn-sm font-bold text-xs"
                  >
                    Clear Search
                  </button>
                )}
                <button onClick={resetFilters} className="btn btn-primary btn-sm font-bold text-xs">
                  Reset All Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid-courses">
                {filteredCourses.map((c) => {
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
                          <span className="text-xs font-bold text-[#112A46] hover:underline">View Course →</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div className="flex justify-center gap-2 mt-8 sm:mt-10">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    className={`btn btn-sm ${n === 1 ? 'btn-primary' : 'btn-secondary'} w-9 h-9 p-0 font-bold text-xs`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
