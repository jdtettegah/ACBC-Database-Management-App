const express = require('express');
const router = express.Router();
const membersController = require('../controllers/members.controller');
const auth = require('../middlewares/auth.middleware');
const {
    getDepartmentsByMember,
  } = require("../controllers/memberDepartment.controller");
  
router.get("/:id/departments", getDepartmentsByMember);
router.post('/', auth, membersController.createMember);
router.get('/', auth, membersController.getMembers);
router.get('/:id', auth, membersController.getMemberById);
router.put('/:id', auth, membersController.updateMember);
router.delete('/:id', auth, membersController.deleteMember);

module.exports = router;
