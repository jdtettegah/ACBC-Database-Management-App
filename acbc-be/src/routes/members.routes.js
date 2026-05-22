import express from 'express';
import membersController from '../controllers/members.controller.js';
import memberDeptController from '../controllers/memberDepartment.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// Member departments
router.get("/:id/departments", memberDeptController.getDepartmentsByMember);

// Members
router.post('/', auth, membersController.createMember);
router.get('/', auth, membersController.getMembers);
router.get('/:id', auth, membersController.getMemberById);
router.put('/:id', auth, membersController.updateMember);
router.delete('/:id', auth, membersController.deleteMember);

export default router;