const express = require('express');
const router = express.Router();

const {
  createEvent,
  recordBulkPayment,
  getEvents,
  getEventMembersFull,
  recordSinglePayment,
  getMemberFullHistory
} = require('../controllers/welfare.controller');

/* EVENTS */
router.post('/events', createEvent);
router.get('/events', getEvents);
router.get('/events/:eventId/members/full', getEventMembersFull);

/* PAYMENTS */ 
router.post('/bulk', recordBulkPayment); // ✅ FIXED
router.post('/pay', recordSinglePayment);
router.get('/history/:event_member_id', getMemberFullHistory);

module.exports = router;