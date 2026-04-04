import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
const connectionString = `${process.env.DATABASE_URL}`;
console.log("Connecting to database...");
console.log("Connection string:", connectionString ? "✓ Set" : "✗ Not set");
const adapter = new PrismaPg({
    connectionString,
    ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });
// Test connection
prisma
    .$connect()
    .then(() => {
    console.log("✓ Database connection successful");
})
    .catch((err) => {
    console.error("✗ Database connection failed:", err.message);
});
export { prisma };
