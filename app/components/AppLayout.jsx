"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon, GridIcon, BookOpenIcon, PlayIcon, CertIcon, StarIcon,
  ClockIcon, BellIcon, SearchIcon, UserIcon, DollarIcon, LinkIcon,
  UsersIcon, ChartIcon
} from './Icons'
import Footer from './Footer'
import WorkspaceFooter from './WorkspaceFooter'
import HeaderSearchBar from './HeaderSearchBar'

const STUDENT_NAV = [
  { icon: GridIcon, label: 'Dashboard', href: '/dashboard' },
  { icon: SearchIcon, label: 'Browse Courses', href: '/courses' },
  { icon: UserIcon, label: 'Account Settings', href: '/account' },
]

const INSTRUCTOR_NAV = [
  { icon: GridIcon, label: 'Studio Overview', href: '/instructor' },
  { icon: BookOpenIcon, label: 'Course Builder', href: '/instructor/courses/new' },
  { icon: DollarIcon, label: 'Earnings & Payouts', href: '/instructor/earnings' },
  { icon: LinkIcon, label: 'Stripe Onboard', href: '/instructor/stripe' },
  { icon: SearchIcon, label: 'Marketplace', href: '/courses' },
  { icon: UserIcon, label: 'Account Settings', href: '/account' },
]

