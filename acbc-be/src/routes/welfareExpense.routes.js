import express from 'express';
const router = express.Router();

import welfareExpenseController from '../controllers/welfareExpense.controller.js';

/* TYPES */
router.post('/types', welfareExpenseController.createExpenseType);
router.get('/types', welfareExpenseController.getExpenseTypes);

/* 🔥 IMPORTANT: PUT THIS BEFORE /:id */
router.get('/summary/all', welfareExpenseController.getWelfareSummary);

/* EXPENSE */
router.post('/', welfareExpenseController.createExpense);
router.get('/', welfareExpenseController.getExpenses);
router.get('/:id', welfareExpenseController.getSingleExpense);

export default router;