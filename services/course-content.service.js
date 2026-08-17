import { query, transaction } from '../lib/db.js';
import { AppError } from '../lib/errors.js';
import { fetchCourseRow } from './course.service.js';

/**
 * Sections + lessons business logic (architecture §4/§5).
 * All mutations are owner-only; positions are assigned server-side as
 * MAX(position)+1 under a row lock, so the UNIQUE(course_id, position) /
 * UNIQUE(section_id, position) constraints can never be raced.
 */

function toSectionDTO(row) {
  return { id: row.id, course_id: row.course_id, title: row.title, position: row.position };
}

function toLessonDTO(row, { includeContent = true } = {}) {
  const dto = {
    id: row.id,
    section_id: row.section_id,
    title: row.title,
    content_type: row.content_type,
    video_id: row.video_id,
    duration_seconds: Number(row.duration_seconds ?? 0),
    position: row.position,
    is_preview: Boolean(row.is_preview),
  };
  if (includeContent) dto.text_content = row.text_content;
  return dto;
}

/** Ownership gate for content on a course identified by numeric id or slug. */
async function getCourseOwned(identifier, instructorId) {
  const course = await fetchCourseRow(identifier); // 404 if missing/soft-deleted
  if (course.instructor_id !== instructorId) {
    throw new AppError('NOT_COURSE_OWNER', 'You can only manage content on your own courses.', 403);
  }
  return course;
}

/** Ownership gate for a section (numeric id). */
export async function getSectionOwned(sectionId, instructorId) {
  const [rows] = await query(
    `SELECT s.id, s.course_id, s.title, s.position, c.instructor_id
       FROM sections s
       JOIN courses c ON c.id = s.course_id
      WHERE s.id = ? AND c.deleted_at IS NULL
      LIMIT 1`,
    [sectionId]
  );
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Section not found.', 404);
  }
  if (rows[0].instructor_id !== instructorId) {
    throw new AppError('NOT_COURSE_OWNER', 'You can only manage content on your own courses.', 403);
  }
  return rows[0];
}

/** Ownership gate for a lesson (numeric id). */
export async function getLessonOwned(lessonId, instructorId) {
  const [rows] = await query(
    `SELECT l.*, c.instructor_id
       FROM lessons l
       JOIN sections s ON s.id = l.section_id
       JOIN courses c ON c.id = s.course_id
      WHERE l.id = ? AND c.deleted_at IS NULL
      LIMIT 1`,
    [lessonId]
  );
  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'Lesson not found.', 404);
  }
  if (rows[0].instructor_id !== instructorId) {
    throw new AppError('NOT_COURSE_OWNER', 'You can only manage content on your own courses.', 403);
  }
  return rows[0];
}

/**
 * GET /courses/[id]/sections — curriculum listing.
 * Published courses are public; otherwise owner/admin only (plain 404 for
 * everyone else, matching GET /courses/[id]). `text_content` is included
 * only for the owner/admin.
 */
export async function listSectionsWithLessons(identifier, viewer = null) {
  const course = await fetchCourseRow(identifier);
  if (course.status !== 'published') {
    const isOwner = viewer !== null && viewer.id === course.instructor_id;
    const isAdmin = viewer !== null && viewer.is_admin;
    if (!isOwner && !isAdmin) {
      throw new AppError('NOT_FOUND', 'Course not found.', 404);
    }
  }

  const [sectionRows] = await query(
    `SELECT id, course_id, title, position
       FROM sections
      WHERE course_id = ?
      ORDER BY position ASC, id ASC`,
    [course.id]
  );

  const [lessonRows] = await query(
    `SELECT id, section_id, title, content_type, video_id, text_content,
            duration_seconds, position, is_preview
       FROM lessons
      WHERE section_id IN (SELECT id FROM sections WHERE course_id = ?)
      ORDER BY position ASC, id ASC`,
    [course.id]
  );

  let isEnrolled = false;
  if (viewer !== null) {
    const [enrRows] = await query(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
      [viewer.id, course.id]
    );
    isEnrolled = enrRows.length > 0;
  }

  const isOwnerOrAdmin = viewer !== null && (viewer.id === course.instructor_id || viewer.is_admin);
  const lessonsBySection = new Map();
  for (const row of lessonRows) {
    if (!lessonsBySection.has(row.section_id)) lessonsBySection.set(row.section_id, []);
    const includeContent = isOwnerOrAdmin || isEnrolled || Boolean(row.is_preview);
    lessonsBySection.get(row.section_id).push(toLessonDTO(row, { includeContent }));
  }

  return {
    course_id: course.id,
    sections: sectionRows.map((s) => ({
      ...toSectionDTO(s),
      lessons: lessonsBySection.get(s.id) ?? [],
    })),
  };
}

/**
 * POST /courses/[id]/sections — append a section at the end.
 * The course row is locked FOR UPDATE so concurrent adds serialize and
 * positions can never collide.
 */
