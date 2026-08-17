# LMS Project — Full Architecture & UI Design Reference (Silver Loft LMS)

> **Single Source of Truth** for Backend Architecture, API Contracts, Database Schema, and Complete Frontend UI/UX Specifications for Figma & Frontend Implementation.

---

## 1. Project Overview

**Type:** Marketplace LMS (like Udemy) — independent instructors publish and sell self-paced courses to students.

### Core Business Model
- **100% Paid Courses:** Every course is paid (monetized via Stripe Checkout).
- **Self-Serve Instructor Application:** Any student can upgrade to an instructor account without administrative approval.
- **Admin Quality Gate:** Every course must be reviewed and approved by an administrator before it is published on the marketplace.
- **Automated Payouts:** Instructors connect their bank account via Stripe Connect Express; platform payouts and revenue splits are calculated via an immutable ledger.
- **Two-Way Secure Verification:** Account activation uses a branded dual-path verification system (6-digit OTP stored in MySQL with 15-minute expiration + 1-click Firebase verification link delivered via Resend).

---

## 2. Global Design System & Figma UI Tokens

Use these exact tokens, color variables, spacing standards, and component patterns when generating Figma frames and Next.js frontend pages.

### 2.1 Color Palette
| Token Name | Hex Code | Tailwind / CSS Var | Usage |
|---|---|---|---|
| **Primary Navy** | `#112A46` | `--color-primary` | Main branding, primary buttons, headers, dark cards, prominent titles |
| **Secondary Sky Blue** | `#ACC8E5` | `--color-secondary` | Accent highlights, focus rings, icon badges, active indicators |
| **Page Tint Background** | `#EAF1FA` | `--color-tint` | Auth page backgrounds, subtle callout cards, soft surfaces |
| **Near-Black Ink** | `#0B1B2E` | `--color-ink` | Deep contrast text, hover states on primary buttons |
| **Neutral White** | `#FFFFFF` | `--color-surface` | Card surfaces, modal containers, form inputs |
| **Neutral Muted Gray** | `#64748B` | `--color-muted` | Body secondary copy, labels, placeholders, timestamps |
| **Card Border** | `#E2E8F0` | `--color-border` | Subtle dividing lines, input outlines, table borders |
| **Success Emerald** | `#16A34A` | `--color-success` | Verified badges, completed lesson checkmarks, published status |
| **Warning Amber** | `#D97706` | `--color-warning` | Pending review status badges, countdown alerts |
| **Danger Red** | `#DC2626` | `--color-danger` | Error alerts, rejection notices, password strength (weak) |

### 2.2 Typography Hierarchy
- **Font Family:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` (or `Inter` in Figma).
- **Display 1 (Hero Headings):** `34px / 1.15 line-height`, SemiBold (`font-weight: 600`), Letter spacing `-0.02em`.
- **Display 2 (Page Titles / H1):** `26px / 1.25 line-height`, SemiBold, Letter spacing `-0.015em`.
- **Section Heading (H2):** `20px / 1.3 line-height`, SemiBold.
- **Card Subheading (H3):** `16px / 1.4 line-height`, Medium/SemiBold.
- **Body Text:** `14.5px / 1.6 line-height`, Regular (`#334155` or `#0B1B2E`).
- **Secondary / Helper Text:** `13px / 1.5 line-height`, Regular (`#64748B`).
- **Microcopy / Badges:** `11px - 12px / 1 line-height`, Bold/SemiBold, Letter spacing `+0.05em` (uppercase).
- **Monospaced Security Codes (OTP):** `28px - 32px`, Bold (`font-weight: 800`), Letter spacing `8px`, Monospace font.

