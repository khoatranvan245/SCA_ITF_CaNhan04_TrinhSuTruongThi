import express from "express";
import {
  getCategories,
  getCities,
  getPublicCompanyById,
  getCompanyProfile,
  getPublicCompanies,
  updateCompanyProfile,
} from "../controllers/companyController";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/cities", getCities);
router.get("/listing", getPublicCompanies);
router.get("/detail/:companyId", getPublicCompanyById);
router.get("/:userId", getCompanyProfile);
router.put("/:userId", updateCompanyProfile);

export default router;
