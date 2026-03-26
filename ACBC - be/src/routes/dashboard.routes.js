const express = require('express');
const router = express.Router();

const { getTodaySummary} = require("../controllers/dashboard.controller");
router.get("/today-summary", getTodaySummary);

module.exports = router;
