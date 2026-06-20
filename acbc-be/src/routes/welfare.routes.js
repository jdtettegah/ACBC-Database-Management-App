import express from 'express';
const router = express.Router();

import welfareController from '../controllers/welfare.controller.js';


/* EVENTS */
router.post('/events', welfareController.createEvent);
router.get('/events', welfareController.getEvents);
router.get('/events/:eventId/members/full', welfareController.getEventMembersFull);

/* PAYMENTS */ 
router.post('/bulk', welfareController.recordBulkPayment); // ✅ FIXED
router.post('/pay', welfareController.recordSinglePayment);
router.get('/history/:event_member_id', welfareController.getMemberFullHistory);

/* DAY BORN SPLIT */
router.post('/dayborn-split', welfareController.addDayBornSplit);

router.get("/income-ledger", welfareController.getIncomeLedger);
  
router.get("/expense-ledger", welfareController.getExpenseLedger);

export default router;