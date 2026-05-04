import { prisma } from "../src/lib/prisma";

const companyCategories = [
  "Information Technology",
  "Finance & Banking",
  "Education",
  "Healthcare",
  "E-commerce",
  "Marketing & Advertising",
  "Real Estate",
  "Manufacturing",
  "Logistics & Supply Chain",
  "Telecommunications",
  "Media & Entertainment",
  "Travel & Tourism",
  "Energy & Utilities",
  "Construction",
  "Agriculture",
  "Retail",
  "Food & Beverage",
  "Automotive",
  "Insurance",
  "Consulting",
];

function normalizeTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

async function seedCompanyCategories() {
  const existing = await prisma.companyCategory.findMany({
    select: { company_category_id: true, title: true },
  });

  const existingByNormalizedTitle = new Map(
    existing.map((category) => [normalizeTitle(category.title), category]),
  );

  const categoriesToInsert: string[] = [];
  const categoriesToUpdate: Array<{
    company_category_id: number;
    title: string;
  }> = [];

  for (const title of companyCategories) {
    const normalizedTitle = normalizeTitle(title);
    const matchedCategory = existingByNormalizedTitle.get(normalizedTitle);

    if (!matchedCategory) {
      categoriesToInsert.push(title);
      continue;
    }

    if (matchedCategory.title !== title) {
      categoriesToUpdate.push({
        company_category_id: matchedCategory.company_category_id,
        title,
      });
    }
  }

  if (categoriesToInsert.length === 0 && categoriesToUpdate.length === 0) {
    console.log(
      "CompanyCategory table already contains the requested categories.",
    );
    return;
  }

  if (categoriesToInsert.length > 0) {
    await prisma.companyCategory.createMany({
      data: categoriesToInsert.map((title) => ({ title })),
    });
  }

  if (categoriesToUpdate.length > 0) {
    await Promise.all(
      categoriesToUpdate.map((category) =>
        prisma.companyCategory.update({
          where: { company_category_id: category.company_category_id },
          data: { title: category.title },
        }),
      ),
    );
  }

  console.log(
    `Inserted ${categoriesToInsert.length} and updated ${categoriesToUpdate.length} company categories.`,
  );
}

seedCompanyCategories()
  .catch((error) => {
    console.error("Failed to seed company categories:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
