-- CreateEnum
CREATE TYPE "Role" AS ENUM ('artist', 'client', 'admin', 'curator');

-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('original', 'fanart', 'commission');

-- CreateEnum
CREATE TYPE "CurationStatus" AS ENUM ('unapproved', 'pending', 'approved', 'rejected', 'flagged');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'accepted', 'in_progress', 'revision', 'completed', 'cancelled', 'disputed');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'paid', 'refunded', 'released');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('wallet', 'credit_card');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('artwork', 'profile');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'client',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "approved_portfolio_count" INTEGER NOT NULL DEFAULT 0,
    "is_open_for_commission" BOOLEAN NOT NULL DEFAULT false,
    "base_price_idr" INTEGER,
    "strike_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artworks" (
    "id" TEXT NOT NULL,
    "artists_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "images_url" TEXT[],
    "wip_proof_url" TEXT,
    "upload_type" "UploadType" NOT NULL DEFAULT 'original',
    "curation_status" "CurationStatus" NOT NULL DEFAULT 'unapproved',
    "is_visible_on_feed" BOOLEAN NOT NULL DEFAULT false,
    "rejection_reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "tag_name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork_tags" (
    "artwork_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "artwork_tags_pkey" PRIMARY KEY ("artwork_id","tag_id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "artists_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "commission_title" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'pending',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "payment_method" "PaymentMethod",
    "card_last_four" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_progress" (
    "id" TEXT NOT NULL,
    "commission_id" TEXT NOT NULL,
    "sketch_url" TEXT,
    "sketch_approved" BOOLEAN NOT NULL DEFAULT false,
    "final_artwork_url" TEXT,
    "final_artwork_approved" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisions" (
    "id" TEXT NOT NULL,
    "commission_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_logs" (
    "id" TEXT NOT NULL,
    "commission_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'pending',
    "mediator_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "target_type" "ReportTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "curator_id" TEXT,
    "artwork_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "artwork_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_tag_name_key" ON "tags"("tag_name");

-- CreateIndex
CREATE UNIQUE INDEX "commission_progress_commission_id_key" ON "commission_progress"("commission_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispute_logs_commission_id_key" ON "dispute_logs"("commission_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_artwork_id_key" ON "favorites"("user_id", "artwork_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_artist_id_key" ON "follows"("follower_id", "artist_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_artists_id_fkey" FOREIGN KEY ("artists_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_tags" ADD CONSTRAINT "artwork_tags_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_tags" ADD CONSTRAINT "artwork_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_artists_id_fkey" FOREIGN KEY ("artists_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_progress" ADD CONSTRAINT "commission_progress_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_logs" ADD CONSTRAINT "dispute_logs_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_logs" ADD CONSTRAINT "dispute_logs_mediator_id_fkey" FOREIGN KEY ("mediator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_curator_id_fkey" FOREIGN KEY ("curator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
