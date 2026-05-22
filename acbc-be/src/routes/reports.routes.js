import express from 'express';
const router = express.Router();

import reportsController from '../controllers/reports.controller.js';

router.get('/', reportsController.getAllReports);

router.get('/finance/monthly', reportsController.monthlyFinanceReport);
router.get('/tithes/summary', reportsController.titheSummary);
router.get('/attendance/summary', reportsController.attendanceSummary);
router.post('/save', reportsController.saveReport);

router.get('/attendance/weekly', reportsController.weeklyAttendanceChart);
router.get('/finance/weekly', reportsController.weeklyFinanceChart);

router.get('/welfare', reportsController.welfareReport);

export default router;