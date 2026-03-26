const express = require("express");
const router = express.Router();

const { getActivities } = require("../controllers/activity.controller");

// Get recent activities
router.get("/", getActivities);

module.exports = router;