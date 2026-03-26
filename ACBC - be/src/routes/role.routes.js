const express = require('express');
const router = express.Router();

const {
  createRole,
  getRoles
} = require('../controllers/role.controller');

router.post('/', createRole);
router.get('/', getRoles);

module.exports = router;
