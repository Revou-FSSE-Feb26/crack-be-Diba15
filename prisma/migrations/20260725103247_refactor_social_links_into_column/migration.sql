/*
  Warnings:

  - You are about to drop the column `social_links` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "social_links",
ADD COLUMN     "instagram_url" TEXT,
ADD COLUMN     "pixiv_url" TEXT,
ADD COLUMN     "twitter_url" TEXT,
ADD COLUMN     "website_url" TEXT;
