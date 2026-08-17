import { getUserProfile } from '@/services/user.service.js';
import { listEnrollments } from '@/services/enrollment.service.js';
import { getEarnings, getInstructorCourseSummary } from '@/services/instructor.service.js';
import { getAnalytics } from '@/services/admin.service.js';
import { BecomeInstructorButton, StartOnboardingButton } from './DashboardButtons.jsx';

// This page reads cookies + DB state — never static-cache it.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

/* ------------------------------------------------------------------ */
/* Presentation helpers (dependency-free inline styles)               */
/* ------------------------------------------------------------------ */

const S = {
  wrap: {
    minHeight: '100vh', background: '#f6f8fb', color: '#1e293b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  inner: { maxWidth: 1080, margin: '0 auto', padding: '40px 24px 64px' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
  avatar: {
    width: 56, height: 56, borderRadius: '50%', background: '#6366f1', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  h1: { fontSize: 24, fontWeight: 700, margin: 0 },
  sub: { color: '#64748b', margin: '2px 0 0', fontSize: 14 },
  badges: { marginTop: 6 },
  badge: {
    display: 'inline-block', padding: '2px 10px', borderRadius: 999,
    fontSize: 12, fontWeight: 600, marginRight: 8,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 14, marginBottom: 34,
  },
  card: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
    padding: 18, boxShadow: '0 1px 2px rgba(15,23,42,.04)',
  },
  statLabel: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '.07em',
    color: '#94a3b8', fontWeight: 700,
  },
  statValue: { fontSize: 24, fontWeight: 700, marginTop: 6 },
  statSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  section: { marginBottom: 34 },
  sectionTitle: { fontSize: 17, fontWeight: 700, margin: '0 0 14px' },
  courseGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14,
  },
  courseTitle: { fontWeight: 600, fontSize: 15, margin: 0 },
  courseMeta: { fontSize: 12.5, color: '#64748b', marginTop: 3 },
  progressTrack: {
    height: 6, background: '#e2e8f0', borderRadius: 999,
    overflow: 'hidden', marginTop: 12,
  },
  progressFill: (pct) => ({
    width: `${pct}%`, height: '100%', borderRadius: 999,
    background: pct >= 100 ? '#22c55e' : '#6366f1',
  }),
  progressRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, fontSize: 12.5, color: '#64748b',
  },
  banner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    flexWrap: 'wrap', background: '#fef3c7', border: '1px solid #fde68a',
    borderRadius: 12, padding: '14px 16px', marginBottom: 28,
  },
  bannerTitle: { fontWeight: 700, fontSize: 14, color: '#92400e' },
  bannerText: { fontSize: 13, color: '#92400e', marginTop: 2 },
  empty: {
    background: '#fff', border: '1px dashed #cbd5e1', borderRadius: 12,
    padding: 28, textAlign: 'center', color: '#64748b', fontSize: 14,
  },
  list: { listStyle: 'none', margin: 0, padding: 0 },
  listItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    padding: '12px 0', borderBottom: '1px solid #f1f5f9',
  },
  listItemLast: { borderBottom: 'none' },
  link: { color: '#6366f1', fontWeight: 600, textDecoration: 'none', fontSize: 14 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
};

const STATUS_BADGE = {
  draft: { label: 'Draft', bg: '#f1f5f9', fg: '#475569' },
  pending_review: { label: 'In review', bg: '#fef3c7', fg: '#92400e' },
  published: { label: 'Published', bg: '#dcfce7', fg: '#166534' },
  rejected: { label: 'Rejected', bg: '#fee2e2', fg: '#991b1b' },
};

