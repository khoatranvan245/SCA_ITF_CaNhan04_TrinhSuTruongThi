import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getAdminAccounts = async (_req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const [roles, users] = await Promise.all([
      prisma.role.findMany({
        orderBy: { role_id: "asc" },
        select: {
          role_id: true,
          title: true,
          description: true,
        },
      }),
      prisma.user.findMany({
        orderBy: { created_at: "desc" },
        select: {
          user_id: true,
          email: true,
          role_id: true,
          status: true,
          role: {
            select: {
              role_id: true,
              title: true,
              description: true,
            },
          },
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              companies: true,
              candidates: true,
            },
          },
        },
      }),
    ]);

    const accounts = users.map((user) => ({
      user_id: user.user_id,
      email: user.email,
      role_id: user.role_id,
      role_title: user.role?.title ?? "Unknown",
      role_description: user.role?.description ?? null,
      status: user.status ?? "active",
      created_at: user.created_at,
      updated_at: user.updated_at,
      companies_count: user._count.companies,
      candidates_count: user._count.candidates,
    }));

    res.status(200).json({
      accounts,
      roles,
      total: accounts.length,
    });
  } catch (error) {
    console.error("Get admin accounts error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

function parseUserId(rawUserId: string | string[] | undefined): number | null {
  const normalizedValue = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const userId = Number(normalizedValue);
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }
  return userId;
}

export const updateAdminAccountStatus = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const userId = parseUserId(req.params.userId);
    if (!userId) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const actingUserId =
      typeof req.body?.user_id !== "undefined"
        ? Number(req.body.user_id)
        : null;
    if (actingUserId) {
      const actingUser = await prisma.user.findUnique({
        where: { user_id: actingUserId },
        include: { role: true },
      });
      const roleTitle = actingUser?.role?.title?.toLowerCase();
      const isAdmin =
        roleTitle === "admin" ||
        roleTitle === "super admin" ||
        roleTitle === "system administrator";
      if (!actingUser || !isAdmin) {
        res.status(403).json({ message: "Access denied" });
        return;
      }
    }

    const newStatusRaw =
      typeof req.body.status === "string"
        ? req.body.status.trim().toLowerCase()
        : "";
    if (newStatusRaw !== "active" && newStatusRaw !== "suspended") {
      res.status(400).json({ message: "Invalid account status" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updated = await prisma.user.update({
      where: { user_id: userId },
      data: { status: newStatusRaw as any },
      select: { user_id: true, status: true },
    });

    res
      .status(200)
      .json({ message: "Account status updated", account: updated });
  } catch (error) {
    console.error("Update admin account status error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const deleteAdminAccount = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const userId = parseUserId(req.params.userId);
    if (!userId) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const actingUserId =
      typeof req.body?.user_id !== "undefined"
        ? Number(req.body.user_id)
        : null;
    if (actingUserId) {
      const actingUser = await prisma.user.findUnique({
        where: { user_id: actingUserId },
        include: { role: true },
      });
      const roleTitle = actingUser?.role?.title?.toLowerCase();
      const isAdmin =
        roleTitle === "admin" ||
        roleTitle === "super admin" ||
        roleTitle === "system administrator";
      if (!actingUser || !isAdmin) {
        res.status(403).json({ message: "Access denied" });
        return;
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const candidates = await prisma.candidate.findMany({
      where: { user_id: userId },
      select: { candidate_id: true },
    });
    const candidateIds = candidates.map((c) => c.candidate_id);

    const company = await prisma.company.findFirst({
      where: { user_id: userId },
      select: { company_id: true },
    });

    await prisma.$transaction(async (transaction) => {
      if (candidateIds.length > 0) {
        const apps = await transaction.application.findMany({
          where: { candidate_id: { in: candidateIds } },
          select: { application_id: true },
        });
        const appIds = apps.map((a) => a.application_id);

        if (appIds.length > 0) {
          await transaction.aIEvaluation.deleteMany({
            where: { application_id: { in: appIds } },
          });
        }

        await transaction.application.deleteMany({
          where: { candidate_id: { in: candidateIds } },
        });
        await transaction.resume.deleteMany({
          where: { candidate_id: { in: candidateIds } },
        });
        await transaction.candidateSkill.deleteMany({
          where: { candidate_id: { in: candidateIds } },
        });
        await transaction.candidate.deleteMany({
          where: { candidate_id: { in: candidateIds } },
        });
      }

      if (company) {
        const companyId = company.company_id;
        const jobs = await transaction.job.findMany({
          where: { company_id: companyId },
          select: { job_id: true },
        });
        const jobIds = jobs.map((j) => j.job_id);

        if (jobIds.length > 0) {
          const appsForJobs = await transaction.application.findMany({
            where: { job_id: { in: jobIds } },
            select: { application_id: true },
          });
          const appIdsForJobs = appsForJobs.map((a) => a.application_id);

          if (appIdsForJobs.length > 0) {
            await transaction.aIEvaluation.deleteMany({
              where: { application_id: { in: appIdsForJobs } },
            });
          }

          await transaction.jobSkill.deleteMany({
            where: { job_id: { in: jobIds } },
          });
          await transaction.application.deleteMany({
            where: { job_id: { in: jobIds } },
          });
          await transaction.job.deleteMany({
            where: { job_id: { in: jobIds } },
          });
        }

        await transaction.company.delete({ where: { company_id: companyId } });
      }

      await transaction.user.delete({ where: { user_id: userId } });
    });

    res
      .status(200)
      .json({
        message: "Account deleted successfully",
        deleted_user_id: userId,
      });
  } catch (error) {
    console.error("Delete admin account error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};
