import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import crypto from "crypto";

const ROLE_CANDIDATE = 1;
const ROLE_RECRUITER = 2;
const ROLE_CANDIDATE_TITLE = "candidate";
const ROLE_RECRUITER_TITLE = "recruiter";
const ROLE_ADMIN_TITLES = ["admin", "super admin", "system administrator"];

// Hash password function
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Common validation function
function validateBasicFields(
  email: string,
  password: string,
  confirmPassword: string,
) {
  if (!email || !password || !confirmPassword) {
    return "Missing required fields";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
}

async function ensureRoleIdByTitle(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  roleTitle: string,
): Promise<number> {
  const normalizedTitle = roleTitle.trim().toLowerCase();

  const existingRole = await tx.role.findFirst({
    where: {
      title: {
        equals: normalizedTitle,
        mode: "insensitive",
      },
    },
    select: { role_id: true },
  });

  if (existingRole) {
    return existingRole.role_id;
  }

  const createdRole = await tx.role.create({
    data: {
      title: normalizedTitle,
      description:
        normalizedTitle === ROLE_CANDIDATE_TITLE
          ? "Candidate account"
          : "Recruiter account",
    },
    select: { role_id: true },
  });

  return createdRole.role_id;
}

// Candidate Sign up controller
export const candidateSignup = async (req: Request, res: Response) => {
  try {
    // Ensure connection is established
    await prisma.$connect();

    const { email, password, confirmPassword, fullName, phone } = req.body;

    // Validate basic fields
    const validationError = validateBasicFields(
      email,
      password,
      confirmPassword,
    );
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    if (!fullName || !String(fullName).trim()) {
      res.status(400).json({ message: "Full name is required" });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    // Hash password
    const passwordHash = hashPassword(password);

    const defaultCity =
      (await prisma.city.findFirst({
        where: { name: { in: ["Hà Nội", "Ha Noi"] } },
      })) ||
      (await prisma.city.findFirst({
        orderBy: { city_id: "asc" },
      }));

    if (!defaultCity) {
      res.status(400).json({
        message: "No city data found. Please seed city table before signup.",
      });
      return;
    }

    // Create user and candidate profile in one transaction.
    const result = await prisma.$transaction(async (tx) => {
      const candidateRoleId = await ensureRoleIdByTitle(
        tx,
        ROLE_CANDIDATE_TITLE,
      );

      const createdUser = await tx.user.create({
        data: {
          email,
          password_hash: passwordHash,
          role_id: candidateRoleId,
        },
        include: {
          role: true,
        },
      });

      const createdCandidate = await tx.candidate.create({
        data: {
          full_name: String(fullName).trim(),
          phone: typeof phone === "string" ? phone.trim() : null,
          user_id: createdUser.user_id,
          city_id: defaultCity.city_id,
        },
      });

      return { user: createdUser, candidate: createdCandidate };
    });

    res.status(201).json({
      message: "Candidate registered successfully",
      user: {
        user_id: result.user.user_id,
        email: result.user.email,
        role: result.user.role,
      },
      candidate: result.candidate,
    });
  } catch (error) {
    console.error("Candidate signup error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

// Recruiter Sign up controller
export const recruiterSignup = async (req: Request, res: Response) => {
  try {
    // Ensure connection is established
    await prisma.$connect();

    const { email, password, confirmPassword, companyName, cityId } = req.body;

    // Validate basic fields
    const validationError = validateBasicFields(
      email,
      password,
      confirmPassword,
    );
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    // Validate recruiter specific fields
    if (!companyName || !cityId) {
      res.status(400).json({
        message: "Company name and location are required for recruiter signup",
      });
      return;
    }

    // Validate cityId is a number
    const parsedCityId = Number(cityId);
    if (!Number.isInteger(parsedCityId) || parsedCityId <= 0) {
      res.status(400).json({ message: "Invalid location selected" });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    // Verify city exists
    const city = await prisma.city.findUnique({
      where: { city_id: parsedCityId },
    });

    if (!city) {
      res.status(400).json({ message: "Selected location does not exist" });
      return;
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create user and company in transaction
    const result = await prisma.$transaction(async (tx) => {
      const recruiterRoleId = await ensureRoleIdByTitle(
        tx,
        ROLE_RECRUITER_TITLE,
      );

      const createdUser = await tx.user.create({
        data: {
          email,
          password_hash: passwordHash,
          role_id: recruiterRoleId,
        },
        include: {
          role: true,
        },
      });

      const createdCompany = await tx.company.create({
        data: {
          name: String(companyName).trim(),
          city_id: parsedCityId,
          user_id: createdUser.user_id,
        },
      });

      return { user: createdUser, company: createdCompany };
    });

    res.status(201).json({
      message: "Recruiter registered successfully",
      user: {
        user_id: result.user.user_id,
        email: result.user.email,
        role: result.user.role,
      },
      company: result.company,
    });
  } catch (error) {
    console.error("Recruiter signup error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

// Login controller
const loginByRole = async (
  req: Request,
  res: Response,
  expectedRoleId: number,
  roleLabel: string,
) => {
  try {
    // Ensure connection is established
    await prisma.$connect();

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (user.password_hash !== passwordHash) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (user.role?.title?.toLowerCase() !== roleLabel.toLowerCase()) {
      res.status(403).json({
        message: "Invalid email or password",
      });
      return;
    }

    let candidate = null;
    if (user.role?.title?.toLowerCase() === ROLE_CANDIDATE_TITLE) {
      candidate = await prisma.candidate.findFirst({
        where: { user_id: user.user_id },
      });
    }

    // If recruiter, also fetch their company
    let company = null;
    if (user.role?.title?.toLowerCase() === ROLE_RECRUITER_TITLE) {
      company = await prisma.company.findFirst({
        where: { user_id: user.user_id },
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        full_name: candidate?.full_name ?? null,
      },
      company: company,
    });
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};

// Candidate Login controller
export const candidateLogin = async (req: Request, res: Response) => {
  await loginByRole(req, res, ROLE_CANDIDATE, "candidate");
};

// Recruiter Login controller
export const recruiterLogin = async (req: Request, res: Response) => {
  await loginByRole(req, res, ROLE_RECRUITER, "recruiter");
};

// Admin Login controller
export const adminLogin = async (req: Request, res: Response) => {
  try {
    await prisma.$connect();

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const passwordHash = hashPassword(password);
    if (user.password_hash !== passwordHash) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const roleTitle = user.role?.title?.toLowerCase();
    if (!roleTitle || !ROLE_ADMIN_TITLES.includes(roleTitle)) {
      res.status(403).json({ message: "Invalid email or password" });
      return;
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        full_name: null,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    res
      .status(500)
      .json({ message: "Internal server error", error: errorMessage });
  }
};
