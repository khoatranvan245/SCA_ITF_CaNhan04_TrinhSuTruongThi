import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  evaluateApplicationAI,
  extractCvTextFromSupabase,
} from "../lib/aiEvaluation";

const AVATAR_BUCKET_NAME = "Avatar";
const CV_BUCKET_NAME = "CV";

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

function parseOptionalNonNegativeInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsedValue = Number(value);
    if (Number.isInteger(parsedValue) && parsedValue >= 0) {
      return parsedValue;
    }
  }

  return null;
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

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

function hasMojibake(fileName: string): boolean {
  return /Ã.|Â.|Ä.|áº|á»|â.|Ê.|Ô.|Õ./.test(fileName);
}

function decodeUploadedFileName(fileName: string): string {
  const fallbackName = fileName.trim() || "resume";

  if (!hasMojibake(fallbackName)) {
    return fallbackName;
  }

  try {
    const decodedName = Buffer.from(fallbackName, "latin1").toString("utf8");
    return decodedName.includes("�") ? fallbackName : decodedName;
  } catch {
    return fallbackName;
  }
}

const formatMillionVnd = (value: number) => {
  const millionValue = value / 1_000_000;
  return Number.isInteger(millionValue)
    ? `${millionValue}`
    : `${millionValue.toFixed(1).replace(/\.0$/, "")}`;
};

const formatSalaryLabel = (
  salaryMin: number | null,
  salaryMax: number | null,
) => {
  if (salaryMin !== null && salaryMax !== null) {
    return `${formatMillionVnd(salaryMin)} - ${formatMillionVnd(salaryMax)} mil VND`;
  }

  if (salaryMax !== null) {
    return `Up to ${formatMillionVnd(salaryMax)} mil VND`;
  }

  if (salaryMin !== null) {
    return `From ${formatMillionVnd(salaryMin)} mil VND`;
  }

  return "Salary negotiable";
};

function extractAvatarPath(avatarUrl: string): string | null {
  const trimmed = avatarUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.startsWith("http")) {
    return trimmed.replace(/^\/+/, "");
  }

  try {
    const parsed = new URL(trimmed);
    const marker = `/${AVATAR_BUCKET_NAME}/`;
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const objectPath = parsed.pathname.slice(markerIndex + marker.length);
    return decodeURIComponent(objectPath).replace(/^\/+/, "");
  } catch {
    return null;
  }
}

function appendVersionParam(avatarUrl: string, updatedAt: Date): string {
  try {
    const parsed = new URL(avatarUrl);
    parsed.searchParams.set("v", String(updatedAt.getTime()));
    return parsed.toString();
  } catch {
    return `${avatarUrl}?v=${updatedAt.getTime()}`;
  }
}

async function formatAvatarUrl(
  avatarUrl: string | null | undefined,
  updatedAt: Date,
): Promise<string | null> {
  if (!avatarUrl) {
    return null;
  }

  const avatarPath = extractAvatarPath(avatarUrl);

  if (avatarPath) {
    const { data, error } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET_NAME)
      .createSignedUrl(avatarPath, 60 * 60 * 24 * 7);

    if (!error && data?.signedUrl) {
      return appendVersionParam(data.signedUrl, updatedAt);
    }
  }

  return appendVersionParam(avatarUrl, updatedAt);
}

