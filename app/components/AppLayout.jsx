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
  const [role, setRole] = useState('student')
  const [user, setUser] = useState(null)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

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
        }
      })
      .catch(() => {})
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

  const displayName = user?.display_name || (user?.email === 'hafizmfaizanali@gmail.com' ? 'Faizan Ali' : role === 'instructor' ? 'Instructor' : 'Student')
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  // ─────────────────────────────────────────────────────────────
  // 1. PUBLIC MARKETPLACE VIEW (Header + Main Content + Footer)
  // ─────────────────────────────────────────────────────────────
  if (isMarketingPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F0F5FB]">
        {/* Site Header */}
        <header className="site-header">
          <div className="wrap bar">
            <Link href="/" className="logo">
              <span className="mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Silver Loft
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
                    className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#EAF1FA] transition-colors cursor-pointer"
                  >
                    <div className="avatar">{initials}</div>
                    <span className="hidden sm:inline text-[13.5px] font-bold text-[#112A46] leading-tight">{displayName}</span>
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
                <>
                  <Link href="/login" className="btn btn-ghost btn-sm font-bold">
                    Log in
                  </Link>
                  <Link href="/signup" className="btn btn-primary btn-sm font-bold shadow-sm">
                    Sign up
                  </Link>
                </>
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
  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside
        className="app-sidebar"
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
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d={sidebarOpen ? 'M6 2L4 5l2 3' : 'M4 2l2 3-2 3'} stroke="#64748B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </aside>

      {/* ── App Main Stage ── */}
      <div className="app-main flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="app-topbar">
          <div className="h-section" style={{ margin: 0, color: '#112A46' }}>
            {isAdminRoute ? 'Admin Control Center' : role === 'instructor' ? 'Instructor Studio' : 'Learning Dashboard'}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="hidden lg:block" style={{ width: 280 }}>
              <HeaderSearchBar placeholder="Quick course search..." />
            </div>

            <Link href="/courses" className="btn btn-secondary btn-sm hidden sm:inline-flex font-bold">
              Explore Courses
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1px solid #E2E8F0' }}>
              <div className="avatar" style={{ width: 36, height: 36 }}>{initials}</div>
              <div className="hidden sm:block">
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1B2E', lineHeight: 1.2 }}>{displayName}</div>
                <div style={{ fontSize: 11.5, color: '#64748B', textTransform: 'capitalize', lineHeight: 1.2, marginTop: 2 }}>
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
      </div>
    </div>
  )
}
