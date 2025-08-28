const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/authMiddleware");
const {
    createSociety,
    getAllSocieties,
    getSocietyById,
    updateSociety,
} = require("../controllers/societyController");

// Society Routes
router.post("/create-society", requireAuth, createSociety);
router.get("/allSocieties", requireAuth, getAllSocieties);
router.get("/:id", requireAuth, getSocietyById);
router.put("/:id", requireAuth, updateSociety);

module.exports = router;
