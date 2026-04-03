import express, { Request, Response } from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/authRoutes";
import companyRoutes from "./routes/companyRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  res.send("Server with TypeScript 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/company-profile", companyRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
