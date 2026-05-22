import express from 'express';
import titheController from '../controllers/tithe.controller.js';

const router = express.Router();

router.post('/', titheController.addTithe);
router.get('/', titheController.getAllTithes);
router.get('/member/:memberId', titheController.getTithesByMember);
router.post('/bulk', titheController.addBulkTithes);

export default router;