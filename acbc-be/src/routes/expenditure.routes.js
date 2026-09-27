import express from 'express';

const router = express.Router();

import expenditureController from '../controllers/expenditure.controller.js';

router.post('/', expenditureController.addExpenditure);

router.get('/', expenditureController.getAllExpenditure);

/*
 * ================= FUND =================
 */

// Get expenditure for a specific fund
router.get(
  '/fund/:fundCode',
  expenditureController.getExpenditureByFund
);

// Get expenditure for a specific fund within a date range
router.get(
  '/fund/:fundCode/range',
  expenditureController.getExpenditureByFundAndDateRange
);

/*
 * ================= DATE RANGE =================
 */

router.get(
  '/range',
  expenditureController.getExpenditureByDateRange
);

/*
 * ================= UPDATE / DELETE =================
 */

router.put('/:id', expenditureController.updateExpenditure);

router.delete('/:id', expenditureController.deleteExpenditure);

export default router;