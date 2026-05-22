import express from "express";
import activityController from "../controllers/activity.controller.js";

const router = express.Router();

// Get recent activities
router.get("/", activityController.getActivities);

export default router;