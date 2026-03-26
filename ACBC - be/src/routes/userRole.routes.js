const express = require("express");
const router = express.Router();

const {
  assignRoleToUser,
  getRolesByUser,
  getApprovers
} = require("../controllers/userRole.controller");


/* ================= APPROVERS ================= */

// Must come FIRST
router.get("/approvers", getApprovers);


/* ================= USER ROLES ================= */

router.get("/:userId/roles", getRolesByUser);


/* ================= ASSIGN ROLE ================= */

router.post("/assign-role", assignRoleToUser);


module.exports = router;