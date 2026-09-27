import express from "express";

const router = express.Router();

import fundsController from "../controllers/funds.controller.js";

/*
 * ================= GET =================
 */

// All funds
router.get("/", fundsController.getAllFunds);

// Active funds only
router.get("/active", fundsController.getActiveFunds);

// Single fund by code
router.get("/:fundCode", fundsController.getFundByCode);


/*
 * ================= CREATE =================
 */

router.post("/", fundsController.createFund);


/*
 * ================= UPDATE =================
 */

router.put("/:fundCode", fundsController.updateFund);


/*
 * ================= ACTIVATE / DEACTIVATE =================
 */

router.patch(
  "/:fundCode/activate",
  fundsController.activateFund
);

router.patch(
  "/:fundCode/deactivate",
  fundsController.deactivateFund
);

export default router;