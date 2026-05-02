const express = require('express');
const router = express.Router();

const {
  createExpenseType,
  getExpenseTypes,
  createExpense,
  getExpenses,
  getSingleExpense,
  getWelfareSummary
} = require('../controllers/welfareExpense.controller');

/* TYPES */
router.post('/types', createExpenseType);
router.get('/types', getExpenseTypes);

/* 🔥 IMPORTANT: PUT THIS BEFORE /:id */
router.get('/summary/all', getWelfareSummary);

/* EXPENSE */
router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/:id', getSingleExpense);

module.exports = router;