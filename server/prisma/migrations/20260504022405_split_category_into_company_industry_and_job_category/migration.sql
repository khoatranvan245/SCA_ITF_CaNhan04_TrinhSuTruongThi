/*
  Warnings:

  - You are about to drop the column `category_id` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `job_category_id` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_category_id_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_category_id_fkey";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "category_id",
ADD COLUMN     "company_industry_id" INTEGER;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "category_id",
ADD COLUMN     "job_category_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Category";

-- CreateTable
CREATE TABLE "CompanyIndustry" (
    "company_industry_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyIndustry_pkey" PRIMARY KEY ("company_industry_id")
);

-- CreateTable
CREATE TABLE "JobCategory" (
    "job_category_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("job_category_id")
);

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_company_industry_id_fkey" FOREIGN KEY ("company_industry_id") REFERENCES "CompanyIndustry"("company_industry_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_job_category_id_fkey" FOREIGN KEY ("job_category_id") REFERENCES "JobCategory"("job_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
