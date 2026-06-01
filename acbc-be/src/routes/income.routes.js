import express from 'express';
const router = express.Router();

import incomeController from '../controllers/income.controller.js';

router.post('/', incomeController.addIncome);
router.get('/', incomeController.getAllIncome);
router.get('/range', incomeController.getIncomeByDateRange);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

export default router;