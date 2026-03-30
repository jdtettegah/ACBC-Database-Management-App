const express = require('express');
const router = express.Router();

const {
  createEvent,
  recordPayment,
  getEvents,
  getEventMembersFull
} = require('../controllers/welfare.controller');

/* EVENTS */
router.post('/events', createEvent);
router.get('/events', getEvents);
router.get('/events/:eventId/members/full', getEventMembersFull);

/* PAYMENTS */
router.post('/pay', recordPayment); // ✅ THIS FIXES YOUR ERROR

module.exports = router;