### 2.3 Surface Geometry & Shadows
- **Outer Modals & Hero Cards:** `border-radius: 28px`, shadow: `0 30px 80px -20px rgba(17,42,70,0.35)`.
- **Standard Cards / Tables / Video Wrappers:** `border-radius: 16px`, border `1px solid #E2E8F0`, shadow: `0 4px 20px -2px rgba(17,42,70,0.05)`.
- **Form Controls & Buttons:** `border-radius: 12px` (`rounded-xl`), height: `48px` to `52px`.
- **Focus Rings:** `ring-4 ring-[#ACC8E5]/40 border-[#112A46]` for active form inputs.
- **Pills / Tags:** `border-radius: 9999px` (`rounded-full`), padding `4px 12px`.

---

## 3. Complete Frontend Page Map (Figma Screen Specifications)

Every screen follows standard responsive breakpoints (Desktop `1440px`, Tablet `768px`, Mobile `375px`).

```
Frontend Sitemap
├── (auth)
│   ├── /login                     [Split Brand & Form Screen]
│   ├── /signup                    [Registration & Strength Meter]
│   ├── /verify                    [6-Box OTP Input & Resend Cooldown]
│   └── /forgot-password           [Password Reset Request & Confirmation]
├── (marketing & discovery)
│   ├── /                          [Landing Marketplace & Search]
│   ├── /courses                   [Catalog Filter & Course Grid]
│   └── /courses/[slug]            [Sales Page, Video Preview, Curriculum & Buy CTA]
├── (student learning)
│   ├── /dashboard                 [Enrolled Courses, Progress & Resume]
│   └── /learn/[slug]/[lessonId]   [Full-screen Player, Sidebar & Progress Tracker]
├── (instructor studio)
│   ├── /instructor/dashboard      [Revenue Metrics & Performance Analytics]
│   ├── /instructor/courses        [Course Management Table & Review Statuses]
│   ├── /instructor/courses/new    [Course Builder: Details, Sections, Lessons & Uploader]
│   ├── /instructor/earnings       [Financial Ledger, Revenue Split & Payout Records]
│   └── /instructor/stripe/onboard [Stripe Connect Account Linkage & Status]
└── (admin portal)
    ├── /admin/dashboard           [Platform KPI Cards & System Stats]
    ├── /admin/courses/pending     [Review Queue, Curriculum Inspector, Approve/Reject]
    ├── /admin/users               [User Management Table, Role & Suspension Toggles]
    └── /admin/analytics           [Financial Volume, Categories & Revenue Breakdowns]
```

### 3.1 Authentication Screens
1. **Login Screen (`/login`):**
   - **Left Panel (Desktop):** Deep Navy background with animated geometric constellation grid, Silver Loft lock badge, 256-bit encryption indicator, SOC 2 status.
   - **Right Panel:** "Welcome back" heading, email/password inputs with toggleable eye icon, "Keep me signed in" checkbox, "Forgot?" password shortcut, primary action button, Google SSO button, and link to sign up.
2. **Signup Screen (`/signup`):**
   - **Components:** Full name, email, password with live 4-segment strength bar (`Weak` → `Strong`), password confirmation, terms checkbox.
   - **Interactive Behavior:** Upon form submit, authenticates with Firebase, initializes server session cookie, triggers non-blocking Resend verification email, and redirects within 600ms to `/verify`.
3. **Email Verification Screen (`/verify`):**
   - **Components:** 6 segmented numeric input boxes with auto-focus advance, backspace navigation, and clipboard paste support; "Verify Email" button; "Resend verification email" with a 60-second cooldown timer.
   - **Dual Link Handler:** Automatically detects Firebase Action Code query parameters (`?oobCode=...`) if the user clicks the verification link from their inbox, authenticates the code, and forwards to dashboard.
4. **Forgot Password Screen (`/forgot-password`):**
   - **Components:** Back to sign-in arrow, email input, "Send reset link" button; transitions to "Check your inbox" confirmation state with instant resend trigger.

### 3.2 Marketplace & Course Discovery Screens
1. **Marketplace Landing Page (`/`):**
   - **Hero Section:** Value proposition headline, live search bar with instant keyword filtering, category tag pills.
   - **Featured Courses Grid:** Course cards with 16:9 thumbnail, category badge, course title, instructor avatar & name, star rating with review count, and price in USD.
   - **Instructor Callout Section:** "Teach on Silver Loft" banner with "Become an Instructor" CTA.
