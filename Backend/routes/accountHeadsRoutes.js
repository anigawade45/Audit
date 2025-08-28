const express = require("express");
const router = express.Router();
const { getAccountHeads, addAccountHead } = require("../controllers/accountHeadController");
const { requireAuth } = require("../middlewares/authMiddleware");

// 📌 GET account heads for a society
router.get("/:id", requireAuth, getAccountHeads);

// 📌 POST new account head for a society
router.post("/:id", requireAuth, addAccountHead);

module.exports = router;
