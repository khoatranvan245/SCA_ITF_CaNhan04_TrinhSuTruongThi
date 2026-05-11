import express from "express";
import {
  getAdminAccounts,
  updateAdminAccountStatus,
  deleteAdminAccount,
  getAdminCompanies,
  getAdminStatistics,
} from "../controllers/adminController";

const router = express.Router();

router.get("/accounts", getAdminAccounts);
router.patch("/accounts/:userId/status", updateAdminAccountStatus);
router.delete("/accounts/:userId", deleteAdminAccount);
router.get("/companies", getAdminCompanies);
router.get("/statistics", getAdminStatistics);

export default router;
