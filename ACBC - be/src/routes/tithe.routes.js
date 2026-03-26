const express = require('express');
const router = express.Router();
const {
  addTithe,
  getAllTithes,
  getTithesByMember,
  addBulkTithes,
} = require('../controllers/tithe.controller');

router.post('/', addTithe);
router.get('/', getAllTithes);
router.get('/member/:memberId', getTithesByMember);
router.post('/bulk', addBulkTithes);

module.exports = router;
