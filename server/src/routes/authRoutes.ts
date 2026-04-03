import express from "express";
import {
  candidateSignup,
  recruiterSignup,
  login,
} from "../controllers/authController";

const router = express.Router();

router.post("/candidate-signup", candidateSignup);
router.post("/recruiter-signup", recruiterSignup);
router.post("/login", login);

export default router;
