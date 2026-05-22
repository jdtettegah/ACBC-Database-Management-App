import express from 'express';
const router = express.Router();

import expenditureController from '../controllers/expenditure.controller.js';

router.post('/', expenditureController.addExpenditure);
router.get('/', expenditureController.getAllExpenditure);
router.get('/range', expenditureController.getExpenditureByDateRange);

export default router;