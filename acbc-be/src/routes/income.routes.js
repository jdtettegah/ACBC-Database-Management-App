import express from 'express';
const router = express.Router();

import incomeController from '../controllers/income.controller.js';

router.post('/', incomeController.addIncome);
router.get('/', incomeController.getAllIncome);
router.get('/range', incomeController.getIncomeByDateRange);

export default router;