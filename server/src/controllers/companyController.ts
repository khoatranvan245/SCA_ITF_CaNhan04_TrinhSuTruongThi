import { Request, Response } from "express";
import sharp from "sharp";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const ROLE_RECRUITER = 2;

function parseUserId(rawUserId: string | string[] | undefined): number | null {
  const normalizedValue = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const userId = Number(normalizedValue);
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }
  return userId;
}

function parseCompanyId(
  rawCompanyId: string | string[] | undefined,
): number | null {
  const normalizedValue = Array.isArray(rawCompanyId)
    ? rawCompanyId[0]
    : rawCompanyId;
  const companyId = Number(normalizedValue);
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return null;
  }
  return companyId;
}

function parseCategoryId(rawCategoryId: unknown): number | null {
  if (rawCategoryId === null) {
    return null;
  }

  const categoryId = Number(rawCategoryId);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return null;
  }
  return categoryId;
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

const AVATAR_BUCKET_NAME = "Avatar";

function extractAvatarPath(avatarUrl: string): string | null {
  if (!avatarUrl) {
    return null;
  }

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

function appendVersionParam(
  avatarUrl: string | null | undefined,
  updatedAt: Date,
): string | null {
  if (!avatarUrl) {
    return null;
  }

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

function parseProfilePayload(body: Request["body"]) {
  if (typeof body.profile === "string") {
    try {
      return JSON.parse(body.profile) as Record<string, unknown>;
    } catch {
      throw new Error("Invalid profile payload");
    }
  }

  return body as Record<string, unknown>;
}

function buildAvatarFileName(companyId: number, createdAt: Date) {
  const creationStamp = createdAt.toISOString().slice(0, 10).replace(/-/g, "");
  return `${companyId}-${creationStamp}.png`;
}

async function uploadCompanyAvatar(
  avatarFile: Express.Multer.File,
  companyId: number,
  createdAt: Date,
) {
  const fileName = buildAvatarFileName(companyId, createdAt);
  let processedImage: Buffer;

  try {
    processedImage = await sharp(avatarFile.buffer)
      .resize(256, 256, {
        fit: "cover",
        position: "centre",
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
  } catch {
    throw new Error("Invalid or unsupported image format.");
  }

  const uploadPath = `companies/${fileName}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET_NAME)
    .upload(uploadPath, processedImage, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    const normalizedMessage = uploadError.message.toLowerCase();

    if (
      normalizedMessage.includes("bucket") &&
      normalizedMessage.includes("not")
    ) {
      throw new Error(
        "Supabase bucket 'Avatar' was not found. Please create this bucket in Supabase Storage.",
      );
    }

    if (
      normalizedMessage.includes("permission") ||
      normalizedMessage.includes("not allowed") ||
      normalizedMessage.includes("policy") ||
      normalizedMessage.includes("unauthorized")
    ) {
      throw new Error(
        "Supabase key does not have permission to upload to bucket 'Avatar'.",
      );
    }

    throw new Error(`Avatar upload failed: ${uploadError.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(AVATAR_BUCKET_NAME)
    .getPublicUrl(uploadPath);

  return data.publicUrl;
}

export const getCategories = async (_req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const categories = await prisma.companyCategory.findMany({
      orderBy: { title: "asc" },
      select: {
        company_category_id: true,
        title: true,
      },
    });

    res.status(200).json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getPublicCompanies = async (_req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const companies = await prisma.company.findMany({
      include: {
        companyCategory: true,
        city: true,
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const mappedCompanies = await Promise.all(
      companies.map(async (company) => ({
        company_id: company.company_id,
        name: company.name,
        description: company.description,
        avatar_url: await formatAvatarUrl(
          company.avatar_url,
          company.updated_at,
        ),
        category: company.companyCategory?.title ?? "General",
        location: company.city?.name || company.address || "Remote",
        open_roles_count: company._count.jobs,
        since_year: company.created_at.getFullYear(),
      })),
    );

    res.status(200).json({
      companies: mappedCompanies,
    });
  } catch (error) {
    console.error("Get public companies error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getPublicCompanyById = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const companyId = parseCompanyId(req.params.companyId);
    if (!companyId) {
      res.status(400).json({ message: "Invalid company id" });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { company_id: companyId },
      include: {
        companyCategory: true,
        city: true,
        jobs: {
          where: { status: "open" },
          orderBy: { created_at: "desc" },
          select: {
            job_id: true,
            title: true,
            description: true,
            salary_min: true,
            salary_max: true,
            created_at: true,
          },
        },
      },
    });

    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    const displayAvatarUrl = await formatAvatarUrl(
      company.avatar_url,
      company.updated_at,
    );

    res.status(200).json({
      company: {
        company_id: company.company_id,
        name: company.name,
        description: company.description,
        website: company.website,
        avatar_url: displayAvatarUrl,
        category: company.companyCategory?.title ?? "General",
        location: company.city?.name || company.address || "Remote",
        open_roles_count: company.jobs.length,
        since_year: company.created_at.getFullYear(),
        jobs: company.jobs.map((job) => ({
          job_id: job.job_id,
          title: job.title,
          description: job.description,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          created_at: job.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("Get public company by id error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getCities = async (_req: Request, res: Response) => {
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
    console.error("Get cities error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const getCompanyProfile = async (req: Request, res: Response) => {
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
      include: { companyCategory: true, city: true },
    });

    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    const displayAvatarUrl = await formatAvatarUrl(
      company.avatar_url,
      company.updated_at,
    );

    res.status(200).json({
      company: {
        ...company,
        category_id: company.company_category_id,
        avatar_url: displayAvatarUrl,
      },
    });
  } catch (error) {
    console.error("Get company profile error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

export const updateCompanyProfile = async (req: Request, res: Response) => {
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

    const existingCompany = await prisma.company.findFirst({
      where: { user_id: userId },
    });

    if (!existingCompany) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    const avatarFile = (req as Request & { file?: Express.Multer.File }).file;

    let profilePayload: Record<string, unknown>;

    try {
      profilePayload = parseProfilePayload(req.body);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Invalid profile payload",
      });
      return;
    }

    const { name, website, description, category_id, city_id, address } =
      profilePayload;

    if (typeof name === "string" && !name.trim()) {
      res.status(400).json({ message: "Company name cannot be empty" });
      return;
    }

    if (category_id !== undefined && category_id !== null) {
      const parsedCategoryId = parseCategoryId(category_id);

      if (!parsedCategoryId) {
        res.status(400).json({ message: "Invalid category" });
        return;
      }

      const existingCategory = await prisma.companyCategory.findUnique({
        where: { company_category_id: parsedCategoryId },
      });

      if (!existingCategory) {
        res.status(400).json({ message: "Selected category does not exist" });
        return;
      }
    }

    if (city_id !== undefined && city_id !== null) {
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

    let avatarUrl = existingCompany.avatar_url;

    if (avatarFile) {
      try {
        avatarUrl = await uploadCompanyAvatar(
          avatarFile,
          existingCompany.company_id,
          existingCompany.created_at,
        );
      } catch (error) {
        res.status(400).json({
          message:
            error instanceof Error ? error.message : "Avatar upload failed.",
        });
        return;
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { company_id: existingCompany.company_id },
      data: {
        ...(typeof name === "string" ? { name: name.trim() } : {}),
        ...(typeof website === "string" ? { website: website.trim() } : {}),
        ...(typeof address === "string" ? { address: address.trim() } : {}),
        ...(typeof description === "string"
          ? { description: description.trim() }
          : {}),
        ...(avatarFile ? { avatar_url: avatarUrl } : {}),
        ...(category_id !== undefined
          ? { company_category_id: parseCategoryId(category_id) }
          : {}),
        ...(city_id !== undefined ? { city_id: parseCityId(city_id) } : {}),
      },
      include: { companyCategory: true, city: true },
    });

    const displayAvatarUrl = await formatAvatarUrl(
      updatedCompany.avatar_url,
      updatedCompany.updated_at,
    );

    res.status(200).json({
      message: "Company profile updated successfully",
      company: {
        ...updatedCompany,
        category_id: updatedCompany.company_category_id,
        avatar_url: displayAvatarUrl,
      },
    });
  } catch (error) {
    console.error("Update company profile error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};
