"use client"
import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SearchIcon, StarIcon } from './Icons'

function HeaderSearchBarInner({
  placeholder = "Search courses, skills, technologies...",
  className = "",
  autoFocus = false,
  onAfterNavigate = null,
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQ = searchParams?.get('q') || ''

  const [query, setQuery] = useState(urlQ)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Synchronize local input state if URL query param changes
  useEffect(() => {
    setQuery(urlQ)
  }, [urlQ])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Live debounced search as user types
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/courses?q=${encodeURIComponent(trimmed)}&limit=5`)
        const json = await res.json()
        if (json.success && Array.isArray(json.data?.courses)) {
          setResults(json.data.courses)
        } else {
          setResults([])
        }
      } catch (err) {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 220)

    return () => clearTimeout(timeout)
  }, [query])

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    setIsOpen(false)
    setIsFocused(false)
    if (inputRef.current) inputRef.current.blur()

    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/courses?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/courses')
    }
    if (onAfterNavigate) onAfterNavigate()
  }

  const handleSelectCourse = (slug) => {
    setIsOpen(false)
    setIsFocused(false)
    router.push(`/courses/${slug}`)
    if (onAfterNavigate) onAfterNavigate()
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    if (inputRef.current) inputRef.current.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setIsFocused(false)
    }
  }

  return (
    <div ref={containerRef} className={`header-search relative min-w-0 ${className}`} style={{ width: '100%' }}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <span className="icon absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none transition-colors">
          <SearchIcon size={15} color={isFocused ? '#112A46' : '#64748B'} />
        </span>

        <input
          ref={inputRef}
          type="text"
          className={`input w-full h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-white border rounded-full outline-none transition-all text-[#0B1B2E] ${
            isFocused
              ? 'border-[#112A46] ring-2 sm:ring-3 ring-[#112A46]/10 pl-8 sm:pl-9 pr-7 sm:pr-9'
              : query
              ? 'border-[#CBD5E1] pl-8 sm:pl-9 pr-7 sm:pr-9'
              : 'border-[#CBD5E1] pl-8 sm:pl-9 pr-3 sm:pr-6 hover:border-[#94A3B8]'
          }`}
          placeholder={placeholder}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            setIsFocused(true)
            if (query.trim()) setIsOpen(true)
          }}
          onBlur={() => {
            // Keep focused false after short tick to allow clicks inside dropdown
            setTimeout(() => setIsFocused(false), 150)
          }}
          onKeyDown={handleKeyDown}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#64748B] hover:text-[#0B1B2E] text-[10px] sm:text-xs font-bold transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </form>

      {/* Live Search Autocomplete Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div
          className="search-dropdown-menu absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-[0_16px_40px_rgba(17,42,70,0.18)] border border-[#E2E8F0] py-2 z-50 overflow-hidden text-left"
          style={{ width: '100%', maxWidth: '100%', maxHeight: 'min(420px, 65vh)', overflowY: 'auto' }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#64748B]">
              <div className="w-4 h-4 border-2 border-[#112A46] border-t-transparent rounded-full animate-spin"></div>
              <span>Searching catalog...</span>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-[#64748B] uppercase border-b border-[#F1F5F9] flex justify-between items-center">
                <span>Matching Courses</span>
                <span className="text-[10px] font-normal lowercase">{results.length} found</span>
              </div>

              <div className="divide-y divide-[#F8FAFC]">
                {results.map((c) => {
                  const price = `$${((c.price_cents || 0) / 100).toFixed(2)}`
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCourse(c.slug || c.id.toString())}
                      className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#F0F5FB] cursor-pointer transition-colors group"
                    >
                      {/* Thumbnail Preview */}
                      <div
                        className="w-12 h-9 rounded-lg bg-[#E2E8F0] bg-cover bg-center shrink-0 border border-[#E2E8F0]"
                        style={{
                          backgroundImage: `url(${c.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=90&fit=crop'})`,
                        }}
                      />

                      {/* Course Details */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#0B1B2E] group-hover:text-[#112A46] truncate">
                          {c.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11.5px] text-[#64748B] mt-0.5">
                          {c.category?.name && (
                            <span className="inline-block px-1.5 py-0.2 bg-[#E2E8F0] text-[#334155] rounded text-[10px] font-semibold">
                              {c.category.name}
                            </span>
                          )}
                          <span className="truncate">{c.instructor?.display_name || 'Instructor'}</span>
                        </div>
                      </div>

                      {/* Price & Rating */}
                      <div className="text-right shrink-0">
                        <div className="text-[12.5px] font-black text-[#112A46]">{price}</div>
                        {c.avg_rating && (
                          <div className="text-[11px] text-[#D97706] font-bold">
                            ★ {Number(c.avg_rating).toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* View All Results Button */}
              <div className="p-2 border-t border-[#F1F5F9] bg-[#F8FAFC]">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-2 px-3 bg-[#112A46] hover:bg-[#16385C] text-white text-xs font-bold rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>View all results for &ldquo;{query}&rdquo;</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 px-4 text-center">
              <div className="text-2xl mb-1">🔍</div>
              <div className="text-xs font-bold text-[#0B1B2E]">No courses found matching &ldquo;{query}&rdquo;</div>
              <p className="text-[11.5px] text-[#64748B] mt-1">Try searching by topic, skill, or instructor name.</p>
              <button
                type="button"
                onClick={handleSubmit}
                className="mt-3 text-xs font-bold text-[#112A46] hover:underline cursor-pointer"
              >
                Search all courses in catalog →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HeaderSearchBar(props) {
  return (
    <Suspense
      fallback={
        <div className={`header-search relative ${props.className || ''}`} style={{ width: '100%' }}>
          <div className="relative flex items-center w-full">
            <span className="icon absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none">
              <SearchIcon size={17} color="#64748B" />
            </span>
            <input
              type="text"
              className="input w-full pl-10 pr-10 h-11 text-sm bg-white border border-[#CBD5E1] rounded-full text-[#0B1B2E]"
              placeholder={props.placeholder || "Search courses, skills, technologies..."}
              readOnly
            />
          </div>
        </div>
      }
    >
      <HeaderSearchBarInner {...props} />
    </Suspense>
  )
}
