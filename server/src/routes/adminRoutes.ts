import express from "express";
import {
  getAdminAccounts,
  updateAdminAccountStatus,
  deleteAdminAccount,
} from "../controllers/adminController";

const router = express.Router();

router.get("/accounts", getAdminAccounts);
router.patch("/accounts/:userId/status", updateAdminAccountStatus);
router.delete("/accounts/:userId", deleteAdminAccount);

export default router;
