import express from "express";
import { deleteCandidateResume, getCandidateCities, getCandidateApplications, getCandidateProfile, uploadCandidateAvatar, uploadCandidateResume, updateCandidateProfile, } from "../controllers/candidateController";
import { getCandidateNotifications, markNotificationAsRead, deleteNotification, markAllNotificationsAsRead, } from "../controllers/notificationController";
import { upload } from "../middleware/upload";
const router = express.Router();
router.get("/cities", getCandidateCities);
router.get("/:userId/applications", getCandidateApplications);
router.post("/:userId/avatar", upload.single("avatar"), uploadCandidateAvatar);
router.post("/:userId/resume", upload.single("cv"), uploadCandidateResume);
router.delete("/:userId/resume/:resumeId", deleteCandidateResume);
router.get("/:userId", getCandidateProfile);
router.put("/:userId", updateCandidateProfile);
// Notification routes
router.get("/:userId/notifications", getCandidateNotifications);
router.patch("/:userId/notifications/read-all", markAllNotificationsAsRead);
router.patch("/:userId/notifications/:notificationId/read", markNotificationAsRead);
router.delete("/:userId/notifications/:notificationId", deleteNotification);
export default router;
