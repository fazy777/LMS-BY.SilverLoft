import { query } from '../lib/db.js';
import { AppError } from '../lib/errors.js';

/**
 * Course business logic — reusable outside HTTP context.
 * Mirrors the courses / categories tables (LMS_ARCHITECTURE.md §4).
 */

export const COURSE_SELECT = `
  c.id, c.title, c.slug, c.description, c.thumbnail_url,
  c.price_cents, c.currency, c.avg_rating, c.review_count,
  c.status, c.rejection_reason,
  c.created_at, c.updated_at, c.published_at,
  cat.id AS category_id, cat.name AS category_name, cat.slug AS category_slug,
  u.id AS instructor_id, u.display_name AS instructor_name`;

/**
 * Shape a course row for the API.
 * Numeric/boolean columns are normalized (mysql2 may return BIGINT/DECIMAL
 * as strings because supportBigNumbers is enabled in lib/db.js).
 * rejection_reason is null except on rejected courses (owner/admin only
 * ever see those).
 */
export function toCourseDTO(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnail_url: row.thumbnail_url,
    price_cents: row.price_cents,
    currency: row.currency,
    avg_rating: row.avg_rating == null ? null : Number(row.avg_rating),
    review_count: Number(row.review_count ?? 0),
    status: row.status,
    rejection_reason: row.rejection_reason,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
    instructor: { id: row.instructor_id, display_name: row.instructor_name },
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
  };
}

/**
 * Fetch one live (non-deleted) course row by identifier — numeric id OR slug
 * (architecture §5: single [id] param, detect numeric-vs-slug in the handler).
 * Returns the raw joined row; throws 404 when missing or soft-deleted.
 */
export async function fetchCourseRow(identifier) {
  const isNumeric = /^\d+$/.test(String(identifier));
  const [rows] = await query(
    `SELECT ${COURSE_SELECT}
       FROM courses c
       JOIN categories cat ON cat.id = c.category_id
       JOIN users u ON u.id = c.instructor_id
      WHERE c.deleted_at IS NULL AND ${isNumeric ? 'c.id = ?' : 'c.slug = ?'}
      LIMIT 1`,
    [isNumeric ? Number(identifier) : identifier]
  );
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Course not found.', 404);
  }
  return rows[0];
}

/** Fetch one live course by id — reused by POST /courses (response) etc. */
export async function getCourseById(id) {
  return toCourseDTO(await fetchCourseRow(id));
}

/**
 * GET /courses/[id] — public course detail by id or slug.
 *
 * Visibility: published courses are public. Draft/pending/rejected courses
 * are visible only to the owning instructor or an admin — everyone else
 * gets a plain 404 so unpublished work never leaks.
 */
export async function getCourseByIdentifier(identifier, viewer = null) {
  const row = await fetchCourseRow(identifier);
  if (row.status !== 'published') {
    const isOwner = viewer !== null && viewer.id === row.instructor_id;
    const isAdmin = viewer !== null && viewer.is_admin;
    if (!isOwner && !isAdmin) {
      throw new AppError('NOT_FOUND', 'Course not found.', 404);
    }
  }
  return toCourseDTO(row);
}

/**
 * PATCH /courses/[id] — partial update by the owning instructor.
 * MVP: published courses may be edited without a fresh admin review
 * (product decision — flag here if that changes).
 */
export async function updateCourse(identifier, instructorId, data) {
  const course = await fetchCourseRow(identifier); // 404 if missing/soft-deleted
  if (course.instructor_id !== instructorId) {
    throw new AppError('NOT_COURSE_OWNER', 'You can only edit your own courses.', 403);
  }

  // Published slugs are public URLs — only editable while the course is a draft.
  if (data.slug !== undefined && data.slug !== course.slug && course.status !== 'draft') {
    throw new AppError('SLUG_IMMUTABLE', 'The slug can only be changed while the course is a draft.', 400);
  }

  if (data.category_id !== undefined && data.category_id !== course.category_id) {
    const [catRows] = await query('SELECT id FROM categories WHERE id = ? LIMIT 1', [data.category_id]);
    if (catRows.length === 0) {
      throw new AppError('INVALID_CATEGORY', 'category_id does not match an existing category.', 400);
    }
  }

  const sets = [];
  const values = [];
  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.slug !== undefined) { sets.push('slug = ?'); values.push(data.slug); }
  // null explicitly clears the column (proper PATCH semantics)
  if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
  if (data.category_id !== undefined) { sets.push('category_id = ?'); values.push(data.category_id); }
  if (data.price_cents !== undefined) { sets.push('price_cents = ?'); values.push(data.price_cents); }
  if (data.currency !== undefined) { sets.push('currency = ?'); values.push(data.currency); }
  if (data.thumbnail_url !== undefined) { sets.push('thumbnail_url = ?'); values.push(data.thumbnail_url); }
  if (data.status !== undefined) {
    sets.push('status = ?');
    values.push(data.status);
    if (data.status === 'published') {
      sets.push('published_at = COALESCE(published_at, CURRENT_TIMESTAMP)');
    }
  }

  if (sets.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Nothing to update.', 400);
  }

  try {
    await query(
      `UPDATE courses
          SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL`,
      [...values, course.id]
    );
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      throw new AppError('SLUG_TAKEN', 'This slug is already taken. Choose another.', 409);
    }
    throw err;
  }

  return getCourseById(course.id);
}

