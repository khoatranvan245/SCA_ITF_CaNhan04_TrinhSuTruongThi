import express from "express";
import {
  deleteCandidateResume,
  getCandidateCities,
  getCandidateApplications,
  getCandidateProfile,
  uploadCandidateResume,
  updateCandidateProfile,
} from "../controllers/candidateController";
import { upload } from "../middleware/upload";

const router = express.Router();

router.get("/cities", getCandidateCities);
router.get("/:userId/applications", getCandidateApplications);
router.post("/:userId/resume", upload.single("cv"), uploadCandidateResume);
router.delete("/:userId/resume/:resumeId", deleteCandidateResume);
router.get("/:userId", getCandidateProfile);
router.put("/:userId", updateCandidateProfile);

export default router;
