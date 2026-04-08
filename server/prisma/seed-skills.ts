import { prisma } from "../src/lib/prisma";

const skills = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C",
  "C++",
  "C#",
  "Go",
  "Rust",
  "PHP",
  "Kotlin",
  "Swift",
  "Ruby",
  "HTML",
  "CSS",
  "Sass",
  "SCSS",
  "Tailwind CSS",
  "Bootstrap",
  "React.js",
  "Next.js",
  "Vue.js",
  "Angular",
  "Redux",
  "Zustand",
  "Node.js",
  "Express.js",
  "NestJS",
  "Django",
  "Flask",
  "Spring Boot",
  "Laravel",
  "ASP.NET",
  "SQL",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "SQL Server",
  "Oracle",
  "Redis",
  "Firebase",
  "Git",
  "GitHub",
  "GitLab",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "Jenkins",
  "Nginx",
  "Linux",
  "AWS",
  "Microsoft Azure",
  "Google Cloud Platform",
  "React Native",
  "Flutter",
  "Android Development",
  "iOS Development",
  "Unit Testing",
  "Integration Testing",
  "Jest",
  "Mocha",
  "Cypress",
  "Selenium",
  "Data Analysis",
  "Data Visualization",
  "Machine Learning",
  "Deep Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Pandas",
  "NumPy",
  "TensorFlow",
  "PyTorch",
  "Figma",
  "Adobe XD",
  "Photoshop",
  "Illustrator",
  "UI Design",
  "UX Research",
  "Wireframing",
  "Prototyping",
  "Digital Marketing",
  "SEO",
  "SEM",
  "Content Marketing",
  "Social Media Marketing",
  "Email Marketing",
  "Google Ads",
  "Facebook Ads",
  "Branding",
  "Microsoft Word",
  "Microsoft Excel",
  "Microsoft PowerPoint",
  "Microsoft Outlook",
  "Google Docs",
  "Google Sheets",
  "Google Slides",
  "Google Drive",
  "Pivot Tables",
  "VLOOKUP",
  "HLOOKUP",
  "Excel Formulas",
  "Excel VBA",
  "Data Analysis (Excel)",
  "Slack",
  "Microsoft Teams",
  "Zoom",
  "Notion",
  "Trello",
  "Agile",
  "Scrum",
  "Kanban",
  "Jira",
];

function normalizeSkillName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

async function seedSkills() {
  const existing = await prisma.skill.findMany({
    select: { skill_id: true, name: true },
  });

  const existingByNormalizedName = new Map(
    existing.map((skill) => [normalizeSkillName(skill.name), skill]),
  );

  const skillsToInsert: string[] = [];
  const skillsToUpdate: Array<{ skill_id: number; name: string }> = [];

  for (const skillName of skills) {
    const normalizedName = normalizeSkillName(skillName);
    const matchedSkill = existingByNormalizedName.get(normalizedName);

    if (!matchedSkill) {
      skillsToInsert.push(skillName);
      continue;
    }

    if (matchedSkill.name !== skillName) {
      skillsToUpdate.push({ skill_id: matchedSkill.skill_id, name: skillName });
    }
  }

  if (skillsToInsert.length === 0 && skillsToUpdate.length === 0) {
    console.log("Skill table already contains the requested skills.");
    return;
  }

  if (skillsToInsert.length > 0) {
    await prisma.skill.createMany({
      data: skillsToInsert.map((name) => ({ name })),
    });
  }

  if (skillsToUpdate.length > 0) {
    await Promise.all(
      skillsToUpdate.map((skill) =>
        prisma.skill.update({
          where: { skill_id: skill.skill_id },
          data: { name: skill.name },
        }),
      ),
    );
  }

  console.log(
    `Inserted ${skillsToInsert.length} and updated ${skillsToUpdate.length} skills in Skill table.`,
  );
}

seedSkills()
  .catch((error) => {
    console.error("Failed to seed skills:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
