import express from "express";
import { getRecruiterJobs } from "../controllers/jobController";

const router = express.Router();

router.get("/recruiter/:userId", getRecruiterJobs);

export default router;
