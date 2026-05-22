import express from 'express';

const router = express.Router();

import authController from '../controllers/auth.controllers.js';

router.post('/login', authController.login);
router.post('/create-user', authController.createUser);

export default router;