export async function createSection(identifier, instructorId, { title }) {
  const course = await getCourseOwned(identifier, instructorId);

  return transaction(async (conn) => {
    const [lockRows] = await conn.execute(
      'SELECT id FROM courses WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
      [course.id]
    );
    if (lockRows.length === 0) {
      throw new AppError('NOT_FOUND', 'Course not found.', 404);
    }
    const [maxRows] = await conn.execute(
      'SELECT COALESCE(MAX(position), 0) AS max FROM sections WHERE course_id = ?',
      [course.id]
    );
    const position = Number(maxRows[0].max) + 1;

    const [result] = await conn.execute(
      'INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)',
      [course.id, title, position]
    );
    return { id: result.insertId, course_id: course.id, title, position };
  });
}

/** PATCH /sections/[id] — title only (position is managed server-side). */
export async function updateSection(sectionId, instructorId, { title }) {
  const section = await getSectionOwned(sectionId, instructorId);

  await query('UPDATE sections SET title = ? WHERE id = ?', [title, sectionId]);

  const [rows] = await query(
    'SELECT id, course_id, title, position FROM sections WHERE id = ?',
    [sectionId]
  );
  return toSectionDTO(rows[0]);
}

/**
 * DELETE /sections/[id] — hard delete (sections/lessons are content, not
 * financial history). Cascades explicitly: lesson_progress → lessons →
 * section, in one transaction. MVP: allowed even on published courses —
 * enrolled students' progress on those lessons is removed with them.
 */
export async function deleteSection(sectionId, instructorId) {
  await getSectionOwned(sectionId, instructorId);

  await transaction(async (conn) => {
    await conn.execute(
      `DELETE lp FROM lesson_progress lp
        JOIN lessons l ON l.id = lp.lesson_id
       WHERE l.section_id = ?`,
      [sectionId]
    );
    await conn.execute('DELETE FROM lessons WHERE section_id = ?', [sectionId]);
    await conn.execute('DELETE FROM sections WHERE id = ?', [sectionId]);
  });

  return { id: sectionId, deleted: true };
}

/**
 * POST /sections/[id]/lessons — append a lesson at the end of the section.
 * The section row is locked FOR UPDATE; the lesson's video_id gets set later
 * via GET /lessons/[id]/upload-url (or PATCH).
 */
export async function createLesson(sectionId, instructorId, data) {
  const section = await getSectionOwned(sectionId, instructorId);

  const lesson = await transaction(async (conn) => {
    const [lockRows] = await conn.execute(
      'SELECT id FROM sections WHERE id = ? FOR UPDATE',
      [sectionId]
    );
    if (lockRows.length === 0) {
      throw new AppError('NOT_FOUND', 'Section not found.', 404);
    }
    const [maxRows] = await conn.execute(
      'SELECT COALESCE(MAX(position), 0) AS max FROM lessons WHERE section_id = ?',
      [sectionId]
    );
    const position = Number(maxRows[0].max) + 1;

    const [result] = await conn.execute(
      `INSERT INTO lessons (section_id, title, content_type, text_content, is_preview, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sectionId,
        data.title,
        data.content_type,
        data.text_content ?? null, // empty string → NULL
        data.is_preview ? 1 : 0,
        position,
      ]
    );

    const [rows] = await conn.execute('SELECT * FROM lessons WHERE id = ?', [result.insertId]);
    return rows[0];
  });

  return toLessonDTO(lesson);
}

/** PATCH /lessons/[id] — partial update; video_id/text_content accept null to clear. */
export async function updateLesson(lessonId, instructorId, data) {
  const lesson = await getLessonOwned(lessonId, instructorId);

  const sets = [];
  const values = [];
  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.content_type !== undefined) { sets.push('content_type = ?'); values.push(data.content_type); }
  if (data.video_id !== undefined) { sets.push('video_id = ?'); values.push(data.video_id); }
  if (data.text_content !== undefined) { sets.push('text_content = ?'); values.push(data.text_content); }
  if (data.duration_seconds !== undefined) { sets.push('duration_seconds = ?'); values.push(data.duration_seconds); }
  if (data.is_preview !== undefined) { sets.push('is_preview = ?'); values.push(data.is_preview ? 1 : 0); }

  if (sets.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Nothing to update.', 400);
  }

  await query(
    `UPDATE lessons SET ${sets.join(', ')} WHERE id = ?`,
    [...values, lessonId]
  );

  const [rows] = await query('SELECT * FROM lessons WHERE id = ?', [lessonId]);
  return toLessonDTO(rows[0]);
}

/**
 * DELETE /lessons/[id] — hard delete; removes the lesson's progress rows
 * (enrolled students) in the same transaction. See deleteSection note.
 */
export async function deleteLesson(lessonId, instructorId) {
  await getLessonOwned(lessonId, instructorId);

  await transaction(async (conn) => {
    await conn.execute('DELETE FROM lesson_progress WHERE lesson_id = ?', [lessonId]);
    await conn.execute('DELETE FROM lessons WHERE id = ?', [lessonId]);
  });

  return { id: lessonId, deleted: true };
}
