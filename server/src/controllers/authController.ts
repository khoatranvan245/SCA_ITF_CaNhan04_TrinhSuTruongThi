import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import crypto from "crypto";

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

// Candidate Sign up controller
export const candidateSignup = async (req: Request, res: Response) => {
  try {
    // Ensure connection is established
    await prisma.$connect();

    const { email, password, confirmPassword } = req.body;

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

    // Create user with candidate role (role_id = 1)
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        role_id: 1, // Candidate
      },
      include: {
        role: true,
      },
    });

    res.status(201).json({
      message: "Candidate registered successfully",
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
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

    const { email, password, confirmPassword, companyName, companyLocation } =
      req.body;

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
    if (!companyName || !companyLocation) {
      res.status(400).json({
        message: "Company name and location are required for recruiter signup",
      });
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

    // Create user and company in transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password_hash: passwordHash,
          role_id: 2, // Recruiter
        },
        include: {
          role: true,
        },
      });

      const createdCompany = await tx.company.create({
        data: {
          name: String(companyName).trim(),
          location: String(companyLocation).trim(),
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
export const login = async (req: Request, res: Response) => {
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

    // If recruiter, also fetch their company
    let company = null;
    if (user.role_id === 2) {
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
