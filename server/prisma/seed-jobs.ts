import { prisma } from "../src/lib/prisma";

const jobTitles = [
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "Mobile Developer",
  "QA Engineer",
  "DevOps Engineer",
  "Data Analyst",
  "Business Analyst",
  "UI UX Designer",
  "Product Manager",
  "Project Manager",
  "System Administrator",
  "Cloud Engineer",
  "Security Engineer",
  "Technical Support Engineer",
];

const requirementTemplates = [
  "At least 1 year of relevant experience",
  "Good communication and teamwork skills",
  "Ability to work independently and meet deadlines",
  "Familiar with Agile and Scrum workflow",
  "Strong problem-solving and analytical thinking",
];

const benefitTemplates = [
  "13th month salary and annual bonus",
  "Social insurance based on full salary",
  "Company trip and regular team building",
  "Laptop and modern working equipment",
  "Flexible working time and hybrid policy",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(items: T[]): T {
  const index = randomInt(0, items.length - 1);
  return items[index];
}

function buildJobData(index: number) {
  // Salary values are generated in VND with million-based steps.
  const salaryMinMillions = randomInt(10, 30);
  const salaryMaxMillions = randomInt(
    salaryMinMillions + 2,
    salaryMinMillions + 15,
  );

  const title = `${randomPick(jobTitles)} ${index + 1}`;
  const description = `Hiring for ${title}. Join our team and build impactful products.`;

  return {
    title,
    description,
    requirements: randomPick(requirementTemplates),
    salary_min: salaryMinMillions * 1_000_000,
    salary_max: salaryMaxMillions * 1_000_000,
    benefits: randomPick(benefitTemplates),
    job_category_id: randomInt(1, 9),
    company_id: 2,
    expiration_date: new Date(
      Date.now() + randomInt(15, 90) * 24 * 60 * 60 * 1000,
    ),
  };
}

async function seedJobs() {
  const jobCategories = await prisma.jobCategory.findMany({
    select: { job_category_id: true },
  });

  if (jobCategories.length === 0) {
    throw new Error(
      "No job categories found. Seed job categories before seeding jobs.",
    );
  }

  const jobData = Array.from({ length: 30 }, (_, index) => buildJobData(index));

  for (const item of jobData) {
    item.job_category_id =
      jobCategories[Math.floor(Math.random() * jobCategories.length)]!
        .job_category_id;
  }

  await prisma.job.createMany({
    data: jobData,
  });

  console.log("Inserted 30 jobs into Job table for company_id = 2.");
}

seedJobs()
  .catch((error) => {
    console.error("Failed to seed jobs:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
