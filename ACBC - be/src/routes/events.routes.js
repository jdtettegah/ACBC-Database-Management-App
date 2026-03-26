const express = require("express");
const router = express.Router();

const {
  createEvent,
  getEvents,
  deleteEvent
} = require("../controllers/events.controller");

// Create event
router.post("/", createEvent);

// Get events
router.get("/", getEvents);

// Delete event
router.delete("/:id", deleteEvent);

module.exports = router;