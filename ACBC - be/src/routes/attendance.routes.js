const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAllAttendance,
  getAttendanceByMember,
  updateAttendance,
  markAttendanceBulk
} = require('../controllers/attendance.controller');

router.post('/', markAttendance);
router.get('/', getAllAttendance);
router.put("/:attendanceCode", updateAttendance);
router.get('/member/:memberId', getAttendanceByMember);
router.post("/bulk", markAttendanceBulk);
module.exports = router;
