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