2. **Course Catalog & Browse (`/courses`):**
   - **Left Sidebar Filter:** Category multi-select, price range filter, rating radio buttons (4.5★ & up, 4.0★ & up).
   - **Main Content Grid:** Sorting dropdown (Most Popular, Newest, Highest Rated), pagination controls.
3. **Course Sales Page (`/courses/[slug]`):**
   - **Hero Header:** Course title, description, instructor bio preview, last updated timestamp, language.
   - **Sticky Purchase Card (Desktop Right):** Video preview player (free sample lesson), price badge (e.g. `$49.00`), "Enroll Now" 1-click checkout button (initiates Stripe Checkout), 30-day access guarantee.
   - **Curriculum Accordion:** Expandable sections showing lesson titles, duration, content type icon (video/text), and "Preview" buttons on free-to-view lessons.
   - **Verified Reviews Section:** Average star rating summary with visual score distribution bars, verified student reviews list.

### 3.3 Student Learning Experience
1. **Student Dashboard (`/dashboard`):**
   - **Top Row:** Total courses enrolled, in-progress count, completed certifications count.
   - **"Continue Learning" Card:** Quick-resume banner for the most recently accessed course with a progress bar and "Resume Lesson" button.
   - **Enrolled Courses Grid:** Cards showing thumbnail, percentage completed, remaining lessons, and direct link into the player.
2. **Distraction-Free Course Player (`/learn/[slug]/[lessonId]`):**
   - **Left / Center Video Stage:** Cloudflare Stream adaptive video player with playback speed controls, quality switcher, and theater mode; markdown text lesson viewer below.
   - **Collapsible Right Curriculum Sidebar:** Section and lesson list with checkmark icons for completed lessons, duration tags, and active lesson indicator.
   - **Bottom Navigation Bar:** "Previous Lesson" button, "Mark as Complete" toggle button, "Next Lesson" button.

### 3.4 Instructor Studio
1. **Instructor Dashboard (`/instructor/dashboard`):**
   - **Metric Cards:** Total Gross Revenue, Net Earnings, Active Students Enrolled, Average Course Rating.
   - **Revenue Chart:** Monthly earnings visual graph.
   - **Stripe Connect Status Banner:** Indicates whether payout onboarding is complete or pending bank connection.
2. **Course Management Table (`/instructor/courses`):**
   - **Table Columns:** Thumbnail, Title, Price, Students, Status Badge (`Draft` [Gray], `Pending Review` [Amber], `Published` [Emerald], `Rejected` [Red]), Actions.
   - **Rejection Details Popover:** Displays admin feedback/rejection reason if rejected, allowing the instructor to fix and resubmit.
3. **Course Builder (`/instructor/courses/[id]/edit`):**
   - **Tab 1: Course Info:** Title, slug, description, category selector, price input (in USD cents), Cloudinary thumbnail upload dropzone.
   - **Tab 2: Curriculum Builder:** Add Section button, reorder sections, Add Lesson modal (video file direct-upload to Cloudflare Stream with upload progress bar, or rich-text editor for text lessons), "Free Preview" checkbox.
   - **Tab 3: Review & Submit:** Pre-flight checklist (requires title, thumbnail, at least 1 section, 1 lesson, and connected Stripe account) before unlocking "Submit for Review".
4. **Instructor Earnings & Ledger (`/instructor/earnings`):**
   - **Ledger Table:** Date, Course Title, Student Paid Amount, Platform Fee (commission), Net Instructor Credit, Ledger Status (`Pending`, `Included in Payout`, `Paid`).

### 3.5 Admin Portal
1. **Admin Dashboard (`/admin/dashboard`):**
   - **Platform KPIs:** Platform Commission Earned, Total Sales Volume, Total Registered Users, Courses Pending Review.
