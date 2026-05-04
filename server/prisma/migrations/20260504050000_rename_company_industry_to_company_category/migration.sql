-- Rename the company-side category table created by the previous split migration
ALTER TABLE "Company" DROP CONSTRAINT "Company_company_industry_id_fkey";
ALTER TABLE "Company" RENAME COLUMN "company_industry_id" TO "company_category_id";
ALTER TABLE "CompanyIndustry" RENAME TO "CompanyCategory";
ALTER TABLE "CompanyCategory" RENAME COLUMN "company_industry_id" TO "company_category_id";
ALTER TABLE "CompanyCategory" RENAME CONSTRAINT "CompanyIndustry_pkey" TO "CompanyCategory_pkey";
ALTER TABLE "Company" ADD CONSTRAINT "Company_company_category_id_fkey" FOREIGN KEY ("company_category_id") REFERENCES "CompanyCategory"("company_category_id") ON DELETE SET NULL ON UPDATE CASCADE;
