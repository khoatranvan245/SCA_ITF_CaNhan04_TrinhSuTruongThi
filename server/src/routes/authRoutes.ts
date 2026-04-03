import express from "express";
import {
  candidateSignup,
  recruiterSignup,
} from "../controllers/authController";

const router = express.Router();

router.post("/candidate-signup", candidateSignup);
router.post("/recruiter-signup", recruiterSignup);

export default router;
