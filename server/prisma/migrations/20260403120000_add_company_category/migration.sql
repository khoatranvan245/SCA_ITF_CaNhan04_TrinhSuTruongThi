ALTER TABLE "Company"
ADD COLUMN "category_id" INTEGER;

ALTER TABLE "Company"
ADD CONSTRAINT "Company_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "Category"("category_id")
ON DELETE SET NULL ON UPDATE CASCADE;
