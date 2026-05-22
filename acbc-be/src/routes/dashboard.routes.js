import express from 'express';

const router = express.Router();

import getTodaySummary from "../controllers/dashboard.controller.js";

router.get("/today-summary", getTodaySummary);

export default router;