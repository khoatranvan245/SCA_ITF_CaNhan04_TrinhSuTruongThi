import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const ROLE_RECRUITER = 2;

function parseUserId(rawUserId: string | string[] | undefined): number | null {
  const normalizedValue = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const userId = Number(normalizedValue);
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }
  return userId;
}

function parseJobId(rawJobId: string | string[] | undefined): number | null {
  const normalizedValue = Array.isArray(rawJobId) ? rawJobId[0] : rawJobId;
  const jobId = Number(normalizedValue);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return null;
  }
  return jobId;
}

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsedValue = Number(value);
    if (Number.isInteger(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }
  }

  return null;
}

function parseOptionalInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parsePositiveInteger(value);
}

function parseDateOnly(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function normalizeSkillName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

export const getRecruiterJobs = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const userId = parseUserId(req.params.userId);
    if (!userId) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true },
    });

    if (!user || user.role_id !== ROLE_RECRUITER) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const company = await prisma.company.findFirst({
      where: { user_id: userId },
      include: { city: true },
    });

    if (!company) {
      res.status(404).json({ message: "Company not found for this recruiter" });
      return;
    }

    const jobs = await prisma.job.findMany({
      where: { company_id: company.company_id },
      include: {
        category: true,
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const mappedJobs = jobs.map((job) => ({
      job_id: job.job_id,
      title: job.title,
      status: job.status,
      created_at: job.created_at,
      category: job.category?.title ?? "General",
      applicants_count: job._count.applications,
      location: company.city?.name || company.address || "No location",
    }));

    res.status(200).json({
      company: {
        company_id: company.company_id,
        name: company.name,
      },
      jobs: mappedJobs,
    });
  } catch (error) {
    console.error("Get recruiter jobs error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const createRecruiterJob = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const userId = parseUserId(req.params.userId);
    if (!userId) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true },
    });

    if (!user || user.role_id !== ROLE_RECRUITER) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const company = await prisma.company.findFirst({
      where: { user_id: userId },
    });

    if (!company) {
      res.status(404).json({ message: "Company not found for this recruiter" });
      return;
    }

    const title =
      typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : null;
    const requirements =
      typeof req.body.requirements === "string"
        ? req.body.requirements.trim()
        : null;
    const benefits =
      typeof req.body.benefits === "string" ? req.body.benefits.trim() : null;
    const categoryId = parsePositiveInteger(req.body.category_id);
    const salaryMin = parseOptionalInteger(req.body.salary_min);
    const salaryMax = parseOptionalInteger(req.body.salary_max);
    const expirationDateValue =
      typeof req.body.expiration_date === "string"
        ? req.body.expiration_date.trim()
        : "";
    const skillsInput: unknown[] = Array.isArray(req.body.skills)
      ? req.body.skills
      : typeof req.body.skills === "string" && req.body.skills.trim()
        ? req.body.skills.split(",")
        : [];

    if (!title) {
      res.status(400).json({ message: "Job title is required" });
      return;
    }

    if (!categoryId) {
      res.status(400).json({ message: "Job category is required" });
      return;
    }

    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      res.status(400).json({ message: "Salary minimum cannot exceed maximum" });
      return;
    }

    const category = await prisma.category.findUnique({
      where: { category_id: categoryId },
    });

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    if (!expirationDateValue) {
      res.status(400).json({ message: "Expiration date is required" });
      return;
    }

    const expirationDate = parseDateOnly(expirationDateValue);

    if (!expirationDate) {
      res.status(400).json({ message: "Invalid expiration date" });
      return;
    }

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    if (expirationDate <= todayStart) {
      res.status(400).json({
        message: "Expiration date must be later than today",
      });
      return;
    }

    const normalizedSkillNames: string[] = Array.from(
      new Set(
        skillsInput
          .map((skill: unknown) =>
            typeof skill === "string" ? skill.trim() : String(skill).trim(),
          )
          .filter(Boolean),
      ),
    );

    const result = await prisma.$transaction(async (transaction) => {
      const createdJob = await transaction.job.create({
        data: {
          title,
          description,
          requirements,
          salary_min: salaryMin,
          salary_max: salaryMax,
          benefits,
          expiration_date: expirationDate,
          category_id: categoryId,
          company_id: company.company_id,
          status: "open",
        },
        include: {
          category: true,
          company: true,
          job_skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      if (normalizedSkillNames.length > 0) {
        const linkedSkills = [] as Array<{ skill_id: number; name: string }>;

        for (const skillName of normalizedSkillNames) {
          const skill = await transaction.skill.findFirst({
            where: {
              OR: [
                { name: skillName },
                { name: { equals: skillName, mode: "insensitive" } },
              ],
            },
          });

          if (skill) {
            linkedSkills.push({ skill_id: skill.skill_id, name: skill.name });
            continue;
          }

          const createdSkill = await transaction.skill.create({
            data: { name: skillName },
          });

          linkedSkills.push({
            skill_id: createdSkill.skill_id,
            name: createdSkill.name,
          });
        }

        await transaction.jobSkill.createMany({
          data: linkedSkills.map((skill) => ({
            job_id: createdJob.job_id,
            skill_id: skill.skill_id,
          })),
        });

        return transaction.job.findUnique({
          where: { job_id: createdJob.job_id },
          include: {
            category: true,
            company: true,
            job_skills: {
              include: {
                skill: true,
              },
            },
          },
        });
      }

      return createdJob;
    });

    res.status(201).json({
      message: "Job created successfully",
      job: result,
    });
  } catch (error) {
    console.error("Create recruiter job error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const searchSkills = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const skills = await prisma.skill.findMany({
      where: query
        ? {
            name: {
              contains: query,
              mode: "insensitive",
            },
          }
        : undefined,
      select: {
        skill_id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 12,
    });

    res.status(200).json({ skills });
  } catch (error) {
    console.error("Search skills error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const deleteRecruiterJob = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const userId = parseUserId(req.params.userId);
    if (!userId) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const jobId = parseJobId(req.params.jobId);
    if (!jobId) {
      res.status(400).json({ message: "Invalid job id" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true },
    });

    if (!user || user.role_id !== ROLE_RECRUITER) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const company = await prisma.company.findFirst({
      where: { user_id: userId },
    });

    if (!company) {
      res.status(404).json({ message: "Company not found for this recruiter" });
      return;
    }

    const targetJob = await prisma.job.findUnique({
      where: { job_id: jobId },
      select: { job_id: true, company_id: true },
    });

    if (!targetJob) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (targetJob.company_id !== company.company_id) {
      res.status(403).json({ message: "You can only delete your own jobs" });
      return;
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        DELETE FROM "AIEvaluation"
        WHERE "application_id" IN (
          SELECT "application_id" FROM "Application" WHERE "job_id" = ${jobId}
        )
      `;

      await transaction.jobSkill.deleteMany({
        where: { job_id: jobId },
      });

      await transaction.application.deleteMany({
        where: { job_id: jobId },
      });

      await transaction.job.delete({
        where: { job_id: jobId },
      });
    });

    res.status(200).json({
      message: "Job deleted successfully",
      deleted_job_id: jobId,
    });
  } catch (error) {
    console.error("Delete recruiter job error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};
