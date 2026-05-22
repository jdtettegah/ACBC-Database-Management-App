import express from 'express';
const router = express.Router();

import visitorsAttendanceController from '../controllers/visitorsAttendance.controller.js';


// CREATE VISITOR
router.post("/", visitorsAttendanceController.markVisitorAttendance);

// REPORT ONLY
router.get("/report", visitorsAttendanceController.getVisitorsReport);

export default router;