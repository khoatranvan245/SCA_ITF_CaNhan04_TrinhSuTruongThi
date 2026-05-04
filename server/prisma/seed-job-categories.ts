import { prisma } from "../src/lib/prisma";

const jobCategories = [
  "Software Development",
  "Data & AI",
  "Design",
  "Product Management",
  "QA & Testing",
  "DevOps & Cloud",
  "Cybersecurity",
  "Business & Operations",
  "Sales & Marketing",
];

function normalizeTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

async function seedJobCategories() {
  const existing = await prisma.jobCategory.findMany({
    select: { job_category_id: true, title: true },
  });

  const existingByNormalizedTitle = new Map(
    existing.map((category) => [normalizeTitle(category.title), category]),
  );

  const categoriesToInsert: string[] = [];
  const categoriesToUpdate: Array<{ job_category_id: number; title: string }> = [];

  for (const title of jobCategories) {
    const normalizedTitle = normalizeTitle(title);
    const matchedCategory = existingByNormalizedTitle.get(normalizedTitle);

    if (!matchedCategory) {
      categoriesToInsert.push(title);
      continue;
    }

    if (matchedCategory.title !== title) {
      categoriesToUpdate.push({
        job_category_id: matchedCategory.job_category_id,
        title,
      });
    }
  }

  if (categoriesToInsert.length === 0 && categoriesToUpdate.length === 0) {
    console.log("JobCategory table already contains the requested categories.");
    return;
  }

  if (categoriesToInsert.length > 0) {
    await prisma.jobCategory.createMany({
      data: categoriesToInsert.map((title) => ({ title })),
    });
  }

  if (categoriesToUpdate.length > 0) {
    await Promise.all(
      categoriesToUpdate.map((category) =>
        prisma.jobCategory.update({
          where: { job_category_id: category.job_category_id },
          data: { title: category.title },
        }),
      ),
    );
  }

  console.log(
    `Inserted ${categoriesToInsert.length} and updated ${categoriesToUpdate.length} job categories.`,
  );
}

seedJobCategories()
  .catch((error) => {
    console.error("Failed to seed job categories:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });