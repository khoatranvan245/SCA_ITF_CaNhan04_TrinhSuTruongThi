import express from "express";
import {
  getCategories,
  getCompanyProfile,
  updateCompanyProfile,
} from "../controllers/companyController";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/:userId", getCompanyProfile);
router.put("/:userId", updateCompanyProfile);

export default router;
