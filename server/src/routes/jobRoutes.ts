import express from "express";
import { upload } from "../middleware/upload";
import { applyToJob } from "../controllers/jobController";
import { getCandidateApplyStatus } from "../controllers/jobController";
import { getJobApplications } from "../controllers/jobController";
import { getRecruiterApplications } from "../controllers/jobController";
import { getPublicJobs } from "../controllers/jobController";
import { getPublicJobById } from "../controllers/jobController";
import { getCategories } from "../controllers/jobController";
import { getRecruiterJobs } from "../controllers/jobController";
import { createRecruiterJob } from "../controllers/jobController";
import { searchSkills } from "../controllers/jobController";
import { deleteRecruiterJob } from "../controllers/jobController";
import { getRecruiterJobById } from "../controllers/jobController";
import { updateRecruiterJob } from "../controllers/jobController";
import { markApplicationAsReviewing } from "../controllers/jobController";
import { updateApplicationDecision } from "../controllers/jobController";
import { getApplicationResumeDownloadUrl } from "../controllers/jobController";
import { getAdminJobs } from "../controllers/jobController";
import { updateAdminJobStatus } from "../controllers/jobController";
import { deleteAdminJob } from "../controllers/jobController";

const router = express.Router();

router.get("/", getPublicJobs);
router.get("/categories", getCategories);
router.get("/skills", searchSkills);
router.post("/:jobId/apply", upload.single("cv"), applyToJob);
router.get("/:jobId/apply-status/:userId", getCandidateApplyStatus);
router.get("/:jobId/applications", getJobApplications);
router.get(
  "/:jobId/applications/:applicationId/resume/download-url",
  getApplicationResumeDownloadUrl,
);
router.get("/admin/jobs", getAdminJobs);
router.patch("/admin/:jobId/status", updateAdminJobStatus);
router.delete("/admin/:jobId", deleteAdminJob);
router.get("/recruiter/:userId/applications", getRecruiterApplications);
router.patch(
  "/recruiter/:userId/jobs/:jobId/applications/:applicationId/reviewing",
  markApplicationAsReviewing,
);
router.patch(
  "/recruiter/:userId/jobs/:jobId/applications/:applicationId/status",
  updateApplicationDecision,
);
router.get("/:jobId", getPublicJobById);
router.get("/recruiter/:userId", getRecruiterJobs);
router.post("/recruiter/:userId", createRecruiterJob);
router.get("/recruiter/:userId/:jobId", getRecruiterJobById);
router.put("/recruiter/:userId/:jobId", updateRecruiterJob);
router.delete("/recruiter/:userId/:jobId", deleteRecruiterJob);

export default router;
