import express from 'express';
const router = express.Router();

import memberDeptController from "../controllers/memberDepartment.controller.js";

router.post("/", memberDeptController.assignMemberToDepartment);

router.get("/department/:deptId", memberDeptController.getMembersByDepartment);

router.get("/member/:member_id", memberDeptController.getDepartmentsByMember);

router.delete("/:id", memberDeptController.removeMemberFromDepartment);

router.put("/reassign", memberDeptController.reassignMember);

export default router;