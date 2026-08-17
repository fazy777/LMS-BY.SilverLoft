import fs from 'fs';
import path from 'path';

// Load .env.local before importing db
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value.trim();
    }
  });
}

const { query } = await import('../lib/db.js');

async function seed() {
  console.log('Seeding courses into TiDB Cloud...');

  // 1. Ensure Instructor Users exist
  const instructors = [
    { email: 'marta.coelho@silverloft.com', name: 'Marta Coelho', uid: 'instr_marta_01' },
    { email: 'owen.faraday@silverloft.com', name: 'Owen Faraday', uid: 'instr_owen_02' },
    { email: 'priya.nandakumar@silverloft.com', name: 'Priya Nandakumar', uid: 'instr_priya_03' },
    { email: 'diego.santoro@silverloft.com', name: 'Diego Santoro', uid: 'instr_diego_04' },
    { email: 'hana.ishikawa@silverloft.com', name: 'Hana Ishikawa', uid: 'instr_hana_05' },
    { email: 'lucas.reyes@silverloft.com', name: 'Lucas Reyes', uid: 'instr_lucas_06' },
  ];

  const instructorIds = {};

  for (const inst of instructors) {
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [inst.email]);
    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const [res] = await query(
        `INSERT INTO users (firebase_uid, email, display_name, is_instructor, email_verified, status)
         VALUES (?, ?, ?, 1, 1, 'active')`,
        [inst.uid, inst.email, inst.name]
      );
      userId = res.insertId;
    }
    instructorIds[inst.email] = userId;

    await query(
      `INSERT INTO instructor_profiles (user_id, bio, stripe_onboarding_complete)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE stripe_onboarding_complete = 1`,
      [userId, `Senior Expert Instructor at Silver Loft`]
    );
  }

  // 2. Categories mapping
  const [categories] = await query('SELECT id, slug FROM categories');
  const catMap = {};
  for (const c of categories) {
    catMap[c.slug] = c.id;
  }

  // 3. Courses definitions
  const courses = [
    {
      title: 'The Complete Next.js 16 Developer Course',
      slug: 'nextjs-16-developer-course',
      category_slug: 'development',
      instructor_email: 'marta.coelho@silverloft.com',
      price_cents: 6499,
      avg_rating: 4.8,
      review_count: 12480,
      description: 'A complete, project-based path covering core fundamentals through advanced enterprise architecture — built for developers who learn by shipping real production software.',
      thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=720&h=405&fit=crop',
      sections: [
        {
          title: 'Getting Started & Architecture Setup',
          position: 1,
          lessons: [
            { title: 'Welcome & Course Roadmap', content_type: 'video', duration_seconds: 252, is_preview: true, position: 1 },
            { title: 'Setting Up Your Dev Environment', content_type: 'video', duration_seconds: 585, is_preview: true, position: 2 },
            { title: 'Starter Project Architecture & Dependencies', content_type: 'text', text_content: 'Detailed project architecture breakdown and repository guide.', duration_seconds: 180, is_preview: false, position: 3 },
          ]
        },
        {
          title: 'Core Fundamentals & Deep Dive',
          position: 2,
          lessons: [
            { title: 'App Router Deep Dive & Layout Trees', content_type: 'video', duration_seconds: 1330, is_preview: false, position: 1 },
            { title: 'Server Components vs Client Boundaries', content_type: 'video', duration_seconds: 1083, is_preview: false, position: 2 },
            { title: 'Data Fetching & Cache Invalidation Patterns', content_type: 'video', duration_seconds: 1600, is_preview: false, position: 3 },
            { title: 'Checkpoint Quiz: Fundamentals Assessment', content_type: 'text', text_content: '10 assessment questions testing caching and server components.', duration_seconds: 600, is_preview: false, position: 4 },
          ]
        },
        {
          title: 'Building & Deploying the Production App',
          position: 3,
          lessons: [
            { title: 'Database Schema & Transactional Mutations', content_type: 'video', duration_seconds: 1120, is_preview: false, position: 1 },
            { title: 'Secure Authentication & Session Management', content_type: 'video', duration_seconds: 1875, is_preview: false, position: 2 },
            { title: 'Production Cloud Deployment & Monitoring', content_type: 'video', duration_seconds: 728, is_preview: false, position: 3 },
          ]
        }
      ]
    },
    {
      title: 'UI/UX Design Foundations: From Wireframe to Prototype',
      slug: 'ui-ux-design-foundations',
      category_slug: 'design',
      instructor_email: 'owen.faraday@silverloft.com',
      price_cents: 4999,
      avg_rating: 4.7,
      review_count: 8341,
      description: 'Master Figma, wireframing, high-fidelity UI design, component systems, and interactive prototyping from an experienced product designer.',
      thumbnail_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=720&h=405&fit=crop',
      sections: [
        {
          title: 'Design Principles & Wireframing',
          position: 1,
          lessons: [
            { title: 'Visual Hierarchy & Typography', content_type: 'video', duration_seconds: 450, is_preview: true, position: 1 },
            { title: 'Wireframing in Figma', content_type: 'video', duration_seconds: 780, is_preview: true, position: 2 },
          ]
        },
        {
          title: 'Design Systems & Prototyping',
          position: 2,
          lessons: [
            { title: 'Creating Reusable Components & Auto-Layout', content_type: 'video', duration_seconds: 1200, is_preview: false, position: 1 },
            { title: 'Advanced Interactive Prototyping', content_type: 'video', duration_seconds: 1450, is_preview: false, position: 2 },
          ]
        }
      ]
    },
    {
      title: 'Financial Modeling & Valuation for Startups',
      slug: 'financial-modeling-startups',
      category_slug: 'business',
      instructor_email: 'priya.nandakumar@silverloft.com',
      price_cents: 7499,
      avg_rating: 4.6,
      review_count: 5210,
      description: 'Learn unit economics, DCF valuation, runway projections, and investor-ready financial model construction.',
      thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=720&h=405&fit=crop',
      sections: [
        {
          title: 'Startup Economics & P&L',
          position: 1,
          lessons: [
            { title: 'Unit Economics: CAC, LTV & Churn', content_type: 'video', duration_seconds: 600, is_preview: true, position: 1 },
            { title: 'Building a 3-Statement Model', content_type: 'video', duration_seconds: 1250, is_preview: false, position: 2 },
          ]
        }
      ]
    },
    {
      title: 'Growth Marketing: Funnels, SEO & Paid Acquisition',
      slug: 'growth-marketing-funnels',
      category_slug: 'marketing',
      instructor_email: 'diego.santoro@silverloft.com',
      price_cents: 5499,
      avg_rating: 4.5,
      review_count: 3987,
      description: 'Build high-converting conversion funnels, execute organic search strategies, and scale profitable paid advertising campaigns.',
      thumbnail_url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=720&h=405&fit=crop',
      sections: [
        {
          title: 'Funnel Optimization & SEO',
          position: 1,
          lessons: [
            { title: 'High-Converting Landing Pages', content_type: 'video', duration_seconds: 520, is_preview: true, position: 1 },
            { title: 'Technical SEO Strategies', content_type: 'video', duration_seconds: 980, is_preview: false, position: 2 },
          ]
        }
      ]
    },
    {
      title: 'Python for Data Science and Machine Learning',
      slug: 'python-data-science-machine-learning',
      category_slug: 'data-science',
      instructor_email: 'hana.ishikawa@silverloft.com',
      price_cents: 6999,
      avg_rating: 4.9,
      review_count: 21032,
      description: 'From NumPy and Pandas to Scikit-Learn and neural networks: real projects in predictive modeling and analysis.',
      thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=720&h=405&fit=crop',
      sections: [
        {
          title: 'Data Analysis with Pandas',
          position: 1,
          lessons: [
            { title: 'NumPy & Vectorized Computing', content_type: 'video', duration_seconds: 700, is_preview: true, position: 1 },
            { title: 'Data Cleaning with Pandas', content_type: 'video', duration_seconds: 1100, is_preview: false, position: 2 },
          ]
        }
      ]
    },
    {
      title: 'Portrait Photography: Studio Lighting Masterclass',
      slug: 'portrait-photography-lighting',
      category_slug: 'photography',
      instructor_email: 'lucas.reyes@silverloft.com',
      price_cents: 3999,
      avg_rating: 4.7,
      review_count: 2765,
      description: 'Learn professional lighting setups, light shaping, posing techniques, and Lightroom/Photoshop color grading.',
      thumbnail_url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=720&h=405&fit=crop',
      sections: [
        {
          title: 'Lighting Fundamentals',
          position: 1,
          lessons: [
            { title: 'Key, Fill, and Rim Lighting', content_type: 'video', duration_seconds: 480, is_preview: true, position: 1 },
            { title: 'Softboxes vs Modifiers', content_type: 'video', duration_seconds: 820, is_preview: false, position: 2 },
          ]
        }
      ]
    },
    {
      title: 'Advanced TypeScript: Architecture & Design Patterns',
      slug: 'advanced-typescript-architecture',
      category_slug: 'development',
      instructor_email: 'marta.coelho@silverloft.com',
      price_cents: 5999,
      avg_rating: 4.8,
      review_count: 6120,
      description: 'Deep dive into conditional types, template literal types, domain modeling, and enterprise TypeScript best practices.',
      thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=720&h=405&fit=crop',
      sections: [
        {
          title: 'Type-Level Programming',
          position: 1,
          lessons: [
            { title: 'Generics and Conditional Types', content_type: 'video', duration_seconds: 890, is_preview: true, position: 1 },
            { title: 'Template Literal Type Wizardry', content_type: 'video', duration_seconds: 1040, is_preview: false, position: 2 },
          ]
        }
      ]
    },
    {
      title: 'Brand Identity Design with Figma',
      slug: 'brand-identity-figma',
      category_slug: 'design',
      instructor_email: 'owen.faraday@silverloft.com',
      price_cents: 4499,
      avg_rating: 4.6,
      review_count: 4108,
      description: 'Build complete brand guideline kits, custom typography systems, and iconic logo presentations in Figma.',
      thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=720&h=405&fit=crop',
      sections: [
        {
          title: 'Brand Guidelines Development',
          position: 1,
          lessons: [
            { title: 'Color Palette & Typography Strategy', content_type: 'video', duration_seconds: 640, is_preview: true, position: 1 },
            { title: 'Exporting Assets for Production', content_type: 'video', duration_seconds: 790, is_preview: false, position: 2 },
          ]
        }
      ]
    }
  ];

  for (const c of courses) {
    const instructorId = instructorIds[c.instructor_email];
    const categoryId = catMap[c.category_slug] || 1;

    const [existingCourse] = await query('SELECT id FROM courses WHERE slug = ?', [c.slug]);
    let courseId;
    if (existingCourse.length > 0) {
      courseId = existingCourse[0].id;
      await query(
        `UPDATE courses SET
          title = ?, description = ?, thumbnail_url = ?, price_cents = ?,
          avg_rating = ?, review_count = ?, status = 'published', published_at = NOW(),
          category_id = ?, instructor_id = ?
         WHERE id = ?`,
        [c.title, c.description, c.thumbnail_url, c.price_cents, c.avg_rating, c.review_count, categoryId, instructorId, courseId]
      );
    } else {
      const [res] = await query(
        `INSERT INTO courses (
          title, slug, description, thumbnail_url, price_cents,
          avg_rating, review_count, status, published_at, category_id, instructor_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'published', NOW(), ?, ?)`,
        [c.title, c.slug, c.description, c.thumbnail_url, c.price_cents, c.avg_rating, c.review_count, categoryId, instructorId]
      );
      courseId = res.insertId;
    }

    console.log(`Course seeded: ${c.title} (ID: ${courseId})`);

    // Insert Sections & Lessons
    for (const sec of c.sections) {
      const [existingSec] = await query(
        'SELECT id FROM sections WHERE course_id = ? AND position = ?',
        [courseId, sec.position]
      );
      let secId;
      if (existingSec.length > 0) {
        secId = existingSec[0].id;
        await query('UPDATE sections SET title = ? WHERE id = ?', [sec.title, secId]);
      } else {
        const [sRes] = await query(
          'INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)',
          [courseId, sec.title, sec.position]
        );
        secId = sRes.insertId;
      }

      for (const les of sec.lessons) {
        const [existingLes] = await query(
          'SELECT id FROM lessons WHERE section_id = ? AND position = ?',
          [secId, les.position]
        );
        if (existingLes.length > 0) {
          await query(
            `UPDATE lessons SET
              title = ?, content_type = ?, duration_seconds = ?,
              is_preview = ?, text_content = ?
             WHERE id = ?`,
            [les.title, les.content_type, les.duration_seconds, les.is_preview ? 1 : 0, les.text_content || null, existingLes[0].id]
          );
        } else {
          await query(
            `INSERT INTO lessons (section_id, title, content_type, duration_seconds, is_preview, text_content, position)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [secId, les.title, les.content_type, les.duration_seconds, les.is_preview ? 1 : 0, les.text_content || null, les.position]
          );
        }
      }
    }
  }

  console.log('All 8 courses, sections, and lessons successfully seeded into TiDB Cloud!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