2. **Course Review Queue (`/admin/courses/pending`):**
   - **Inspector View:** Full curriculum breakdown with playable video previews, text inspection, instructor history.
   - **Action Bar:** "Approve & Publish" button, "Reject Course" button (opens modal requiring feedback reason).
3. **User Management (`/admin/users`):**
   - **Search & Table:** User list with avatar, email, verification status, instructor toggle, admin toggle, status switch (`active` / `suspended`).

---

## 4. Tech Stack Architecture

| Layer | Technology | Purpose / Notes |
|---|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack, React 19) | Server Components for SEO on discovery; Client Components for interactive forms & player |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Tokens | Design-token-driven typography, surfaces, and animations |
| **Backend** | Next.js API Routes (`/app/api/v1/...`) | Thin route handlers delegating to modular service classes |
| **Database** | MySQL (InnoDB) | Relational transactions for money, enrollments, and ledger |
| **Auth Identity** | Firebase Auth (Client & Admin SDK) | Email/Password & Google SSO, ID token verification |
| **Transactional Email** | Resend API | Multipart HTML + Plain Text verification emails |
| **Video Hosting** | Cloudflare Stream | Direct upload via signed URLs, adaptive HLS playback |
| **Asset Storage** | Cloudinary | Course thumbnails, user avatars |
| **Payments & Payouts** | Stripe Checkout & Stripe Connect Express | Idempotent webhooks, automated split payments |

---

## 5. Dual Verification & Auth Architecture

```
                                  [Sign Up / Login]
                                          │
                            Firebase ID Token (Client)
                                          │
                                          ▼
                         POST /api/v1/auth/send-verification
                                          │
                                          ▼
                             Firebase Admin SDK verifies
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
             MySQL users table                    Firebase Admin SDK
      (Generates 6-Digit OTP +            (Generates 1-Click Verification Link
       15-min Expiry Timestamp)            with ActionCodeSettings)
                        │                                   │
                        └─────────────────┬─────────────────┘
                                          ▼
                            emails/verification.html
                       (Injected with OTP + Link + Preheader)
                                          │
                                          ▼
                                      Resend API
                            (HTML + Plaintext Multipart)
                                          │
                                          ▼
                                   Student's Inbox
                                          │
                 ┌────────────────────────┴────────────────────────┐
                 ▼                                                 ▼
      Option A: Enter 6-Digit OTP                      Option B: Click Email Link
      POST /api/v1/auth/verify-otp                     Direct URL: /verify?oobCode=...
                 │                                                 │
                 ▼                                                 ▼
    MySQL: email_verified = true                      Firebase: applyActionCode()
    Firebase: emailVerified = true                    MySQL synced via session
                 │                                                 │
                 └────────────────────────┬────────────────────────┘
                                          ▼
                               /dashboard (Unlocked)
```

---

## 6. Database Schema Specification (MySQL)

