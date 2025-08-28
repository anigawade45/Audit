const express = require("express");
const router = express.Router();
const {
    getEntriesBySociety,
    getEntryById,
    addEntry,
    updateEntry,
    deleteEntry,
    batchDeleteEntries
} = require("../controllers/cashBookController");
const { requireAuth } = require("../middlewares/authMiddleware");

// POST new entry
router.post("/add/:societyId", requireAuth, addEntry);
// single entry first
router.get("/entry/:entryId", requireAuth, getEntryById);
// then entries by society
router.get("/:societyId", requireAuth, getEntriesBySociety);

router.put("/entry/:entryId", requireAuth, updateEntry);
// DELETE entry
router.delete("/entry/:entryId", requireAuth, deleteEntry);

// NEW: Batch delete entries
router.post("/batch-delete", requireAuth, batchDeleteEntries);

module.exports = router;
