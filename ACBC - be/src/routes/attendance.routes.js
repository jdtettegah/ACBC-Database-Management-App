const express = require('express');
const router = express.Router();

const {
  markAttendance,
  getAllAttendance,
  getAttendanceByMember,
  updateAttendance,
  markAttendanceBulk
} = require('../controllers/attendance.controller');

// CREATE
router.post('/', markAttendance);
router.post("/bulk", markAttendanceBulk);

// READ
router.get('/', getAllAttendance);
router.get('/member/:memberId', getAttendanceByMember);

// UPDATE
router.put("/:attendanceCode", updateAttendance);

module.exports = router;