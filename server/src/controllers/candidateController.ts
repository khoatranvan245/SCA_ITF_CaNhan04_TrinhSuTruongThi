import { Request, Response } from "express";
import sharp from "sharp";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const ROLE_CANDIDATE = 1;
const AVATAR_BUCKET_NAME = "Avatar";
const CV_BUCKET_NAME = "CV";
const EXPIRABLE_APPLICATION_STATUSES = new Set(["pending", "reviewing"]);

function shouldExpireApplication(
  status: string,
  expirationDate: Date | null | undefined,
): boolean {
  if (!expirationDate) {
    return false;
  }

  return (
    expirationDate.getTime() < Date.now() &&
    EXPIRABLE_APPLICATION_STATUSES.has(status.toLowerCase())
  );
}

function normalizeSkillName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function parseUserId(rawUserId: string | string[] | undefined): number | null {
  const normalizedValue = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const userId = Number(normalizedValue);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return userId;
}

function parseCityId(rawCityId: unknown): number | null {
  if (rawCityId === null) {
    return null;
  }

  const cityId = Number(rawCityId);

  if (!Number.isInteger(cityId) || cityId <= 0) {
    return null;
  }

  return cityId;
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

function buildCandidateAvatarFileName(candidateId: number) {
  return `candidate-${candidateId}-${Date.now()}.png`;
}

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

function extractResumePath(fileUrl: string): string | null {
  const trimmed = fileUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.startsWith("http")) {
    return trimmed.replace(/^\/+/, "");
  }

  try {
    const parsed = new URL(trimmed);
    const marker = `/${CV_BUCKET_NAME}/`;
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

async function toSignedResumeUrl(fileUrl: string): Promise<string> {
  const resumePath = extractResumePath(fileUrl);
  if (!resumePath) {
    return fileUrl;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(CV_BUCKET_NAME)
    .createSignedUrl(resumePath, 60 * 60 * 24 * 7);

  if (error || !data?.signedUrl) {
    return fileUrl;
  }

  return data.signedUrl;
}

export const getCandidateCities = async (_req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
      select: {
        city_id: true,
        name: true,
      },
    });

    res.status(200).json({ cities });
  } catch (error) {
    console.error("Get candidate cities error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getCandidateApplications = async (req: Request, res: Response) => {
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

    if (!user || user.role_id !== ROLE_CANDIDATE) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const candidate = await prisma.candidate.findFirst({
      where: { user_id: userId },
      select: { candidate_id: true },
    });

    if (!candidate) {
      res.status(404).json({ message: "Candidate profile not found" });
      return;
    }

    const applications = await prisma.application.findMany({
      where: { candidate_id: candidate.candidate_id },
      include: {
        job: {
          include: {
            jobCategory: true,
            company: {
              include: {
                city: true,
              },
            },
          },
        },
        resume: true,
      },
      orderBy: { created_at: "desc" },
    });

    const expiredApplicationIds = applications
      .filter((application) =>
        shouldExpireApplication(
          application.status,
          application.job.expiration_date,
        ),
      )
      .map((application) => application.application_id);

    if (expiredApplicationIds.length > 0) {
      await prisma.application.updateMany({
        where: {
          application_id: {
            in: expiredApplicationIds,
          },
        },
        data: {
          status: "expired",
        },
      });
    }

    const expiredIdSet = new Set(expiredApplicationIds);

    const applicationsWithLogos = await Promise.all(
      applications.map(async (application) => ({
        application_id: application.application_id,
        status: expiredIdSet.has(application.application_id)
          ? "expired"
          : application.status,
        created_at: application.created_at,
        job: {
          job_id: application.job.job_id,
          title: application.job.title,
          category: application.job.jobCategory?.title ?? "General",
          company_name: application.job.company.name,
          company_avatar_url: await formatAvatarUrl(
            application.job.company.avatar_url,
            application.job.company.updated_at,
          ),
          company_location:
            application.job.company.city?.name ||
            application.job.company.address ||
            "Remote",
        },
        resume: {
          resume_id: application.resume.resume_id,
          name: application.resume.name,
        },
      })),
    );

    res.status(200).json({
      applications: applicationsWithLogos,
      total: applicationsWithLogos.length,
    });
  } catch (error) {
    console.error("Get candidate applications error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getCandidateNotifications = async (
  req: Request,
  res: Response,
) => {
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

    if (!user || user.role?.title?.toLowerCase() !== "candidate") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        select: {
          notification_id: true,
          title: true,
          message: true,
          is_read: true,
          created_at: true,
        },
      }),
      prisma.notification.count({
        where: { user_id: userId, is_read: false },
      }),
    ]);

    res.status(200).json({
      notifications,
      total: notifications.length,
      unreadCount,
    });
  } catch (error) {
    console.error("Get candidate notifications error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getCandidateProfile = async (req: Request, res: Response) => {
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

    if (!user || user.role_id !== ROLE_CANDIDATE) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const candidate = await prisma.candidate.findFirst({
      where: { user_id: userId },
      include: {
        city: true,
        resumes: {
          where: { isProfile: true },
          orderBy: { uploaded_at: "desc" },
        },
        candidate_skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!candidate) {
      res.status(404).json({ message: "Candidate profile not found" });
      return;
    }

    const resumes = await Promise.all(
      candidate.resumes.map(async (resume) => ({
        resume_id: resume.resume_id,
        name: resume.name,
        file_url: await toSignedResumeUrl(resume.file_url),
        uploaded_at: resume.uploaded_at,
      })),
    );

    const avatarUrl = await formatAvatarUrl(
      candidate.avatar_url,
      user.updated_at,
    );

    res.status(200).json({
      candidate: {
        candidate_id: candidate.candidate_id,
        user_id: candidate.user_id,
        full_name: candidate.full_name,
        phone: candidate.phone,
        avatar_url: avatarUrl,
        city_id: candidate.city_id,
        city: candidate.city,
        resumes,
        skills: candidate.candidate_skills.map((item) => item.skill.name),
      },
      user: {
        user_id: user.user_id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Get candidate profile error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const updateCandidateProfile = async (req: Request, res: Response) => {
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

    if (!user || user.role_id !== ROLE_CANDIDATE) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const existingCandidate = await prisma.candidate.findFirst({
      where: { user_id: userId },
    });

    if (!existingCandidate) {
      res.status(404).json({ message: "Candidate profile not found" });
      return;
    }

    const { full_name, phone, city_id } = req.body;
    const rawSkills = req.body.skills;
    const skillsInput: string[] = Array.isArray(rawSkills)
      ? rawSkills
          .map((skill) => String(skill).trim())
          .filter((skill) => skill.length > 0)
      : typeof rawSkills === "string" && rawSkills.trim()
        ? rawSkills
            .split(",")
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0)
        : [];

    if (typeof full_name === "string" && !full_name.trim()) {
      res.status(400).json({ message: "Full name cannot be empty" });
      return;
    }

    if (city_id !== undefined) {
      const parsedCityId = parseCityId(city_id);

      if (!parsedCityId) {
        res.status(400).json({ message: "Invalid city" });
        return;
      }

      const existingCity = await prisma.city.findUnique({
        where: { city_id: parsedCityId },
      });

      if (!existingCity) {
        res.status(400).json({ message: "Selected city does not exist" });
        return;
      }
    }

    const skillMap = new Map<string, string>();
    for (const skill of skillsInput) {
      const normalizedKey = normalizeSkillName(skill);
      if (!normalizedKey || skillMap.has(normalizedKey)) {
        continue;
      }

      skillMap.set(normalizedKey, skill);
    }

    const normalizedSkillNames = Array.from(skillMap.values());

    const updatedCandidate = await prisma.$transaction(async (transaction) => {
      const savedCandidate = await transaction.candidate.update({
        where: { candidate_id: existingCandidate.candidate_id },
        data: {
          ...(typeof full_name === "string"
            ? { full_name: full_name.trim() }
            : {}),
          ...(typeof phone === "string" ? { phone: phone.trim() || null } : {}),
          ...(city_id !== undefined ? { city_id: Number(city_id) } : {}),
        },
        include: {
          city: true,
        },
      });

      if (skillsInput !== undefined) {
        await transaction.candidateSkill.deleteMany({
          where: { candidate_id: savedCandidate.candidate_id },
        });

        if (normalizedSkillNames.length > 0) {
          const linkedSkills: Array<{ skill_id: number; name: string }> = [];

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

          await transaction.candidateSkill.createMany({
            data: linkedSkills.map((skill) => ({
              candidate_id: savedCandidate.candidate_id,
              skill_id: skill.skill_id,
            })),
          });
        }
      }

      return transaction.candidate.findUnique({
        where: { candidate_id: savedCandidate.candidate_id },
        include: {
          city: true,
          candidate_skills: {
            include: {
              skill: true,
            },
          },
        },
      });
    });

    if (!updatedCandidate) {
      res.status(404).json({ message: "Candidate profile not found" });
      return;
    }

    res.status(200).json({
      message: "Candidate profile updated successfully",
      candidate: {
        candidate_id: updatedCandidate.candidate_id,
        user_id: updatedCandidate.user_id,
        full_name: updatedCandidate.full_name,
        phone: updatedCandidate.phone,
        avatar_url: await formatAvatarUrl(
          updatedCandidate.avatar_url,
          user.updated_at,
        ),
        city_id: updatedCandidate.city_id,
        city: updatedCandidate.city,
        skills: updatedCandidate.candidate_skills.map(
          (item) => item.skill.name,
        ),
      },
      user: {
        user_id: user.user_id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Update candidate profile error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const uploadCandidateResume = async (req: Request, res: Response) => {
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

    if (!user || user.role_id !== ROLE_CANDIDATE) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const candidate = await prisma.candidate.findFirst({
      where: { user_id: userId },
      include: {
        resumes: {
          orderBy: { uploaded_at: "desc" },
        },
      },
    });

    if (!candidate) {
      res.status(404).json({ message: "Candidate profile not found" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Please select a CV file to upload" });
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

    const baseName = sanitizeFileName(originalFileName.replace(/\.[^.]+$/, ""));
    const objectPath = `candidate-${candidate.candidate_id}/${Date.now()}-${baseName || "resume"}.${extension}`;

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
        isProfile: true,
      },
    });

    const signedUrl = await toSignedResumeUrl(createdResume.file_url);

    res.status(200).json({
      message: "CV uploaded successfully",
      resume: {
        resume_id: createdResume.resume_id,
        name: createdResume.name,
        file_url: signedUrl,
        uploaded_at: createdResume.uploaded_at,
      },
    });
  } catch (error) {
    console.error("Upload candidate resume error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const uploadCandidateAvatar = async (req: Request, res: Response) => {
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

    if (!user || user.role_id !== ROLE_CANDIDATE) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const candidate = await prisma.candidate.findFirst({
      where: { user_id: userId },
      select: {
        candidate_id: true,
        avatar_url: true,
      },
    });

    if (!candidate) {
      res.status(404).json({ message: "Candidate profile not found" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Please select an avatar image" });
      return;
    }

    const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (!allowedMimeTypes.has(file.mimetype)) {
      res.status(400).json({
        message: "Only JPG, PNG, or WEBP images are supported",
      });
      return;
    }

    const avatarBuffer = await sharp(file.buffer)
      .resize(512, 512, {
        fit: "cover",
        position: "centre",
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    const objectPath = `candidates/${buildCandidateAvatarFileName(
      candidate.candidate_id,
    )}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET_NAME)
      .upload(objectPath, avatarBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      res.status(500).json({ message: "Failed to upload avatar" });
      return;
    }

    const previousAvatarPath = extractAvatarPath(candidate.avatar_url ?? "");
    if (previousAvatarPath && previousAvatarPath !== objectPath) {
      await supabaseAdmin.storage
        .from(AVATAR_BUCKET_NAME)
        .remove([previousAvatarPath]);
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { candidate_id: candidate.candidate_id },
      data: {
        avatar_url: objectPath,
      },
    });

    const avatarUrl = await formatAvatarUrl(
      updatedCandidate.avatar_url,
      user.updated_at,
    );

    res.status(200).json({
      message: "Avatar uploaded successfully",
      candidate: {
        candidate_id: updatedCandidate.candidate_id,
        avatar_url: avatarUrl,
      },
    });
  } catch (error) {
    console.error("Upload candidate avatar error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const deleteCandidateResume = async (req: Request, res: Response) => {
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

    if (!user || user.role_id !== ROLE_CANDIDATE) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const resumeId = Number(req.params.resumeId);
    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      res.status(400).json({ message: "Invalid resume id" });
      return;
    }

    const candidate = await prisma.candidate.findFirst({
      where: { user_id: userId },
      include: {
        resumes: true,
      },
    });

    if (!candidate) {
      res.status(404).json({ message: "Candidate profile not found" });
      return;
    }

    const targetResume = candidate.resumes.find(
      (resume) => resume.resume_id === resumeId,
    );

    if (!targetResume) {
      res.status(404).json({ message: "Resume not found" });
      return;
    }

    const resumePath = extractResumePath(targetResume.file_url);
    if (resumePath) {
      await supabaseAdmin.storage.from(CV_BUCKET_NAME).remove([resumePath]);
    }

    await prisma.resume.delete({
      where: { resume_id: targetResume.resume_id },
    });

    res.status(200).json({ message: "CV deleted successfully" });
  } catch (error) {
    console.error("Delete candidate resume error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};
