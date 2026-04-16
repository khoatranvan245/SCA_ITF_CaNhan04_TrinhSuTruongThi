import express from "express";
import { getCandidateCities, getCandidateProfile, updateCandidateProfile, } from "../controllers/candidateController";
const router = express.Router();
router.get("/cities", getCandidateCities);
router.get("/:userId", getCandidateProfile);
router.put("/:userId", updateCandidateProfile);
export default router;
