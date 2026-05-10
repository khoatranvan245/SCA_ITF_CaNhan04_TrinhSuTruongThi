-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'active';