export const getPublicJobs = async (_req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const jobs = await prisma.job.findMany({
      include: {
        jobCategory: true,
        company: {
          include: {
            companyCategory: true,
            city: true,
          },
        },
        job_skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const jobsWithLogos = await Promise.all(
      jobs.map(async (job) => ({
        job_id: job.job_id,
        title: job.title,
        company_name: job.company.name,
        company_avatar_url: await formatAvatarUrl(
          job.company.avatar_url,
          job.company.updated_at,
        ),
        experience_years: job.experience_years,
        category: job.jobCategory?.title ?? "General",
        location: job.company.city?.name || job.company.address || "Remote",
        created_at: job.created_at,
        salary_label: formatSalaryLabel(job.salary_min, job.salary_max),
        skills: job.job_skills.map((item) => item.skill.name),
      })),
    );

    res.status(200).json({ jobs: jobsWithLogos });
  } catch (error) {
    console.error("Get public jobs error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const categories = await prisma.jobCategory.findMany({
      orderBy: { title: "asc" },
      select: {
        job_category_id: true,
        title: true,
      },
    });

    res.status(200).json({ categories });
  } catch (error) {
    console.error("Get job categories error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getPublicJobById = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const jobId = parseJobId(req.params.jobId);
    if (!jobId) {
      res.status(400).json({ message: "Invalid job id" });
      return;
    }

    const job = await prisma.job.findUnique({
      where: { job_id: jobId },
      include: {
        jobCategory: true,
        company: {
          include: {
            companyCategory: true,
            city: true,
          },
        },
        job_skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.status(200).json({
      job: {
        job_id: job.job_id,
        title: job.title,
        company_id: job.company.company_id,
        company_name: job.company.name,
        company_avatar_url: await formatAvatarUrl(
          job.company.avatar_url,
          job.company.updated_at,
        ),
        company_category: job.company.companyCategory?.title ?? "General",
        company_address:
          [job.company.address, job.company.city?.name]
            .filter((value): value is string => Boolean(value && value.trim()))
            .join(", ") || "Address not available",
        category: job.jobCategory?.title ?? "General",
        location: job.company.city?.name || job.company.address || "Remote",
        created_at: job.created_at,
        expiration_date: job.expiration_date,
        experience_years: job.experience_years,
        salary_label: formatSalaryLabel(job.salary_min, job.salary_max),
        description: job.description,
        requirements: job.requirements,
        benefits: job.benefits,
        skills: job.job_skills.map((item) => item.skill.name),
      },
    });
  } catch (error) {
    console.error("Get public job by id error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const applyToJob = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const jobId = parseJobId(req.params.jobId);
    if (!jobId) {
      res.status(400).json({ message: "Invalid job id" });
      return;
    }

    const userId = parsePositiveInteger(req.body.user_id);
    if (!userId) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const selectedResumeId = parseOptionalInteger(req.body.selected_resume_id);

    const [job, candidate] = await Promise.all([
      prisma.job.findUnique({
        where: { job_id: jobId },
        select: { job_id: true },
      }),
      prisma.candidate.findFirst({
        where: { user_id: userId },
        select: { candidate_id: true },
      }),
    ]);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (!candidate) {
      res.status(403).json({ message: "Only candidates can apply" });
      return;
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        job_id: jobId,
        candidate_id: candidate.candidate_id,
      },
      select: { application_id: true },
    });

    if (existingApplication) {
      res.status(409).json({ message: "You have already applied to this job" });
      return;
    }

    let resumeIdToUse: number | null = null;

    if (selectedResumeId) {
      const selectedResume = await prisma.resume.findFirst({
        where: {
          resume_id: selectedResumeId,
          candidate_id: candidate.candidate_id,
        },
        select: { resume_id: true },
      });

      if (!selectedResume) {
        res.status(404).json({ message: "Selected CV not found" });
        return;
      }

      resumeIdToUse = selectedResume.resume_id;
    } else {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          message: "Please upload a CV or choose a saved CV",
        });
        return;
      }

      const allowedMimeTypes = new Set([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]);

      if (!allowedMimeTypes.has(file.mimetype)) {
        res.status(400).json({
          message: "Only PDF, DOC, or DOCX files are supported",
        });
        return;
      }

      const originalFileName = decodeUploadedFileName(file.originalname);
      const extension = (() => {
        const lower = originalFileName.toLowerCase();
        if (lower.endsWith(".pdf")) return "pdf";
        if (lower.endsWith(".docx")) return "docx";
        if (lower.endsWith(".doc")) return "doc";
        return file.mimetype === "application/pdf"
          ? "pdf"
          : file.mimetype.includes("wordprocessingml")
            ? "docx"
            : "doc";
      })();

      const baseName = sanitizeFileName(
        originalFileName.replace(/\.[^.]+$/, ""),
      );
      const objectPath = `candidate-${candidate.candidate_id}/applications/${Date.now()}-${baseName || "resume"}.${extension}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(CV_BUCKET_NAME)
        .upload(objectPath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        res.status(500).json({ message: "Failed to upload CV" });
        return;
      }

      const createdResume = await prisma.resume.create({
        data: {
          candidate_id: candidate.candidate_id,
          name: originalFileName,
          file_url: objectPath,
          isProfile: false,
        },
        select: { resume_id: true },
      });

      resumeIdToUse = createdResume.resume_id;
    }

    if (!resumeIdToUse) {
      res.status(400).json({ message: "Resume is required to apply" });
      return;
    }

    const createdApplication = await prisma.application.create({
      data: {
        candidate_id: candidate.candidate_id,
        job_id: jobId,
        resume_id: resumeIdToUse,
        status: "pending",
        cover_letter:
          typeof req.body.introduction === "string" &&
          req.body.introduction.trim()
            ? req.body.introduction.trim()
            : null,
      },
      select: {
        application_id: true,
        status: true,
      },
    });

    void (async () => {
      try {
        const jobDetails = await prisma.job.findUnique({
          where: { job_id: jobId },
          select: {
            title: true,
            requirements: true,
            job_skills: {
              include: {
                skill: true,
              },
            },
          },
        });

        const resume = await prisma.resume.findUnique({
          where: { resume_id: resumeIdToUse },
          select: { file_url: true },
        });

        if (!jobDetails || !resume) {
          return;
        }

        const cvText = await extractCvTextFromSupabase(resume.file_url);
        const evaluation = await evaluateApplicationAI({
          cvText,
          jobRequirements: jobDetails.requirements,
          jobSkills: jobDetails.job_skills.map((item) => ({
            name: item.skill.name,
          })),
          jobTitle: jobDetails.title,
        });

        await prisma.aIEvaluation.create({
          data: {
            application_id: createdApplication.application_id,
            score: evaluation.score,
            matching_skills: evaluation.matchingSkills.join(", "),
            missing_skills: evaluation.missingSkills.join(", "),
            summary: evaluation.summary,
          },
        });
      } catch (error) {
        console.error("AI evaluation error:", error);
      }
    })();

    res.status(201).json({
      message: "Application submitted successfully",
      application: createdApplication,
    });
  } catch (error) {
    console.error("Apply to job error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getCandidateApplyStatus = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const jobId = parseJobId(req.params.jobId);
    if (!jobId) {
      res.status(400).json({ message: "Invalid job id" });
      return;
    }

    const userId = parseUserId(req.params.userId);
    if (!userId) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const candidate = await prisma.candidate.findFirst({
      where: { user_id: userId },
      select: { candidate_id: true },
    });

    if (!candidate) {
      res.status(404).json({ message: "Candidate not found" });
      return;
    }

    const application = await prisma.application.findFirst({
      where: {
        job_id: jobId,
        candidate_id: candidate.candidate_id,
      },
      select: {
        application_id: true,
        status: true,
      },
    });

    res.status(200).json({
      hasApplied: Boolean(application),
      application,
    });
  } catch (error) {
    console.error("Get candidate apply status error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getJobApplications = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const jobId = parseJobId(req.params.jobId);
    if (!jobId) {
      res.status(400).json({ message: "Invalid job id" });
      return;
    }

    const job = await prisma.job.findUnique({
      where: { job_id: jobId },
      select: { job_id: true, title: true, created_at: true },
    });

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    const applications = await prisma.application.findMany({
      where: { job_id: jobId },
      include: {
        candidate: {
          include: {
            city: true,
            user: true,
          },
        },
        resume: true,
        ai_evaluations: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
      orderBy: { created_at: "desc" },
    });

    const applicationsWithAvatars = await Promise.all(
      applications.map(async (application) => ({
        application_id: application.application_id,
        status: application.status,
        created_at: application.created_at,
        cover_letter: application.cover_letter || null,
        ai_evaluation: application.ai_evaluations[0]
          ? {
              score: application.ai_evaluations[0].score,
              matching_skills: application.ai_evaluations[0].matching_skills,
              missing_skills: application.ai_evaluations[0].missing_skills,
              summary: application.ai_evaluations[0].summary,
            }
          : null,
        candidate: {
          candidate_id: application.candidate.candidate_id,
          full_name: application.candidate.full_name,
          email: application.candidate.user?.email || "",
          phone: application.candidate.phone || "",
          location: application.candidate.city?.name || "N/A",
          avatar_url: await formatAvatarUrl(
            application.candidate.avatar_url,
            application.candidate.user?.updated_at ?? application.created_at,
          ),
        },
        resume: {
          resume_id: application.resume.resume_id,
          name: application.resume.name,
          file_url: application.resume.file_url,
        },
      })),
    );

    res.status(200).json({
      job: {
        job_id: job.job_id,
        title: job.title,
        created_at: job.created_at,
      },
      applications: applicationsWithAvatars,
      total: applicationsWithAvatars.length,
    });
  } catch (error) {
    console.error("Get job applications error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getRecruiterApplications = async (req: Request, res: Response) => {
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

    if (!user || user.role?.title?.toLowerCase() !== "recruiter") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const company = await prisma.company.findFirst({
      where: { user_id: userId },
      select: {
        company_id: true,
        name: true,
      },
    });

    if (!company) {
      res.status(404).json({ message: "Company not found for this recruiter" });
      return;
    }

    const jobs = await prisma.job.findMany({
      where: { company_id: company.company_id },
      select: {
        job_id: true,
        title: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    const jobLookup = new Map(jobs.map((job) => [job.job_id, job] as const));

    const applications = jobs.length
      ? await prisma.application.findMany({
          where: {
            job_id: {
              in: jobs.map((job) => job.job_id),
            },
          },
          include: {
            candidate: {
              include: {
                city: true,
                user: true,
              },
            },
            resume: true,
            ai_evaluations: {
              orderBy: { created_at: "desc" },
              take: 1,
            },
          },
          orderBy: { created_at: "desc" },
        })
      : [];

    const applicationsWithAvatars = await Promise.all(
      applications.map(async (application) => ({
        application_id: application.application_id,
        status: application.status,
        created_at: application.created_at,
        cover_letter: application.cover_letter || null,
        job: {
          job_id: application.job_id,
          title: jobLookup.get(application.job_id)?.title ?? "Job",
        },
        ai_evaluation: application.ai_evaluations[0]
          ? {
              score: application.ai_evaluations[0].score,
              matching_skills: application.ai_evaluations[0].matching_skills,
              missing_skills: application.ai_evaluations[0].missing_skills,
              summary: application.ai_evaluations[0].summary,
            }
          : null,
        candidate: {
          candidate_id: application.candidate.candidate_id,
          full_name: application.candidate.full_name,
          email: application.candidate.user?.email || "",
          phone: application.candidate.phone || "",
          location: application.candidate.city?.name || "N/A",
          avatar_url: await formatAvatarUrl(
            application.candidate.avatar_url,
            application.candidate.user?.updated_at ?? application.created_at,
          ),
        },
        resume: {
          resume_id: application.resume.resume_id,
          name: application.resume.name,
          file_url: application.resume.file_url,
        },
      })),
    );

    res.status(200).json({
      company,
      applications: applicationsWithAvatars,
      total: applicationsWithAvatars.length,
    });
  } catch (error) {
    console.error("Get recruiter applications error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

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

    if (!user || user.role?.title?.toLowerCase() !== "recruiter") {
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
        jobCategory: true,
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
      category: job.jobCategory?.title ?? "General",
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

    if (!user || user.role?.title?.toLowerCase() !== "recruiter") {
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
    const experienceYears = parseOptionalNonNegativeInteger(
      req.body.experience_years,
    );
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

    if (
      req.body.experience_years !== undefined &&
      parseOptionalNonNegativeInteger(req.body.experience_years) === null
    ) {
      res
        .status(400)
        .json({ message: "Experience years must be a non-negative integer" });
      return;
    }

    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      res.status(400).json({ message: "Salary minimum cannot exceed maximum" });
      return;
    }

    const category = await prisma.jobCategory.findUnique({
      where: { job_category_id: categoryId },
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
          experience_years: experienceYears,
          salary_min: salaryMin,
          salary_max: salaryMax,
          benefits,
          expiration_date: expirationDate,
          job_category_id: categoryId,
          company_id: company.company_id,
          status: "open",
        },
        include: {
          jobCategory: true,
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
            jobCategory: true,
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

export const getRecruiterJobById = async (req: Request, res: Response) => {
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

    if (!user || user.role?.title?.toLowerCase() !== "recruiter") {
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

    const job = await prisma.job.findUnique({
      where: { job_id: jobId },
      include: {
        job_skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (job.company_id !== company.company_id) {
      res.status(403).json({ message: "You can only access your own jobs" });
      return;
    }

    res.status(200).json({
      job: {
        job_id: job.job_id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        experience_years: job.experience_years,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        benefits: job.benefits,
        expiration_date: job.expiration_date,
        category_id: job.job_category_id,
        skills: job.job_skills.map((item) => item.skill.name),
      },
    });
  } catch (error) {
    console.error("Get recruiter job by id error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const updateRecruiterJob = async (req: Request, res: Response) => {
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

    if (!user || user.role?.title?.toLowerCase() !== "recruiter") {
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
      res.status(403).json({ message: "You can only update your own jobs" });
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
    const experienceYears = parseOptionalNonNegativeInteger(
      req.body.experience_years,
    );
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

    if (
      req.body.experience_years !== undefined &&
      parseOptionalNonNegativeInteger(req.body.experience_years) === null
    ) {
      res
        .status(400)
        .json({ message: "Experience years must be a non-negative integer" });
      return;
    }

    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      res.status(400).json({ message: "Salary minimum cannot exceed maximum" });
      return;
    }

    const category = await prisma.jobCategory.findUnique({
      where: { job_category_id: categoryId },
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

    const updatedJob = await prisma.$transaction(async (transaction) => {
      await transaction.job.update({
        where: { job_id: jobId },
        data: {
          title,
          description,
          requirements,
          experience_years: experienceYears,
          salary_min: salaryMin,
          salary_max: salaryMax,
          benefits,
          expiration_date: expirationDate,
          job_category_id: categoryId,
        },
      });

      await transaction.jobSkill.deleteMany({
        where: { job_id: jobId },
      });

      if (normalizedSkillNames.length > 0) {
        const linkedSkills = [] as Array<{ skill_id: number }>;

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
            linkedSkills.push({ skill_id: skill.skill_id });
            continue;
          }

          const createdSkill = await transaction.skill.create({
            data: { name: skillName },
          });

          linkedSkills.push({ skill_id: createdSkill.skill_id });
        }

        await transaction.jobSkill.createMany({
          data: linkedSkills.map((skill) => ({
            job_id: jobId,
            skill_id: skill.skill_id,
          })),
        });
      }

      return transaction.job.findUnique({
        where: { job_id: jobId },
        include: {
          job_skills: {
            include: {
              skill: true,
            },
          },
        },
      });
    });

    res.status(200).json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Update recruiter job error:", error);
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

    if (!user || user.role?.title?.toLowerCase() !== "recruiter") {
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
