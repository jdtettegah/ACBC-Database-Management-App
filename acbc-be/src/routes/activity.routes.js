import { getActivities } from "../controllers/activity.controller.js";
import express from "express";


const router = express.Router();

router.get("/", getActivities);

export default router;