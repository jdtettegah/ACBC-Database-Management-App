const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllers');

router.post('/login', authController.login);
router.post('/create-user', authController.createUser);

module.exports = router;
