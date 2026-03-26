const express = require('express');
const router = express.Router();
const {
  addIncome,
  getAllIncome,
  getIncomeByDateRange
} = require('../controllers/income.controller');

router.post('/', addIncome);
router.get('/', getAllIncome);
router.get('/range', getIncomeByDateRange);

module.exports = router;
