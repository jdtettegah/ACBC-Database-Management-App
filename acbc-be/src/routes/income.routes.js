import express from 'express';

const router = express.Router();

import incomeController from '../controllers/income.controller.js';

router.post('/', incomeController.addIncome);

router.get('/', incomeController.getAllIncome);

/*
 * ================= FUND =================
 */

// Get income for a specific fund
router.get(
  '/fund/:fundCode',
  incomeController.getIncomeByFund
);

// Get income for a specific fund within a date range
router.get(
  '/fund/:fundCode/range',
  incomeController.getIncomeByFundAndDateRange
);

/*
 * ================= DATE RANGE =================
 */

router.get(
  '/range',
  incomeController.getIncomeByDateRange
);

/*
 * ================= UPDATE / DELETE =================
 */

router.put('/:id', incomeController.updateIncome);

router.delete('/:id', incomeController.deleteIncome);

export default router;