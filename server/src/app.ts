import express, { Request, Response } from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/authRoutes";
import companyRoutes from "./routes/companyRoutes";
import jobRoutes from "./routes/jobRoutes";
import candidateRoutes from "./routes/candidateRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  res.send("Server with TypeScript 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/company-profile", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidate-profile", candidateRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
