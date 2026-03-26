const express = require("express");
const router = express.Router();

const {
  assignMemberToDepartment,
  getMembersByDepartment,
  removeMemberFromDepartment,
  reassignMember
} = require("../controllers/memberDepartment.controller");


router.post("/", assignMemberToDepartment);

router.get("/department/:deptId", getMembersByDepartment);

router.delete("/:id", removeMemberFromDepartment);

router.put("/reassign", reassignMember);


module.exports = router;
