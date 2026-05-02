const express = require('express');
const router = express.Router();

const {
  monthlyFinanceReport,
  titheSummary,
  attendanceSummary,
  getAllReports,
  saveReport,
  weeklyAttendanceChart,
  weeklyFinanceChart,
  welfareReport
} = require('../controllers/reports.controller');

// MAIN LIST ROUTE (VERY IMPORTANT)
router.get('/', getAllReports);

router.get('/finance/monthly', monthlyFinanceReport);
router.get('/tithes/summary', titheSummary);
router.get('/attendance/summary', attendanceSummary);
router.post("/save", saveReport);
router.get("/attendance/weekly", weeklyAttendanceChart);
router.get("/finance/weekly", weeklyFinanceChart);
router.get('/welfare', welfareReport);


module.exports = router;