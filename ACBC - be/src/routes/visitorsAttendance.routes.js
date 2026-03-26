const express = require("express");
const router = express.Router();

const {
  markVisitorAttendance,
  getAllVisitors,
  getVisitorsByDate,
  getVisitorsReport
} = require("../controllers/visitorsAttendance.controller");

router.post("/", markVisitorAttendance);
router.get("/", getAllVisitors);
router.get("/date/:visit_date", getVisitorsByDate);
router.get("/report", getVisitorsReport);

module.exports = router;