```sql
CREATE DATABASE IF NOT EXISTS LMS;
USE LMS;

-- Users & Authentication Linkage
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL COMMENT 'Links to Firebase Auth identity',
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500) COMMENT 'Cloudinary URL',
    email_verified BOOLEAN DEFAULT FALSE,
    verificationOTP VARCHAR(6) NULL COMMENT '6-digit verification code',
    verificationOTPExpiresAt TIMESTAMP NULL COMMENT '15-minute expiration timestamp',
    is_instructor BOOLEAN DEFAULT FALSE COMMENT 'Self-serve flag',
    is_admin BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'suspended') DEFAULT 'active',
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_email (email)
);

-- Instructor Stripe Connect & Profile
CREATE TABLE instructor_profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    bio TEXT,
    stripe_connect_account_id VARCHAR(255) NULL,
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE COMMENT 'Gate: Course cannot be submitted if FALSE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);

-- Courses
CREATE TABLE courses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instructor_id BIGINT UNSIGNED NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500) COMMENT 'Cloudinary asset',
    price_cents INT UNSIGNED NOT NULL COMMENT 'Stored as integer cents (e.g. 4900 = $49.00)',
    currency CHAR(3) DEFAULT 'USD',
    status ENUM('draft', 'pending_review', 'published', 'rejected') DEFAULT 'draft',
    rejection_reason TEXT NULL,
    avg_rating DECIMAL(3, 2) DEFAULT 0.00 COMMENT 'Denormalized average rating',
    review_count INT UNSIGNED DEFAULT 0 COMMENT 'Denormalized review count',
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_status (status),
    INDEX idx_category_status (category_id, status),
    INDEX idx_instructor (instructor_id)
);

-- Course Sections
CREATE TABLE sections (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    position INT UNSIGNED NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_position (course_id, position)
);

-- Lessons
CREATE TABLE lessons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    section_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_type ENUM('video', 'text') NOT NULL,
    video_id VARCHAR(255) NULL COMMENT 'Cloudflare Stream Video ID',
    text_content LONGTEXT NULL COMMENT 'Markdown / HTML text content',
    duration_seconds INT UNSIGNED NULL,
    position INT UNSIGNED NOT NULL,
    is_preview BOOLEAN DEFAULT FALSE COMMENT 'Enables free preview before purchase',
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    INDEX idx_section_position (section_id, position)
);

-- Student Enrollments
CREATE TABLE enrollments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    course_id BIGINT UNSIGNED NOT NULL,
    payment_id BIGINT UNSIGNED NOT NULL,
    progress_percent DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Recalculated on lesson completion',
    completed_at TIMESTAMP NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, course_id)
);

-- Lesson Progress Tracker
CREATE TABLE lesson_progress (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT UNSIGNED NOT NULL,
    lesson_id BIGINT UNSIGNED NOT NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment_lesson (enrollment_id, lesson_id)
);

-- Verified Buyer Reviews
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT UNSIGNED NOT NULL UNIQUE COMMENT 'Enforces verified purchase at DB level',
    rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
);

-- Payments (Student -> Platform)
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    course_id BIGINT UNSIGNED NOT NULL,
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'Idempotency anchor',
    amount_cents INT UNSIGNED NOT NULL,
    platform_fee_cents INT UNSIGNED NOT NULL,
    instructor_earning_cents INT UNSIGNED NOT NULL,
    status ENUM('pending', 'succeeded', 'refunded', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
);

-- Instructor Payout Ledger
CREATE TABLE payout_ledger_entries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instructor_id BIGINT UNSIGNED NOT NULL,
    payment_id BIGINT UNSIGNED NOT NULL,
    amount_cents INT UNSIGNED NOT NULL,
    status ENUM('pending', 'included_in_payout', 'paid') DEFAULT 'pending',
    payout_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT
);

-- Payout Records (Stripe Connect Transfers)
CREATE TABLE payouts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instructor_id BIGINT UNSIGNED NOT NULL,
    stripe_transfer_id VARCHAR(255) UNIQUE,
    amount_cents INT UNSIGNED NOT NULL,
    status ENUM('processing', 'paid', 'failed') DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT
);
```

---

## 7. API Routes & Payload Specifications

### Base URL: `/api/v1`

#### Standard Response Format
```json
// Success
{ "success": true, "data": { ... }, "message"?: "Optional success message" }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable error description." } }
```

### 7.1 Authentication Endpoints
- `POST /auth/session` — Mints HTTP-only session cookie from Firebase ID token. Auto-creates user row if first sign-in.
- `DELETE /auth/session` — Clears session cookie and revokes Firebase refresh tokens.
- `POST /auth/send-verification` — Generates 6-digit OTP in MySQL + Firebase verification link, sends via Resend.
  - **Body:** `{ "idToken": "string", "displayName"?: "string" }`
- `POST /auth/verify-otp` — Validates 6-digit OTP, updates `email_verified = TRUE` in MySQL and syncs with Firebase Auth.
  - **Body:** `{ "otp": "583214", "idToken"?: "string", "email"?: "user@example.com" }`

