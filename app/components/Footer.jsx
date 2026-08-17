"use client"
import React, { useState } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubscribed(true)
      setEmail('')
    }, 600)
  }

  return (
    <footer className="bg-[#0B1B2E] text-white border-t border-[#1a385c] relative overflow-hidden mt-auto w-full">
      {/* Decorative top accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#ACC8E5]/50 to-transparent" />

      {/* ── Top Newsletter & Value Banner ── */}
      <div className="border-b border-white/10 w-full">
        <div className="wrap py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Value pitch */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ACC8E5]/10 border border-[#ACC8E5]/20 text-[#ACC8E5] text-[11px] font-bold uppercase tracking-wider w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ACC8E5]" />
                Silver Loft Learning Platform
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug m-0">
                Build in-demand skills. Teach the next generation of builders.
              </h2>
              <p className="text-[#ACC8E5]/80 text-sm sm:text-base m-0 max-w-xl leading-relaxed">
                Join 45,000+ students and instructors on the marketplace for modern technology, product design, and business leadership education.
              </p>
            </div>

            {/* Newsletter input */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-[#112A46] p-6 sm:p-7 rounded-2xl border border-white/15 shadow-2xl backdrop-blur-md flex flex-col gap-4">
                <div>
                  <div className="font-bold text-base text-white leading-snug">
                    Get course updates and weekly insights
                  </div>
                  <p className="text-xs text-[#ACC8E5]/70 mt-1 mb-0 leading-normal">
                    Curated tutorials, instructor spotlights, and early access to new releases.
                  </p>
                </div>

                {subscribed ? (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#16A34A]/20 border border-[#16A34A]/40 text-[#4ADE80] text-xs font-semibold">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="shrink-0">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span>You&apos;re subscribed! Check your inbox for confirmation.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full">
                    <input
                      type="email"
                      required
                      placeholder="Enter your work email..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 min-w-0 bg-[#0B1B2E] border border-[#ACC8E5]/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#ACC8E5] focus:ring-2 focus:ring-[#ACC8E5]/25 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="shrink-0 h-11 px-6 rounded-xl text-sm font-bold bg-[#ACC8E5] hover:bg-white text-[#0B1B2E] shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center"
                    >
                      {loading ? 'Subscribing...' : 'Subscribe'}
                    </button>
                  </form>
                )}
                <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                  <span>🔒</span> No spam ever. Unsubscribe with one click anytime.
                </div>
              </div>
            </div>
          </div>

          {/* Quick trust metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12 pt-10 border-t border-white/10">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#ACC8E5] shrink-0 font-extrabold text-sm shadow-inner">
                50+
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-white leading-tight truncate">Curated Courses</div>
                <div className="text-xs text-[#ACC8E5]/70 mt-0.5 leading-normal">Production curricula</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#ACC8E5] shrink-0 font-extrabold text-sm shadow-inner">
                45k+
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-white leading-tight truncate">Active Learners</div>
                <div className="text-xs text-[#ACC8E5]/70 mt-0.5 leading-normal">In 120+ countries</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#ACC8E5] shrink-0 font-extrabold text-sm shadow-inner">
                ★ 4.8
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-white leading-tight truncate">Student Rating</div>
                <div className="text-xs text-[#ACC8E5]/70 mt-0.5 leading-normal">18,000+ reviews</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#ACC8E5] shrink-0 font-extrabold text-sm shadow-inner">
                SSL
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-white leading-tight truncate">Secure Payments</div>
                <div className="text-xs text-[#ACC8E5]/70 mt-0.5 leading-normal">Stripe & 256-bit encryption</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Grid ── */}
      <div className="wrap py-14 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Link href="/" className="inline-flex items-center gap-3 w-fit">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ACC8E5] to-[#1E3F66] flex items-center justify-center text-[#0B1B2E] shadow-lg shadow-[#ACC8E5]/10 shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-display font-black text-2xl text-white tracking-tight">Silver Loft</span>
            </Link>

            <p className="text-sm text-[#ACC8E5]/80 leading-relaxed max-w-sm m-0">
              The premier marketplace LMS designed for independent instructors to build, launch, and monetize interactive courses, and for ambitious learners to master high-value skills.
            </p>

            {/* Platform status indicator */}
            <Link
              href="/courses"
              className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#C9D9EA] hover:border-white/25 hover:bg-white/10 transition-all w-fit mt-1"
            >
              <span className="inline-flex rounded-full h-2.5 w-2.5 bg-[#22C55E] animate-pulse" />
              <span>All Systems Operational</span>
            </Link>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-[#ACC8E5] hover:text-white transition-all shadow-sm"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-[#ACC8E5] hover:text-white transition-all shadow-sm"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-[#ACC8E5] hover:text-white transition-all shadow-sm"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-[#ACC8E5] hover:text-white transition-all shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 1: Explore Courses */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white m-0">
              Explore Courses
            </h3>
            <ul className="space-y-3 m-0 p-0 list-none text-sm text-[#ACC8E5]/80 font-medium">
              <li>
                <Link href="/courses" className="hover:text-white hover:underline transition-colors block py-0.5">
                  All Courses Catalog
                </Link>
              </li>
              <li>
                <Link href="/courses?category=development" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Web & Cloud Development
                </Link>
              </li>
              <li>
                <Link href="/courses?category=design" className="hover:text-white hover:underline transition-colors block py-0.5">
                  UI/UX & Product Design
                </Link>
              </li>
              <li>
                <Link href="/courses?category=data-science" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Data Science & AI / ML
                </Link>
              </li>
              <li>
                <Link href="/courses?category=business" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Startup & Financial Modeling
                </Link>
              </li>
              <li>
                <Link href="/courses?category=marketing" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Growth Marketing & SEO
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: For Instructors */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white m-0">
              For Instructors
            </h3>
            <ul className="space-y-3 m-0 p-0 list-none text-sm text-[#ACC8E5]/80 font-medium">
              <li>
                <Link href="/instructor" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Teach on Silver Loft
                </Link>
              </li>
              <li>
                <Link href="/instructor/courses/new" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Course Builder Studio
                </Link>
              </li>
              <li>
                <Link href="/instructor/earnings" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Earnings & Payouts
                </Link>
              </li>
              <li>
                <Link href="/instructor/stripe" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Stripe Connect Onboarding
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Curriculum Standards
                </Link>
              </li>
              <li>
                <Link href="/instructor" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Creator Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Student & Platform */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white m-0">
              Student Platform
            </h3>
            <ul className="space-y-3 m-0 p-0 list-none text-sm text-[#ACC8E5]/80 font-medium">
              <li>
                <Link href="/dashboard" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Account & Security
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Course Previews
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Sign In / Register
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Certificates & Badges
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white hover:underline transition-colors block py-0.5">
                  Testimonials
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom Legal & Copyright Bar ── */}
      <div className="border-t border-white/10 bg-[#071524] w-full">
        <div className="wrap py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span>© 2026 Silver Loft LMS, Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 flex-wrap justify-center font-medium">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/security" className="hover:text-white transition-colors">
              Security
            </Link>
            <Link href="/cookies" className="hover:text-white transition-colors">
              Cookie Preferences
            </Link>
          </div>

          <div className="flex items-center gap-2.5 text-[#ACC8E5]/75 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <span>🌐 English (Global)</span>
            <span className="text-white/20">•</span>
            <span className="font-semibold text-white">USD ($)</span>
          </div>
        </div>
      </div>
    </footer>
  )
}