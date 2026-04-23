/*
  Warnings:

  - You are about to drop the column `experience_years` on the `Candidate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "experience_years",
ADD COLUMN     "avatar_url" TEXT;