### 7.2 User Endpoints
- `GET /users/me` — Returns authenticated user profile, enrollment count, and roles.
- `PATCH /users/me` — Updates display name or avatar URL.
- `POST /users/me/become-instructor` — Self-serve upgrade to set `is_instructor = TRUE` and provision `instructor_profiles` row.

### 7.3 Course & Content Endpoints
- `GET /courses` — Public course list with category, rating, search, and pagination.
- `POST /courses` — Creates a new course in `draft` status (Instructors only).
- `GET /courses/[id]` — Returns course details, instructor profile, curriculum, and reviews (slug or numeric ID).
- `PATCH /courses/[id]` — Updates title, price, description, category, or thumbnail.
- `DELETE /courses/[id]` — Soft deletes course (`deleted_at = NOW()`).
- `POST /courses/[id]/submit` — Submits course for review (`draft` → `pending_review`).
- `GET /courses/[id]/sections` — Lists sections and ordered lessons.
- `POST /courses/[id]/sections` — Creates a new section.
- `PATCH /sections/[id]` — Updates section title or position.
- `DELETE /sections/[id]` — Deletes section and cascades to its lessons.
- `POST /sections/[id]/lessons` — Creates a lesson (video or text).
- `PATCH /lessons/[id]` — Updates lesson title, position, preview flag, or text content.
- `DELETE /lessons/[id]` — Deletes lesson.
- `GET /lessons/[id]/upload-url` — Requests a signed Cloudflare Stream direct-upload URL for video lessons.

### 7.4 Enrollment & Learning Endpoints
- `GET /enrollments` — Returns all courses enrolled by the authenticated user.
- `POST /enrollments/[id]/progress` — Marks a lesson complete and recalculates `progress_percent`.
  - **Body:** `{ "lessonId": 12 }`

### 7.5 Payment & Checkout Endpoints
- `POST /checkout/session` — Creates a Stripe Checkout Session with course and user metadata.
  - **Body:** `{ "courseId": 5 }`
  - **Response:** `{ "url": "https://checkout.stripe.com/..." }`
- `POST /webhooks/stripe` — Signature-verified webhook handler. In a single database transaction, creates `payments`, `enrollments`, and `payout_ledger_entries`.

### 7.6 Instructor & Payout Endpoints
- `POST /instructor/stripe/onboard` — Creates a Stripe Connect Express onboarding account link.
- `GET /instructor/stripe/status` — Checks if Stripe Connect account charges/payouts are enabled.
- `GET /instructor/earnings` — Returns revenue summary, platform fee commission, and pending payout ledger.
- `GET /instructor/payouts` — Lists historical Stripe payouts.

### 7.7 Admin Endpoints
- `GET /admin/courses/pending` — Returns courses in `pending_review` status.
- `POST /admin/courses/[id]/review` — Approves (`published`) or rejects (`rejected` with `rejection_reason`).
  - **Body:** `{ "action": "approve" | "reject", "reason"?: "Needs higher video resolution in Section 2." }`
- `GET /admin/users` — Lists all users with pagination and search.
- `PATCH /admin/users/[id]` — Toggles admin role, instructor role, or updates status (`active` / `suspended`).
- `GET /admin/analytics` — Aggregated revenue, commission earnings, and enrollment volumes.

---

## 8. Security & Business Logic Rules

1. **Server-Side Derived Identity:** Never trust client-supplied `user_id`, `firebase_uid`, `instructor_id`, or `is_admin` in request bodies. Derive all identity from verified server session cookies.
2. **Double Purchase Guard:** The `UNIQUE(user_id, course_id)` constraint on `enrollments` table prevents duplicate charges at the database level.
3. **No Direct Proxied Uploads:** Large video files and images are uploaded directly from the browser to Cloudflare Stream / Cloudinary via signed pre-authorized URLs.
4. **Idempotent Webhooks:** Stripe webhooks check `stripe_payment_intent_id` uniqueness before inserting records to safely handle network retries.
5. **Role Gating:** Admin endpoints enforce `requireAdmin()` on the server; UI gating alone is never considered sufficient security.