/**
 * DELETE /courses/[id] — SOFT delete by the owning instructor.
 * Sets deleted_at; the row (and any financial history) is never hard-deleted
 * (architecture §4). Already-deleted rows 404 via fetchCourseRow.
 */
export async function softDeleteCourse(identifier, instructorId) {
  const course = await fetchCourseRow(identifier);
  if (course.instructor_id !== instructorId) {
    throw new AppError('NOT_COURSE_OWNER', 'You can only delete your own courses.', 403);
  }

  await query(
    'UPDATE courses SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
    [course.id]
  );

  const [rows] = await query('SELECT deleted_at FROM courses WHERE id = ?', [course.id]);
  return { id: course.id, deleted_at: rows[0].deleted_at };
}

/**
 * Ownership assertion (404 when missing/soft-deleted, 403 when not owner).
 * Exported so routes can enforce ownership BEFORE additional pre-flight
 * gates (e.g. the email-verification gate on POST /courses/[id]/submit).
 */
export async function assertCourseOwner(identifier, instructorId) {
  const course = await fetchCourseRow(identifier);
  if (course.instructor_id !== instructorId) {
    throw new AppError('NOT_COURSE_OWNER', 'You can only manage your own courses.', 403);
  }
  return course;
}

/**
 * POST /courses/[id]/submit — owner promotes the course to admin review.
 *
 * Status must be 'draft' or 'rejected' (resubmission clears rejection_reason).
 * Gates, in order: ownership → status → Stripe onboarding complete
 * (architecture §1: onboarding gates course submission) → content
 * completeness (description, thumbnail, ≥ 1 lesson).
 */
export async function submitCourseForReview(identifier, instructorId) {
  const course = await assertCourseOwner(identifier, instructorId);

  if (course.status === 'pending_review') {
    throw new AppError('ALREADY_PENDING_REVIEW', 'This course is already pending review.', 409);
  }
  if (course.status === 'published') {
    throw new AppError('ALREADY_PUBLISHED', 'This course is already published.', 409);
  }

  // Stripe Connect onboarding must be complete before submission (architecture §1).
  const [profileRows] = await query(
    'SELECT stripe_onboarding_complete FROM instructor_profiles WHERE user_id = ? LIMIT 1',
    [instructorId]
  );
  if (profileRows.length === 0 || !profileRows[0].stripe_onboarding_complete) {
    throw new AppError(
      'STRIPE_ONBOARDING_INCOMPLETE',
      'Complete Stripe Connect onboarding before submitting courses.',
      403
    );
  }

  // Light readiness checks — easy to relax later if the product decides to.
  if (!course.description) {
    throw new AppError('COURSE_INCOMPLETE', 'Add a description before submitting.', 400);
  }
  if (!course.thumbnail_url) {
    throw new AppError('COURSE_INCOMPLETE', 'Add a thumbnail before submitting.', 400);
  }
  const [lessonCountRows] = await query(
    `SELECT COUNT(*) AS lesson_count
       FROM lessons l
       JOIN sections s ON s.id = l.section_id
      WHERE s.course_id = ?`,
    [course.id]
  );
  if (Number(lessonCountRows[0].lesson_count) === 0) {
    throw new AppError('COURSE_INCOMPLETE', 'Add at least one lesson before submitting.', 400);
  }

  const [result] = await query(
    `UPDATE courses
        SET status = 'pending_review', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status IN ('draft', 'rejected')`,
    [course.id]
  );
  if (result.affectedRows === 0) {
    // A concurrent submit flipped the status between our check and this update.
    throw new AppError('ALREADY_PENDING_REVIEW', 'This course is already pending review.', 409);
  }

  return getCourseById(course.id);
}

