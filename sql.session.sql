create DATABASE LMS;
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    verificationOTP VARCHAR(6) NULL,
    verificationOTPExpiresAt TIMESTAMP NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL COMMENT 'soft delete — null means active',
    firebase_uid VARCHAR(128) UNIQUE NOT NULL COMMENT 'links to Firebase Auth',
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500) COMMENT 'Cloudinary URL',
    is_instructor BOOLEAN DEFAULT FALSE COMMENT 'self-serve flag',
    is_admin BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE instructor_profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    bio TEXT,
    stripe_connect_account_id VARCHAR(255) NULL COMMENT 'set once Stripe Connect onboarding completes',
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE COMMENT 'gate: cant submit a course for review without this = TRUE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);
CREATE TABLE courses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    deleted_at TIMESTAMP NULL COMMENT 'soft delete — null means active',
    instructor_id BIGINT UNSIGNED NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL COMMENT 'for SEO-friendly URLs (Next.js SSR benefits from this)',
    description TEXT,
    thumbnail_url VARCHAR(500) COMMENT 'Cloudinary',
    price_cents INT UNSIGNED NOT NULL COMMENT 'store money as integer cents, never float — classic beginner mistake to avoid',
    currency CHAR(3) DEFAULT 'USD',
    status ENUM(
        'draft',
        'pending_review',
        'published',
        'rejected'
    ) DEFAULT 'draft' COMMENT 'matches Phase 1 state machine',
    rejection_reason TEXT NULL COMMENT 'shown to instructor if rejected',
    avg_rating DECIMAL(3, 2) DEFAULT 0.00 COMMENT 'denormalized on purpose — recalculated on new review, avoids expensive AVG() query on every course listing page',
    review_count INT UNSIGNED DEFAULT 0 COMMENT 'denormalized alongside avg_rating',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_status (status),
    INDEX idx_category_status (category_id, status),
    INDEX idx_instructor (instructor_id)
);
CREATE TABLE sections (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    position INT UNSIGNED NOT NULL COMMENT 'ordering within course',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_position (course_id, position),
    UNIQUE KEY unique_course_position (course_id, position)
);
CREATE TABLE lessons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    section_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_type ENUM('video', 'text') NOT NULL,
    video_id VARCHAR(255) NULL COMMENT 'Cloudflare Stream video ID (not the raw file — the ID Cloudflare gives you)',
    text_content LONGTEXT NULL COMMENT 'for text-based lessons',
    duration_seconds INT UNSIGNED NULL COMMENT 'for video, used for progress % calc',
    position INT UNSIGNED NOT NULL COMMENT 'ordering within section',
    is_preview BOOLEAN DEFAULT FALSE COMMENT 'lets instructors mark 1-2 lessons free-to-preview before purchase',
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    INDEX idx_section_position (section_id, position)
);
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'buyer',
    course_id BIGINT UNSIGNED NOT NULL,
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'idempotency anchor — prevents duplicate charges',
    amount_cents INT UNSIGNED NOT NULL COMMENT 'what student paid',
    platform_fee_cents INT UNSIGNED NOT NULL COMMENT 'your commission',
    instructor_earning_cents INT UNSIGNED NOT NULL COMMENT 'amount_cents - platform_fee_cents',
    status ENUM('pending', 'succeeded', 'refunded', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    INDEX idx_user (user_id),
    INDEX idx_course (course_id),
    INDEX idx_status (status),
    INDEX idx_stripe_pi (stripe_payment_intent_id)
);
CREATE TABLE enrollments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    course_id BIGINT UNSIGNED NOT NULL,
    payment_id BIGINT UNSIGNED NULL,
    progress_percent DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'denormalized/cached, recalculated from lesson_progress',
    completed_at TIMESTAMP NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_enrollment (user_id, course_id) COMMENT 'prevents double-purchase at the DB level, not just app logic',
    INDEX idx_user (user_id),
    INDEX idx_course (course_id)
);
CREATE TABLE lesson_progress (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT UNSIGNED NOT NULL,
    lesson_id BIGINT UNSIGNED NOT NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment_lesson (enrollment_id, lesson_id),
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_lesson (lesson_id)
);
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT UNSIGNED NOT NULL UNIQUE COMMENT 'ties review to a real purchase — enforces verified buyer at schema level',
    rating TINYINT UNSIGNED NOT NULL CHECK (
        rating BETWEEN 1 AND 5
    ),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
);
CREATE TABLE payouts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instructor_id BIGINT UNSIGNED NOT NULL,
    stripe_transfer_id VARCHAR(255) UNIQUE COMMENT 'Stripe Connect transfer ID',
    amount_cents INT UNSIGNED NOT NULL,
    status ENUM('processing', 'paid', 'failed') DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_instructor (instructor_id),
    INDEX idx_status (status)
);
CREATE TABLE payout_ledger_entries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instructor_id BIGINT UNSIGNED NOT NULL,
    payment_id BIGINT UNSIGNED NOT NULL COMMENT 'source of this credit',
    amount_cents INT UNSIGNED NOT NULL,
    status ENUM('pending', 'included_in_payout', 'paid') DEFAULT 'pending',
    payout_id BIGINT UNSIGNED NULL COMMENT 'set once batched into a payout',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
    FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE RESTRICT,
    INDEX idx_instructor_status (instructor_id, status),
    INDEX idx_payout (payout_id),
    INDEX idx_status (status)
);
INSERT INTO categories (name, slug) VALUES
('Development', 'development'),
('Design', 'design'),
('Business', 'business'),
('Marketing', 'marketing'),
('Data Science', 'data-science'),
('Photography', 'photography')
ON DUPLICATE KEY UPDATE name=VALUES(name);

SELECT * FROM categories;
