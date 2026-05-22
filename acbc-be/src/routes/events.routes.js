import express from "express";
const router = express.Router();

import eventController from "../controllers/events.controller.js";

// Create event
router.post("/", eventController.createEvent);

// Get events
router.get("/", eventController.getEvents);

// Delete event
router.delete("/:id", eventController.deleteEvent);

export default router;