import Link from 'next/link';
import { LogoutButton } from './LogoutButton.jsx';

/**
 * Shared top navigation for the (main) route group.
 * Server component — gets the viewer from the page (never fetches itself).
 */

// TODO: replace with your brand name.
const BRAND = 'LearnHub';

const S = {
  header: {
    position: 'sticky', top: 0, zIndex: 50, background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
  },
  inner: {
    maxWidth: 1080, margin: '0 auto', padding: '0 24px', height: 60,
    display: 'flex', alignItems: 'center', gap: 22,
  },
  brand: { fontWeight: 800, fontSize: 17, color: '#4f46e5', textDecoration: 'none' },
  nav: { display: 'flex', alignItems: 'center', gap: 16, flex: 1 },
  link: {
    color: '#475569', fontSize: 14, fontWeight: 500, textDecoration: 'none',
    padding: '6px 2px',
  },
  linkActive: { color: '#4f46e5', fontWeight: 700 },
  right: { display: 'flex', alignItems: 'center', gap: 14 },
  btnPrimary: {
    display: 'inline-block', background: '#4f46e5', color: '#fff',
    padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13.5,
    textDecoration: 'none',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: '#6366f1',
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 13, fontWeight: 700,
    overflow: 'hidden', textDecoration: 'none', flexShrink: 0,
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
};

const initials = (viewer) =>
  (viewer.display_name || viewer.email || '?')
    .split(/[\s@]+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function AppHeader({ viewer }) {
  return (
    <header style={S.header}>
      <div style={S.inner}>
        <Link href="/" style={S.brand}>
          {BRAND}
        </Link>

        <nav style={S.nav}>
          <Link href="/courses" style={S.link}>
            Courses
          </Link>
          {viewer && (
            <Link href="/dashboard" style={S.link}>
              Dashboard
            </Link>
          )}
          {viewer?.is_instructor && (
            <Link href="/dashboard" style={S.link}>
              Teach
            </Link>
          )}
          {viewer?.is_admin && (
            <Link href="/admin" style={S.link}>
              Admin
            </Link>
          )}
        </nav>

        <div style={S.right}>
          {viewer ? (
            <>
              <Link href="/dashboard" style={S.avatar} title={viewer.display_name || viewer.email}>
                {viewer.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viewer.avatar_url} alt="" style={S.avatarImg} />
                ) : (
                  initials(viewer)
                )}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" style={S.link}>
                Sign in
              </Link>
              <Link href="/login" style={S.btnPrimary}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
