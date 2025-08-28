const express = require("express");
const router = express.Router();

const trialBalanceCtrl = require("../controllers/trialBalanceController");
const reportController = require("../controllers/reportController");
const {requireAuth} = require("../middlewares/authMiddleware");

// Protected routes
router.post("/profit-loss/:societyId", requireAuth, reportController.saveProfitLossMapping);
router.post("/balance-sheet/:societyId", requireAuth, reportController.saveBalanceSheetMapping);
router.post("/construction/:societyId", requireAuth, reportController.saveConstructionMapping);
router.get("/mappings/:societyId", requireAuth, reportController.getMappings);
router.get("/profit-loss-data/:societyId", requireAuth, reportController.getProfitLoss);
router.get("/balance-sheet-data/:societyId", requireAuth, reportController.getBalanceSheet);

router.get("/trial-balance/:societyId", requireAuth, trialBalanceCtrl.getTrialBalance);
router.get("/trial-balance/years/:societyId", requireAuth, trialBalanceCtrl.getAvailableYears);

module.exports = router;