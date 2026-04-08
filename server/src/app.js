import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import companyRoutes from "./routes/companyRoutes";
import jobRoutes from "./routes/jobRoutes";
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.get("/", async (req, res) => {
    res.send("Server with TypeScript 🚀");
});
app.use("/api/auth", authRoutes);
app.use("/api/company-profile", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
