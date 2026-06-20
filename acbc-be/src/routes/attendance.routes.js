import express from "express";
import attendanceController from "../controllers/attendance.controller.js";

const router = express.Router();

/* ================= CREATE ================= */
router.post("/", attendanceController.markAttendance);
router.post("/bulk", attendanceController.markAttendanceBulk);

/* ================= READ ================= */
router.get("/", attendanceController.getAllAttendance);
router.get("/member/:memberId", attendanceController.getAttendanceByMember);
router.get("/stats", attendanceController.getAttendanceStats);

/* ================= UPDATE ================= */
router.put("/:attendanceCode", attendanceController.updateAttendance);

export default router;