/** 'The Art of MySQL' → 'the-art-of-mysql' (accent-stripped, hyphenated). */
export function slugify(text) {
  const slug = String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'course';
}

const ORDER_BY = {
  newest: 'c.published_at DESC, c.id DESC',
  rating: 'c.avg_rating DESC, c.review_count DESC, c.id DESC',
  popular: 'c.review_count DESC, c.id DESC',
  price_asc: 'c.price_cents ASC, c.id ASC',
  price_desc: 'c.price_cents DESC, c.id DESC',
};

/**
 * Public course browse/search for GET /courses.
 * Only published, non-deleted courses (architecture §1: admin approval
 * gates public visibility). Filters are pre-validated by
 * parseListCoursesParams — values are always parameterized.
 *
 * `q` uses the FULLTEXT index on (title, description) in NATURAL LANGUAGE
 * MODE. Note: InnoDB ignores terms shorter than innodb_ft_min_token_size
 * (default 3) — a 1-2 char query returns no matches by design.
 */
export async function listCourses({ q, category, sort, page, limit }) {
  const where = [`c.status = 'published'`, `c.deleted_at IS NULL`];
  const params = [];

  if (q) {
    where.push('(c.title LIKE ? OR c.description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  if (category) {
    // numeric → category id, otherwise slug (same id-vs-slug convention
    // the architecture specifies for /courses/[id]).
    if (/^\d+$/.test(category)) {
      where.push('cat.id = ?');
      params.push(Number(category));
    } else {
      where.push('cat.slug = ?');
      params.push(category);
    }
  }

  const whereSql = where.join(' AND ');

  const [countRows] = await query(
    `SELECT COUNT(*) AS total
       FROM courses c
       JOIN categories cat ON cat.id = c.category_id
      WHERE ${whereSql}`,
    params
  );
  const total = Number(countRows[0].total);
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const safeOffset = Math.max(0, (safePage - 1) * safeLimit);

  const [rows] = await query(
    `SELECT ${COURSE_SELECT}
       FROM courses c
       JOIN categories cat ON cat.id = c.category_id
       JOIN users u ON u.id = c.instructor_id
      WHERE ${whereSql}
      ORDER BY ${ORDER_BY[sort]}
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return {
    courses: rows.map(toCourseDTO),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      total_pages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Instructor creates a draft course (POST /courses).
 * status is ALWAYS 'draft' — publishing requires submit + admin review.
 * The instructor is the authenticated user (auth.id), never the body.
 *
 * Slug: use the client-supplied slug exactly (409 if taken), or derive it
 * from the title and retry with a numeric suffix on unique-key collision —
 * race-safe because the INSERT is the source of truth.
 */
export async function createCourse(instructorId, data) {
  const { title, slug, description, category_id, price_cents, currency, thumbnail_url } = data;

  const [catRows] = await query(
    'SELECT id FROM categories WHERE id = ? LIMIT 1',
    [category_id]
  );
  if (catRows.length === 0) {
    throw new AppError('INVALID_CATEGORY', 'category_id does not match an existing category.', 400);
  }

  const baseSlug = slug || slugify(title);
  const maxAttempts = slug ? 1 : 20; // user slug: exact only; auto slug: retry with suffix
  const courseStatus = data.status || 'draft';

  let finalSlug = baseSlug;
  for (let attempt = 1; ; attempt++) {
    try {
      const [result] = await query(
        `INSERT INTO courses
           (instructor_id, category_id, title, slug, description, thumbnail_url, price_cents, currency, status, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          instructorId,
          category_id,
          title,
          finalSlug,
          description || null,   // empty-string description → NULL
          thumbnail_url || null,
          price_cents,
          currency,
          courseStatus,
          courseStatus === 'published' ? new Date() : null,
        ]
      );
      return getCourseById(result.insertId);
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        if (attempt >= maxAttempts) {
          throw slug
            ? new AppError('SLUG_TAKEN', 'This slug is already taken. Choose another.', 409)
            : new AppError('SLUG_CONFLICT', 'Could not generate a unique slug.', 500);
        }
        finalSlug = `${baseSlug}-${attempt + 1}`;
        continue;
      }
      throw err;
    }
  }
}
