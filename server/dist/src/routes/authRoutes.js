import express from "express";
import { candidateSignup, recruiterSignup, candidateLogin, recruiterLogin, adminLogin, } from "../controllers/authController";
const router = express.Router();
router.post("/candidate-signup", candidateSignup);
router.post("/recruiter-signup", recruiterSignup);
router.post("/candidate-login", candidateLogin);
router.post("/recruiter-login", recruiterLogin);
router.post("/admin-login", adminLogin);
export default router;
