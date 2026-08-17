"use client"
import React from 'react'

export function CourseSkeleton() {
  return (
    <div className="min-h-screen bg-[#F0F5FB] animate-pulse">
      {/* ── TOP HERO BANNER SKELETON ── */}
      <div className="bg-gradient-to-r from-[#0B1B2E] via-[#112A46] to-[#1A3D64] text-white py-12 px-6 md:px-12 border-b border-[#1A3D64]">
        <div className="wrap">
          {/* Back link placeholder */}
          <div className="w-32 h-4 rounded bg-white/20 mb-5"></div>

          <div className="max-w-3xl">
            {/* Category pill skeleton */}
            <div className="w-28 h-6 rounded-full bg-white/20 mb-3.5"></div>

            {/* Title skeleton lines */}
            <div className="w-full sm:w-4/5 h-9 md:h-11 rounded-lg bg-white/25 mb-2.5"></div>
            <div className="w-3/5 sm:w-2/3 h-9 md:h-11 rounded-lg bg-white/25 mb-4"></div>

            {/* Description skeleton lines */}
            <div className="w-full h-4 rounded bg-white/15 mb-2"></div>
            <div className="w-11/12 h-4 rounded bg-white/15 mb-2"></div>
            <div className="w-3/4 h-4 rounded bg-white/15 mb-6"></div>

            {/* Meta row skeleton */}
            <div className="flex items-center gap-5 flex-wrap">
              <div className="w-32 h-5 rounded-md bg-white/20"></div>
              <div className="w-24 h-5 rounded-md bg-white/15"></div>
              <div className="w-20 h-5 rounded-md bg-white/15"></div>
              <div className="w-20 h-5 rounded-md bg-white/15"></div>
            </div>

            {/* Instructor row skeleton */}
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/15">
              <div className="w-10 h-10 rounded-full bg-white/25 shrink-0"></div>
              <div className="space-y-1.5">
                <div className="w-24 h-3 rounded bg-white/20"></div>
                <div className="w-36 h-4 rounded bg-white/25"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY & STICKY SKELETON ── */}
      <div className="wrap py-10">
        <div className="sales-layout">
          {/* Left Column */}
          <div className="space-y-8">
            {/* What you'll learn card */}
            <div className="card p-7 shadow-sm bg-white">
              <div className="w-72 h-6 rounded-lg bg-slate-200 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 shrink-0"></div>
                    <div className="h-4 rounded bg-slate-200 flex-1"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum Accordion */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="w-40 h-6 rounded-lg bg-slate-200"></div>
                <div className="w-48 h-4 rounded bg-slate-200"></div>
              </div>

              <div className="space-y-3">
                {[1, 2, 3].map((sec) => (
                  <div key={sec} className="accordion-item bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <div className="p-4 bg-[#F8FAFC] flex justify-between items-center">
                      <div className="space-y-1.5">
                        <div className="w-56 h-4 rounded bg-slate-200"></div>
                        <div className="w-20 h-3 rounded bg-slate-100"></div>
                      </div>
                      <div className="w-4 h-4 rounded bg-slate-200"></div>
                    </div>
                    {sec === 1 && (
                      <div className="p-4 space-y-3 border-t border-[#E2E8F0]">
                        {[1, 2, 3].map((les) => (
                          <div key={les} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full bg-slate-200"></div>
                              <div className="w-64 h-3.5 rounded bg-slate-200"></div>
                            </div>
                            <div className="w-12 h-3 rounded bg-slate-200"></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Student Feedback & Ratings */}
            <div className="card p-7 shadow-sm bg-white">
              <div className="w-60 h-6 rounded-lg bg-slate-200 mb-6"></div>
              <div className="flex flex-col sm:flex-row gap-8 items-center pb-6 border-b border-[#E2E8F0]">
                <div className="text-center sm:text-left min-w-[140px] space-y-2">
                  <div className="w-20 h-10 rounded-lg bg-slate-200 mx-auto sm:mx-0"></div>
                  <div className="w-24 h-4 rounded bg-amber-100 mx-auto sm:mx-0"></div>
                  <div className="w-24 h-3 rounded bg-slate-100 mx-auto sm:mx-0"></div>
                </div>
                <div className="flex-1 w-full space-y-2.5">
                  {[1, 2, 3, 4, 5].map((b) => (
                    <div key={b} className="flex items-center gap-3">
                      <div className="w-10 h-3 rounded bg-slate-200"></div>
                      <div className="flex-1 h-2 rounded-full bg-slate-200"></div>
                      <div className="w-8 h-3 rounded bg-slate-200"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Buy Card */}
          <div className="sticky-buy">
            <div className="card modal-surface overflow-hidden bg-white shadow-md">
              {/* Video placeholder */}
              <div className="aspect-video bg-gradient-to-br from-[#112A46] to-[#0B1B2E] flex items-center justify-center relative">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white/60 border-b-8 border-b-transparent ml-1"></div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="w-28 h-8 rounded-lg bg-slate-200"></div>
                <div className="w-full h-12 rounded-xl bg-[#112A46]/25"></div>
                <div className="w-full h-9 rounded-xl bg-slate-200"></div>
                <div className="w-40 h-3 rounded bg-slate-200 mx-auto"></div>

                <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-100"></div>
                      <div className="w-48 h-3.5 rounded bg-slate-200"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CoursePlayerSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B1B2E] text-white animate-pulse">
      {/* ── TOP THEATER HEADER SKELETON ── */}
      <header className="h-16 flex items-center gap-4 px-6 bg-[#112A46] border-b border-white/15 shrink-0">
        <div className="w-36 h-8 rounded-lg bg-white/20"></div>
        <div className="h-5 w-px bg-white/20 hidden sm:block" />
        <div className="w-64 h-4 rounded bg-white/20 hidden sm:block"></div>
        <div className="ml-auto flex items-center gap-4">
          <div className="w-24 h-2 rounded bg-white/20"></div>
          <div className="w-28 h-8 rounded-lg bg-white/15"></div>
        </div>
      </header>

      {/* ── MAIN STAGE SKELETON ── */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#0B1B2E]">
          {/* Video Frame */}
          <div className="w-full bg-black flex items-center justify-center relative aspect-video max-h-[65vh] shrink-0 border-b border-white/10">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white/60 border-b-8 border-b-transparent ml-1"></div>
            </div>
            <div className="absolute bottom-4 left-6 right-6 flex items-center gap-3">
              <div className="w-10 h-3 rounded bg-white/20"></div>
              <div className="flex-1 h-1.5 rounded-full bg-white/20"></div>
              <div className="w-10 h-3 rounded bg-white/20"></div>
            </div>
          </div>

          {/* Notes area */}
          <div className="bg-white text-[#0B1B2E] p-8 md:p-10 flex-1 space-y-4">
            <div className="w-24 h-5 rounded-full bg-slate-200"></div>
            <div className="w-3/4 h-8 rounded-lg bg-slate-200"></div>
            <div className="space-y-2 pt-2">
              <div className="w-full h-4 rounded bg-slate-200"></div>
              <div className="w-5/6 h-4 rounded bg-slate-200"></div>
              <div className="w-2/3 h-4 rounded bg-slate-200"></div>
            </div>
          </div>
        </main>

        {/* Sidebar playlist */}
        <aside className="w-80 md:w-96 bg-white border-l border-[#E2E8F0] p-5 space-y-4 hidden md:block">
          <div className="w-48 h-5 rounded bg-slate-200"></div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0"></div>
              <div className="flex-1 h-4 rounded bg-slate-200"></div>
              <div className="w-10 h-3 rounded bg-slate-100"></div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="course-card animate-pulse bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
      <div className="course-thumb bg-slate-200 aspect-video w-full relative">
        <div className="w-20 h-5 rounded-full bg-white/40 m-3"></div>
      </div>
      <div className="course-body p-4 space-y-3">
        <div className="w-full h-4 rounded bg-slate-200"></div>
        <div className="w-3/4 h-4 rounded bg-slate-200"></div>
        <div className="flex items-center gap-2 pt-1">
          <div className="w-5 h-5 rounded-full bg-slate-200"></div>
          <div className="w-28 h-3 rounded bg-slate-200"></div>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <div className="w-16 h-4 rounded bg-slate-200"></div>
          <div className="w-20 h-3 rounded bg-slate-200"></div>
        </div>
      </div>
    </div>
  )
}

export function CourseCatalogSkeleton() {
  return (
    <div className="grid-courses" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
        <CourseCardSkeleton key={n} />
      ))}
    </div>
  )
}

export default CourseSkeleton

