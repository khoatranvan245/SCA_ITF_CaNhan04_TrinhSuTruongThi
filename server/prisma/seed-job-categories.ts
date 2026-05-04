import { prisma } from "../src/lib/prisma";

const jobCategories = [
  // IT
  "Software Development",
  "Frontend Development",
  "Backend Development",
  "Fullstack Development",
  "Mobile Development",
  "DevOps",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
  "Game Development",
  "QA/QC",

  // Business
  "Business Analysis",
  "Project Management",
  "Product Management",
  "Operations Management",

  // Marketing & Sales
  "Digital Marketing",
  "Content Marketing",
  "SEO/SEM",
  "Social Media Management",
  "Sales",
  "Account Management",

  // Finance
  "Accounting",
  "Auditing",
  "Financial Analysis",
  "Investment",

  // HR
  "Recruitment",
  "Human Resources",
  "Training & Development",

  // Design
  "UI/UX Design",
  "Graphic Design",
  "Motion Design",

  // Customer
  "Customer Support",
  "Customer Success",

  // Education
  "Teaching",
  "Training",
  "Academic Research",

  // Healthcare
  "Nursing",
  "Medical Doctor",
  "Pharmacy",
  "Healthcare Support",

  // Logistics
  "Supply Chain",
  "Logistics",
  "Warehouse Management",
  "Procurement",

  // Manufacturing
  "Production",
  "Quality Control",
  "Mechanical Engineering",
  "Electrical Engineering",

  // Construction
  "Civil Engineering",
  "Construction Management",
  "Architecture",

  // Hospitality & Tourism
  "Hotel Management",
  "Travel Consultant",
  "Tour Guide",

  // Media
  "Content Creation",
  "Journalism",
  "Video Production",

  // Retail
  "Retail Management",
  "Store Operations",

  // Others
  "Legal",
  "Administration",
  "Translation",
  "Freelance",
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
  const categoriesToUpdate: Array<{ job_category_id: number; title: string }> =
    [];

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
