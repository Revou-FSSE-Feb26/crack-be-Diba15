-- =============================================================================
-- TruBrush Database — DDL Schema Script (PostgreSQL)
-- Safe & Idempotent: Can be executed multiple times safely without errors.
-- =============================================================================

-- 1. ENUMS (Protected with DO $$ block to prevent duplicate_object error)
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('artist', 'client', 'admin', 'curator');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "UploadType" AS ENUM ('original', 'fanart', 'commission');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "CurationStatus" AS ENUM ('unapproved', 'pending', 'approved', 'rejected', 'flagged');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'accepted', 'in_progress', 'revision', 'completed', 'cancelled', 'disputed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'paid', 'refunded', 'released');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('wallet', 'credit_card');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ReportTargetType" AS ENUM ('artwork', 'profile');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ReportStatus" AS ENUM ('pending', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "DisputeStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "AppealStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "TransactionType" AS ENUM ('topup', 'withdraw', 'payment', 'release', 'refund', 'platform_fee');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'success', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================================================
-- 3. TABLES (CREATE TABLE IF NOT EXISTS)
-- =============================================================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'client',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "avatar_url" TEXT,
    "bio" TEXT,
    "instagram_url" TEXT,
    "twitter_url" TEXT,
    "pixiv_url" TEXT,
    "website_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "approved_portfolio_count" INTEGER NOT NULL DEFAULT 0,
    "is_open_for_commission" BOOLEAN NOT NULL DEFAULT false,
    "base_price_idr" INTEGER,
    "strike_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SESSIONS TABLE
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "refresh_token" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PASSWORD RESET TOKENS TABLE
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" TEXT UNIQUE NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ARTWORKS TABLE
CREATE TABLE IF NOT EXISTS "artworks" (
    "id" TEXT PRIMARY KEY,
    "artists_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "images_url" TEXT[] NOT NULL,
    "wip_proof_url" TEXT,
    "upload_type" "UploadType" NOT NULL DEFAULT 'original',
    "curation_status" "CurationStatus" NOT NULL DEFAULT 'unapproved',
    "is_visible_on_feed" BOOLEAN NOT NULL DEFAULT false,
    "rejection_reason" TEXT,
    "reviewed_by" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TAGS TABLE
CREATE TABLE IF NOT EXISTS "tags" (
    "id" TEXT PRIMARY KEY,
    "tag_name" TEXT UNIQUE NOT NULL
);

-- ARTWORK_TAGS (JUNCTION TABLE)
CREATE TABLE IF NOT EXISTS "artwork_tags" (
    "artwork_id" TEXT NOT NULL REFERENCES "artworks"("id") ON DELETE CASCADE,
    "tag_id" TEXT NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
    PRIMARY KEY ("artwork_id", "tag_id")
);

-- COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS "commissions" (
    "id" TEXT PRIMARY KEY,
    "artists_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "client_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "commission_title" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'pending',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "payment_method" "PaymentMethod",
    "card_last_four" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- COMMISSION PROGRESS TABLE
CREATE TABLE IF NOT EXISTS "commission_progress" (
    "id" TEXT PRIMARY KEY,
    "commission_id" TEXT UNIQUE NOT NULL REFERENCES "commissions"("id") ON DELETE CASCADE,
    "sketch_url" TEXT,
    "sketch_approved" BOOLEAN NOT NULL DEFAULT false,
    "final_artwork_url" TEXT,
    "final_artwork_approved" BOOLEAN NOT NULL DEFAULT false,
    "final_file_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- REVISIONS TABLE
CREATE TABLE IF NOT EXISTS "revisions" (
    "id" TEXT PRIMARY KEY,
    "commission_id" TEXT NOT NULL REFERENCES "commissions"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- DISPUTE LOGS TABLE
CREATE TABLE IF NOT EXISTS "dispute_logs" (
    "id" TEXT PRIMARY KEY,
    "commission_id" TEXT UNIQUE NOT NULL REFERENCES "commissions"("id") ON DELETE CASCADE,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'pending',
    "mediator_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- REPORTS TABLE
CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT PRIMARY KEY,
    "reporter_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "target_type" "ReportTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "curator_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "artwork_id" TEXT REFERENCES "artworks"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FAVORITES TABLE
CREATE TABLE IF NOT EXISTS "favorites" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "artwork_id" TEXT NOT NULL REFERENCES "artworks"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_artwork_id_key" UNIQUE ("user_id", "artwork_id")
);

-- FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS "follows" (
    "id" TEXT PRIMARY KEY,
    "follower_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "artist_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follows_follower_id_artist_id_key" UNIQUE ("follower_id", "artist_id")
);

-- WALLET TRANSACTIONS TABLE (LEDGER)
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'success',
    "commission_id" TEXT REFERENCES "commissions"("id") ON DELETE SET NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- APPEALS TABLE (BANDING ARTIST)
CREATE TABLE IF NOT EXISTS "appeals" (
    "id" TEXT PRIMARY KEY,
    "artist_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "reason" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'pending',
    "resolved_by_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. PERFORMANCE INDEXES (CREATE INDEX IF NOT EXISTS)
-- =============================================================================
CREATE INDEX IF NOT EXISTS "idx_artworks_artists_id" ON "artworks"("artists_id");
CREATE INDEX IF NOT EXISTS "idx_artworks_curation_status" ON "artworks"("curation_status");
CREATE INDEX IF NOT EXISTS "idx_artworks_is_visible_on_feed" ON "artworks"("is_visible_on_feed");
CREATE INDEX IF NOT EXISTS "idx_commissions_artists_id" ON "commissions"("artists_id");
CREATE INDEX IF NOT EXISTS "idx_commissions_client_id" ON "commissions"("client_id");
CREATE INDEX IF NOT EXISTS "idx_commissions_status" ON "commissions"("status");
CREATE INDEX IF NOT EXISTS "idx_wallet_transactions_user_id" ON "wallet_transactions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "reports"("status");
CREATE INDEX IF NOT EXISTS "idx_appeals_status" ON "appeals"("status");
