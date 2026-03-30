const express = require("express");
const router = express.Router();

const {
  markVisitorAttendance,
  getVisitorsReport
} = require("../controllers/visitorsAttendance.controller");

// CREATE VISITOR
router.post("/", markVisitorAttendance);

// REPORT ONLY
router.get("/report", getVisitorsReport);

module.exports = router;