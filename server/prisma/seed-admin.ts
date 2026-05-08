import crypto from "crypto";
import { prisma } from "../src/lib/prisma";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin";
const ADMIN_ROLE_TITLE = "admin";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function ensureAdminRole(): Promise<number> {
  const existingRole = await prisma.role.findFirst({
    where: {
      title: {
        equals: ADMIN_ROLE_TITLE,
        mode: "insensitive",
      },
    },
    select: { role_id: true },
  });

  if (existingRole) {
    return existingRole.role_id;
  }

  const createdRole = await prisma.role.create({
    data: {
      title: ADMIN_ROLE_TITLE,
      description: "Administrator account",
    },
    select: { role_id: true },
  });

  return createdRole.role_id;
}

async function seedAdmin() {
  await prisma.$connect();

  const adminRoleId = await ensureAdminRole();
  const passwordHash = hashPassword(ADMIN_PASSWORD);

  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { user_id: true },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        password_hash: passwordHash,
        role_id: adminRoleId,
      },
    });

    console.log(`Updated admin account: ${ADMIN_EMAIL}`);
    return;
  }

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      password_hash: passwordHash,
      role_id: adminRoleId,
    },
  });

  console.log(`Created admin account: ${ADMIN_EMAIL}`);
}

seedAdmin()
  .catch((error) => {
    console.error("Failed to seed admin account:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