const money = (cents) =>
  '$' + (Number(cents || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

const initials = (name, email) =>
  (name || email || '?')
    .split(/[\s@]+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

function StatusBadge({ status }) {
  const b = STATUS_BADGE[status] ?? { label: status, bg: '#f1f5f9', fg: '#475569' };
  return <span style={{ ...S.badge, background: b.bg, color: b.fg }}>{b.label}</span>;
}

function Progress({ pct }) {
  return (
    <div>
      <div style={S.progressTrack}>
        <div style={S.progressFill(pct)} />
      </div>
      <div style={S.progressRow}>
        <span>{pct >= 100 ? 'Completed' : `${pct}% complete`}</span>
        {pct >= 100 && <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span>}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={S.card}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
      {sub ? <div style={S.statSub}>{sub}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default async function DashboardView({ viewer }) {
  const [profile, enrollments] = await Promise.all([
    getUserProfile(viewer.id),
    listEnrollments(viewer.id, { status: null, page: 1, limit: 6 }),
  ]);

  const learningStats = {
    total: enrollments.pagination.total,
    completed: enrollments.enrollments.filter((e) => e.progress_percent >= 100).length,
    avg_progress: enrollments.enrollments.length
      ? Math.round(
          enrollments.enrollments.reduce((sum, e) => sum + Number(e.progress_percent || 0), 0) /
            enrollments.enrollments.length
        )
      : 0,
  };

  let instructor = null;
  if (viewer.is_instructor) {
    const [earnings, myCourses] = await Promise.all([
      getEarnings(viewer.id),
      getInstructorCourseSummary(viewer.id),
    ]);
    instructor = { earnings, ...myCourses };
  }

  const analytics = viewer.is_admin ? await getAnalytics() : null;

  const onboardingIncomplete =
    profile.instructor_profile !== null &&
    profile.instructor_profile.stripe_onboarding_complete === false;

  return (
    <div style={S.wrap}>
      <div style={S.inner}>
        {/* Header */}
        <header style={S.header}>
          <div style={S.avatar}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" style={S.avatarImg} />
            ) : (
              initials(profile.display_name, profile.email)
            )}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={S.h1}>Welcome back, {profile.display_name || profile.email}</h1>
            <p style={S.sub}>{profile.email}</p>
            <div style={S.badges}>
              {viewer.is_instructor && (
                <span style={{ ...S.badge, background: '#e0e7ff', color: '#4338ca' }}>
                  Instructor
                </span>
              )}
              {viewer.is_admin && (
                <span style={{ ...S.badge, background: '#fce7f3', color: '#9d174d' }}>
                  Admin
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Instructor onboarding banner */}
        {onboardingIncomplete && (
          <div style={S.banner}>
            <div>
              <div style={S.bannerTitle}>Finish your payout setup</div>
              <div style={S.bannerText}>
                Stripe Connect onboarding is required before you can submit courses for review.
              </div>
            </div>
            <StartOnboardingButton />
          </div>
        )}

        {/* Learning stats */}
        <section style={S.section}>
          <div style={S.grid}>
            <StatCard label="Enrolled courses" value={learningStats.total} />
            <StatCard label="Completed" value={learningStats.completed} />
            <StatCard
              label="Average progress"
              value={`${learningStats.avg_progress}%`}
              sub="across all enrollments"
            />
            {viewer.is_instructor && (
              <>
                <StatCard
                  label="Available balance"
                  value={money(instructor.earnings.pending_cents)}
                  sub="not yet paid out"
                />
                <StatCard
                  label="Lifetime earnings"
                  value={money(instructor.earnings.total_earnings_cents)}
                  sub="pending + paid"
                />
              </>
            )}
          </div>
        </section>

        {/* My learning */}
        <section style={S.section}>
          <h2 style={S.sectionTitle}>My learning</h2>
          {enrollments.enrollments.length === 0 ? (
            <div style={S.empty}>
              You are not enrolled in any course yet.{' '}
              <a href="/courses" style={S.link}>
                Browse courses →
              </a>
            </div>
          ) : (
            <div style={S.courseGrid}>
              {enrollments.enrollments.map((e) => (
                <div key={e.id} style={S.card}>
                  <h3 style={S.courseTitle}>
                    <a href={`/courses/${e.course.slug}`} style={{ ...S.link, fontSize: 15 }}>
                      {e.course.title}
                    </a>
                  </h3>
                  <div style={S.courseMeta}>
                    by {e.course.instructor.display_name} · enrolled {fmtDate(e.enrolled_at)}
                  </div>
                  <Progress pct={e.progress_percent} />
                </div>
              ))}
            </div>
          )}
          {enrollments.pagination.total > enrollments.enrollments.length && (
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 12 }}>
              Showing {enrollments.enrollments.length} of {enrollments.pagination.total} courses.
            </p>
          )}
        </section>

        {/* Teach / instructor panel */}
        <section style={S.section}>
          {viewer.is_instructor ? (
            <>
              <h2 style={S.sectionTitle}>My courses</h2>
              <div style={S.grid}>
                <StatCard label="Total courses" value={instructor.summary.total} />
                <StatCard label="In review" value={instructor.summary.pending_review} />
                <StatCard label="Published" value={instructor.summary.published} />
                <StatCard
                  label="Earned (paid out)"
                  value={money(instructor.earnings.paid_cents)}
                />
              </div>
              <div style={S.card}>
                {instructor.courses.length === 0 ? (
                  <div style={S.empty}>
                    You haven&apos;t created a course yet. Create one to start teaching.
                  </div>
                ) : (
                  <ul style={S.list}>
                    {instructor.courses.map((course, i) => (
                      <li
                        key={course.id}
                        style={{ ...S.listItem, ...(i === instructor.courses.length - 1 ? S.listItemLast : {}) }}
                      >
                        <div>
                          <div style={S.courseTitle}>{course.title}</div>
                          <div style={S.courseMeta}>
                            {money(course.price_cents)} · updated {fmtDate(course.updated_at)}
                          </div>
                        </div>
                        <StatusBadge status={course.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div style={{ ...S.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ ...S.sectionTitle, margin: 0 }}>Teach what you know</h2>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748b' }}>
                  Become an instructor, create courses, and earn from every sale.
                </p>
              </div>
              <BecomeInstructorButton />
            </div>
          )}
        </section>

        {/* Admin panel */}
        {viewer.is_admin && analytics && (
          <section style={S.section}>
            <h2 style={S.sectionTitle}>Platform snapshot</h2>
            <div style={S.grid}>
              <StatCard
                label="Users"
                value={analytics.users.total}
                sub={`${analytics.users.instructors} instructors · ${analytics.users.new_last_30_days} new (30d)`}
              />
              <StatCard
                label="Courses"
                value={analytics.courses.total}
                sub={`${analytics.courses.published} published · ${analytics.courses.pending_review} in review`}
              />
              <StatCard label="Enrollments" value={analytics.enrollments.total} />
              <StatCard
                label="GMV"
                value={money(analytics.revenue.gmv_cents)}
                sub={`platform ${money(analytics.revenue.platform_revenue_cents)}`}
              />
              <StatCard
                label="Avg rating"
                value={analytics.reviews.avg_rating.toFixed(2)}
                sub={`${analytics.reviews.total} reviews`}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
