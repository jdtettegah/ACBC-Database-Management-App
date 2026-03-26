const express = require('express');
const router = express.Router();
const {
  addExpenditure,
  getAllExpenditure,
  getExpenditureByDateRange
} = require('../controllers/expenditure.controller');

router.post('/', addExpenditure);
router.get('/', getAllExpenditure);
router.get('/range', getExpenditureByDateRange);

module.exports = router;
