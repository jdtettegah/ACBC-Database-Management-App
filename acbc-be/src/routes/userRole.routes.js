import express from 'express';
const router = express.Router();
import userRoleController from '../controllers/userRole.controller.js';




/* ================= APPROVERS ================= */

// Must come FIRST
router.get("/approvers", userRoleController.getApprovers);


/* ================= USER ROLES ================= */

router.get("/:userId/roles", userRoleController.getRolesByUser);


/* ================= ASSIGN ROLE ================= */

router.post("/assign-role", userRoleController.assignRoleToUser);


export default router;