const ADMIN_NAV = [
  { icon: GridIcon, label: 'Platform Overview', href: '/admin' },
  { icon: ClockIcon, label: 'Review Queue', href: '/admin/pending' },
  { icon: UsersIcon, label: 'Users & Roles', href: '/admin/users' },
  { icon: ChartIcon, label: 'Financial Analytics', href: '/admin/analytics' },
  { icon: SearchIcon, label: 'Marketplace', href: '/courses' },
  { icon: UserIcon, label: 'Account Settings', href: '/account' },
]

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [role, setRole] = useState('student')
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  // Close drawers when route changes
  useEffect(() => {
    setMobileDrawerOpen(false)
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
    setUserDropdownOpen(false)
  }, [pathname])

  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      setRole('admin')
    } else if (pathname?.startsWith('/instructor')) {
      setRole('instructor')
    } else {
      setRole('student')
    }

    // Fetch active user profile from SQL
    fetch('/api/v1/users/me')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setUser(json.data)
          if (pathname?.startsWith('/instructor') && json.data.is_instructor) {
            setRole('instructor')
          }
        } else {
          setUser(null)
        }
        setAuthChecked(true)
      })
      .catch(() => {
        setUser(null)
        setAuthChecked(true)
      })
  }, [pathname])

  const isSuperAdmin = user?.email === 'hafizmfaizanali@gmail.com' || Boolean(user?.is_admin)
  const isAdminRoute = pathname?.startsWith('/admin')

  const navItems = (isAdminRoute && isSuperAdmin)
    ? ADMIN_NAV
    : role === 'instructor'
    ? INSTRUCTOR_NAV
    : STUDENT_NAV

  const isAuthPage = ['/login', '/signup', '/verify', '/forgot-password', '/forget'].some(p => pathname?.startsWith(p))
  const isPlayerPage = pathname?.startsWith('/learn')

  // Auth pages & player have dedicated full-screen layouts
  if (isAuthPage || isPlayerPage) {
    return <>{children}</>
  }

  const isMarketingPage = pathname === '/' || pathname?.startsWith('/courses') || pathname?.startsWith('/checkout')

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    setMobileDrawerOpen(false)
    if (newRole === 'student') router.push('/dashboard')
    else if (newRole === 'instructor') router.push('/instructor')
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/v1/auth/session', { method: 'DELETE' })
      setUser(null)
      router.push('/login')
    } catch (e) {
      router.push('/login')
    }
  }

  const displayName = user?.display_name || user?.email?.split('@')[0] || (role === 'instructor' ? 'Instructor' : 'Student')
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SL'

  // ─────────────────────────────────────────────────────────────
  // 1. PUBLIC MARKETPLACE VIEW (Header + Main Content + Footer)
  // ─────────────────────────────────────────────────────────────
  if (isMarketingPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F0F5FB]">
        {/* Site Header */}
        <header className="site-header">
          <div className="wrap bar">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#112A46] hover:bg-[#EAF1FA] transition-colors cursor-pointer"
              aria-label="Open mobile menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <Link href="/" className="logo">
              <span className="mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="font-display font-black text-lg sm:text-xl text-[#112A46]">Silver Loft</span>
            </Link>

            <nav className="nav-links hidden md:flex">
              <Link href="/courses" className={pathname?.startsWith('/courses') ? 'active' : ''}>
                Courses Catalog
              </Link>
              <Link href="/instructor">
                Teach on Silver Loft
              </Link>
            </nav>

            {/* Global Search Bar (Desktop / Tablet) */}
            <div className="hidden sm:block flex-1 max-w-md mx-2">
              <HeaderSearchBar />
            </div>

            {/* Header Actions */}
            <div className="header-actions">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="sm:hidden p-2 rounded-xl text-[#334155] hover:bg-[#EAF1FA] transition-colors cursor-pointer"
                aria-label="Toggle search"
              >
                <SearchIcon size={19} color="#112A46" />
              </button>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-[#EAF1FA] transition-colors cursor-pointer"
                  >
                    <div className="avatar text-xs">{initials}</div>
                    <span className="hidden sm:inline text-[13px] font-bold text-[#112A46] leading-tight truncate max-w-[120px]">{displayName}</span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(17,42,70,0.15)] border border-[#E2E8F0] p-2 z-50">
                      <div className="px-3 py-2 border-b border-[#F1F5F9] mb-1">
                        <div className="font-bold text-[13.5px] text-[#112A46] truncate">{displayName}</div>
                        <div className="text-[11.5px] text-[#64748B] truncate">{user.email}</div>
                      </div>
                      <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-semibold text-[#334155] hover:bg-[#F0F5FB] hover:text-[#112A46]">
                        <GridIcon size={16} /> Student Dashboard
                      </Link>
                      <Link href="/instructor" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-semibold text-[#334155] hover:bg-[#F0F5FB] hover:text-[#112A46]">
                        <BookOpenIcon size={16} /> Instructor Studio
                      </Link>
                      {isSuperAdmin && (
                        <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-semibold text-[#7C3AED] hover:bg-[#EDE9FE]">
                          <ChartIcon size={16} /> Admin Portal
                        </Link>
                      )}
                      <Link href="/account" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-semibold text-[#334155] hover:bg-[#F0F5FB] hover:text-[#112A46]">
                        <UserIcon size={16} /> Account Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full mt-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-bold text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="btn btn-ghost btn-sm font-bold text-xs sm:text-sm px-3 sm:px-4">
                    Log in
                  </Link>
                  <Link href="/signup" className="btn btn-primary btn-sm font-bold text-xs sm:text-sm px-3 sm:px-4 shadow-sm">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Row (when open) */}
          {mobileSearchOpen && (
            <div className="sm:hidden px-4 pb-3 pt-1 border-t border-[#F1F5F9] bg-white">
              <HeaderSearchBar autoFocus onAfterNavigate={() => setMobileSearchOpen(false)} />
            </div>
          )}
        </header>

        {/* Mobile Navigation Drawer for Public Marketplace */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
            <div className="drawer-panel p-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-4">
                <Link href="/" className="logo" style={{ color: '#FFFFFF' }} onClick={() => setMobileMenuOpen(false)}>
                  <span className="mark">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#ACC8E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="font-bold">Silver Loft</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[#ACC8E5] hover:text-white"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1 flex-1 overflow-y-auto">
                <div className="side-label text-[#ACC8E5]">Explore</div>
                <Link
                  href="/courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`side-link ${pathname?.startsWith('/courses') ? 'active' : ''}`}
                >
                  <SearchIcon size={18} />
                  <span>Courses Catalog</span>
                </Link>
                <Link
                  href="/instructor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="side-link"
                >
                  <BookOpenIcon size={18} />
                  <span>Teach on Silver Loft</span>
                </Link>

                {user && (
                  <>
                    <div className="side-label text-[#ACC8E5] mt-4">My Account</div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="side-link"
                    >
                      <GridIcon size={18} />
                      <span>Student Dashboard</span>
                    </Link>
                    <Link
                      href="/instructor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="side-link"
                    >
                      <BookOpenIcon size={18} />
                      <span>Instructor Studio</span>
                    </Link>
                    {isSuperAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="side-link text-[#C084FC]"
                      >
                        <ChartIcon size={18} />
                        <span>Admin Portal</span>
                      </Link>
                    )}
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="side-link"
                    >
                      <UserIcon size={18} />
                      <span>Account Settings</span>
                    </Link>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-white/15">
                {user ? (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="avatar text-xs" style={{ width: 34, height: 34 }}>{initials}</div>
                      <div className="overflow-hidden flex-1">
                        <div className="text-xs font-bold text-white truncate">{displayName}</div>
                        <div className="text-[11px] text-[#ACC8E5] truncate">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full py-2.5 rounded-xl border border-white/20 text-[#ACC8E5] text-xs font-bold hover:bg-white/10"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-secondary btn-sm text-xs font-bold w-full"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-primary btn-sm text-xs font-bold w-full bg-[#ACC8E5] text-[#112A46]"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Public Content Body */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

        {/* Global Public Marketplace Footer */}
        <Footer />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 2. AUTHENTICATED WORKSPACE VIEW (Sidebar + Topbar + Content)
  // ─────────────────────────────────────────────────────────────

  // If auth is still checking, show a clean loading screen
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F0F5FB] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 rounded-full border-3 border-[#112A46] border-t-transparent animate-spin mb-3"></div>
        <p className="text-sm font-bold text-[#112A46]">Loading workspace...</p>
      </div>
    )
  }

  // If user is not authenticated on a protected workspace route, redirect to login
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0F5FB] flex flex-col items-center justify-center p-6 text-center">
        <div className="card p-8 max-w-md w-full text-center shadow-lg">
          <div className="text-3xl mb-3">🔒</div>
          <h2 className="h-card text-lg text-[#112A46] font-bold mb-2">Authentication Required</h2>
          <p className="text-xs text-[#64748B] mb-6 leading-relaxed">
            Please log in to access your course dashboard, learning materials, and instructor settings.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`}
              className="btn btn-primary btn-sm font-bold w-full"
            >
              Sign In to Continue →
            </Link>
          </div>
          <div className="mt-4">
            <Link href="/" className="text-xs text-[#64748B] hover:text-[#112A46] underline">
              ← Return to marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* ── Desktop Sidebar ── */}
      <aside
        className="app-sidebar hidden md:flex"
        style={{
          width: sidebarOpen ? 250 : 76,
          minWidth: sidebarOpen ? 250 : 76,
          transition: 'width 0.22s ease, min-width 0.22s ease',
        }}
      >
        {/* Logo */}
        <Link href="/" className="logo" style={{ color: '#FFFFFF', padding: '0 8px', overflow: 'hidden' }}>
          <span className="mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#ACC8E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {sidebarOpen && <span className="font-bold">Silver Loft</span>}
        </Link>

        {/* Role switcher */}
        {sidebarOpen && !isAdminRoute && (
          <div style={{ backgroundColor: 'rgba(172,200,229,0.15)', borderRadius: 10, padding: 4, display: 'flex', gap: 2 }}>
            {['student', 'instructor'].map(r => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11.5, fontWeight: 800, textTransform: 'capitalize',
                  backgroundColor: role === r ? '#FFFFFF' : 'transparent',
                  color: role === r ? '#112A46' : '#C9D9EA',
                  transition: 'all 0.15s',
                }}
              >
                {r === 'student' ? '🎓 Student' : '🎤 Instructor'}
              </button>
            ))}
          </div>
        )}

        {/* Navigation Group */}
        <div className="side-group" style={{ flex: 1 }}>
          {sidebarOpen && (
            <div className="side-label">
              {isAdminRoute ? 'Admin Portal' : role === 'instructor' ? 'Instructor Studio' : 'Student Learning'}
            </div>
          )}

          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href)
            return (
              <Link
                key={label}
                href={href}
                className={`side-link ${isActive ? 'active' : ''}`}
                style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
              >
                <Icon size={19} color={isActive ? '#ACC8E5' : '#ACC8E5'} />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            )
          })}
        </div>

        {/* Back to Marketplace link */}
        <div style={{ marginTop: 'auto' }}>
          <Link
            href="/"
            className="side-link"
            style={{ color: '#ACC8E5', fontSize: 13, fontWeight: 700 }}
          >
            <span style={{ fontSize: 16 }}>←</span>
            {sidebarOpen && <span>Back to Marketplace</span>}
          </Link>
        </div>

        {/* User profile & Sign Out */}
        <div style={{ paddingTop: 14, borderTop: '1px solid rgba(172,200,229,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px', borderRadius: 10, marginBottom: 8 }}>
            <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{initials}</div>
            {sidebarOpen && (
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: 1.3 }}>{displayName}</div>
                <div style={{ fontSize: 11, color: '#ACC8E5', textTransform: 'capitalize', lineHeight: 1.2 }}>
                  {isAdminRoute ? 'Administrator' : role === 'instructor' ? 'Instructor' : 'Student'}
                </div>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <button
              onClick={handleSignOut}
              style={{ width: '100%', padding: '7px', borderRadius: 8, border: '1px solid rgba(172,200,229,0.25)', backgroundColor: 'transparent', color: '#ACC8E5', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
            >
              Sign out
            </button>
          )}
        </div>

        {/* Sidebar Collapse Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute', right: -12, top: 32, width: 24, height: 24, borderRadius: '50%',
            border: '1.5px solid #E2E8F0', backgroundColor: '#FFFFFF', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
            boxShadow: '0 2px 8px rgba(17,42,70,0.12)'
          }}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d={sidebarOpen ? 'M6 2L4 5l2 3' : 'M4 2l2 3-2 3'} stroke="#64748B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </aside>

      {/* ── Mobile Drawer (Slide-out navigation for screens < 900px) ── */}
      {mobileDrawerOpen && (
        <div className="md:hidden">
          <div className="drawer-backdrop" onClick={() => setMobileDrawerOpen(false)} />
          <div className="drawer-panel p-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-4">
              <Link href="/" className="logo" style={{ color: '#FFFFFF' }} onClick={() => setMobileDrawerOpen(false)}>
                <span className="mark">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#ACC8E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="font-bold">Silver Loft</span>
              </Link>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-[#ACC8E5] hover:text-white"
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>

            {/* Role switcher inside mobile drawer */}
            {!isAdminRoute && (
              <div className="mb-4" style={{ backgroundColor: 'rgba(172,200,229,0.15)', borderRadius: 10, padding: 4, display: 'flex', gap: 2 }}>
                {['student', 'instructor'].map(r => (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 11.5, fontWeight: 800, textTransform: 'capitalize',
                      backgroundColor: role === r ? '#FFFFFF' : 'transparent',
                      color: role === r ? '#112A46' : '#C9D9EA',
                      transition: 'all 0.15s',
                    }}
                  >
                    {r === 'student' ? '🎓 Student' : '🎤 Instructor'}
                  </button>
                ))}
              </div>
            )}

            {/* Navigation Group */}
            <div className="side-group flex-1 overflow-y-auto space-y-1">
              <div className="side-label text-[#ACC8E5]">
                {isAdminRoute ? 'Admin Portal' : role === 'instructor' ? 'Instructor Studio' : 'Student Learning'}
              </div>

              {navItems.map(({ icon: Icon, label, href }) => {
                const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href)
                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`side-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} color="#ACC8E5" />
                    <span>{label}</span>
                  </Link>
                )
              })}

              <div className="pt-2">
                <Link
                  href="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="side-link text-[#ACC8E5] font-bold"
                >
                  <span>← Back to Marketplace</span>
                </Link>
              </div>
            </div>

            {/* User footer inside drawer */}
            <div className="pt-4 border-t border-white/15 mt-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="avatar text-xs" style={{ width: 34, height: 34 }}>{initials}</div>
                <div className="overflow-hidden flex-1">
                  <div className="text-xs font-bold text-white truncate">{displayName}</div>
                  <div className="text-[11px] text-[#ACC8E5] capitalize truncate">
                    {isAdminRoute ? 'Administrator' : role === 'instructor' ? 'Instructor' : 'Student'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-2 rounded-lg border border-white/20 text-[#ACC8E5] text-xs font-bold hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── App Main Stage ── */}
      <div className="app-main flex flex-col min-h-screen pb-16 md:pb-0">
        {/* Topbar */}
        <header className="app-topbar">
          {/* Mobile Drawer Trigger Button */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-xl text-[#112A46] hover:bg-[#EAF1FA] transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="h-section text-sm sm:text-base md:text-lg truncate max-w-[180px] sm:max-w-none" style={{ margin: 0, color: '#112A46' }}>
            {isAdminRoute ? 'Admin Control Center' : role === 'instructor' ? 'Instructor Studio' : 'Learning Dashboard'}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="hidden lg:block" style={{ width: 260 }}>
              <HeaderSearchBar placeholder="Quick course search..." />
            </div>

            <Link href="/courses" className="btn btn-secondary btn-sm hidden sm:inline-flex font-bold text-xs">
              Explore Courses
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid #E2E8F0' }}>
              <div className="avatar text-xs" style={{ width: 34, height: 34 }}>{initials}</div>
              <div className="hidden sm:block">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1B2E', lineHeight: 1.2 }}>{displayName}</div>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'capitalize', lineHeight: 1.2 }}>
                  {isAdminRoute ? 'Administrator' : role === 'instructor' ? 'Instructor' : 'Student'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="app-content flex-1">
          {children}
        </main>

        {/* Dedicated Workspace Footer */}
        <WorkspaceFooter />

        {/* ── Mobile Bottom Navigation Bar (Screens < 768px) ── */}
        <nav className="mobile-bottom-nav md:hidden">
          <Link
            href={role === 'instructor' ? '/instructor' : '/dashboard'}
            className={`mobile-nav-item ${(pathname === '/dashboard' || pathname === '/instructor') ? 'active' : ''}`}
          >
            <GridIcon size={18} />
            <span>{role === 'instructor' ? 'Studio' : 'Dashboard'}</span>
          </Link>

          <Link
            href="/courses"
            className={`mobile-nav-item ${pathname?.startsWith('/courses') ? 'active' : ''}`}
          >
            <SearchIcon size={18} />
            <span>Browse</span>
          </Link>

          {role === 'instructor' && (
            <Link
              href="/instructor/earnings"
              className={`mobile-nav-item ${pathname?.startsWith('/instructor/earnings') ? 'active' : ''}`}
            >
              <DollarIcon size={18} />
              <span>Earnings</span>
            </Link>
          )}

          <Link
            href="/account"
            className={`mobile-nav-item ${pathname?.startsWith('/account') ? 'active' : ''}`}
          >
            <UserIcon size={18} />
            <span>Account</span>
          </Link>

          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="mobile-nav-item border-none bg-transparent cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
            <span>Menu</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
