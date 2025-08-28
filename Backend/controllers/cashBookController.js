const CashBookEntry = require("../models/CashBookEntry");
const AccountHead = require("../models/AccountHead");
const Society = require("../models/Society");
const mongoose = require("mongoose");

// helper for FY range (same as earlier)
function getFYRange(fy) {
    const parts = fy.split("-");
    if (parts.length < 2) return null;
    const startYear = parseInt(parts[0], 10);
    return {
        start: new Date(`${startYear}-04-01`),
        end: new Date(`${startYear + 1}-03-31`),
    };
}

/**
 * Add a new entry in CashBook
 */
exports.addEntry = async (req, res) => {
    try {
        const { societyId } = req.params;
        const { date, type, accountHeadName, description, amount } = req.body;

        // Validate societyId is a valid ObjectId
        if (!societyId || societyId === 'undefined' || !mongoose.Types.ObjectId.isValid(societyId)) {
            return res.status(400).json({ success: false, message: "Invalid society ID" });
        }

        if (!date || !type || !accountHeadName || !amount) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        // Normalize type to ensure consistency
        const normalizedType = type.toLowerCase();
        if (normalizedType !== "debit" && normalizedType !== "credit") {
            return res.status(400).json({ success: false, message: "Type must be either 'debit' or 'credit'" });
        }

        // Validate amount is a positive number
        if (isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, message: "Amount must be a positive number" });
        }

        // Validate date format
        const entryDate = new Date(date);
        if (isNaN(entryDate.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid date format" });
        }

        // Convert societyId to ObjectId
        const societyObjectId = new mongoose.Types.ObjectId(societyId);

        // ✅ Fetch society info to validate financial year start
        const society = await Society.findById(societyObjectId);
        if (!society) {
            return res.status(404).json({ success: false, message: "Society not found" });
        }

        if (society.financialYearStart && entryDate < new Date(society.financialYearStart)) {
            return res.status(400).json({
                success: false,
                message: `Entry date cannot be before financial year start (${society.financialYearStart.toDateString()})`
            });
        }

        // ensure account head exists or create new
        let accountHead = await AccountHead.findOne({
            societyId: societyObjectId,
            name: accountHeadName,
        });

        if (!accountHead) {
            accountHead = await AccountHead.create({
                societyId,
                name: accountHeadName,
                type: normalizedType === "debit" ? "Debit" : "Credit",
                category: "CashBook",
            });
        }

        const entry = await CashBookEntry.create({
            societyId,
            date: entryDate,
            type: normalizedType === "debit" ? "Debit" : "Credit",
            accountHead: accountHead._id,
            description,
            amount: parseFloat(amount),
        });

        return res.status(201).json({ success: true, entry });
    } catch (err) {
        console.error("Add Entry Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// /**
//  * Get all entries for a society (filtered by FY)
//  */
// exports.getEntriesBySociety = async (req, res) => {
//     try {
//         const { societyId, fy } = req.params;
//         let query = { societyId: new mongoose.Types.ObjectId(societyId) };

//         if (!mongoose.Types.ObjectId.isValid(societyId)) {
//             return res.status(400).json({ success: false, message: "Invalid societyId" });
//         }


//         if (fy) {
//             const range = getFYRange(fy);
//             if (!range) return res.status(400).json({ success: false, message: "Invalid FY" });
//             query.date = { $gte: range.start, $lte: range.end };
//         }

//         const entries = await CashBookEntry.find(query)
//             .populate("accountHead")
//             .sort({ date: 1 });

//         return res.json({ success: true, entries });
//     } catch (err) {
//         console.error("Fetch Entries Error:", err);
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// };

/**
 * Get all entries for a society
 */
exports.getEntriesBySociety = async (req, res) => {
    try {
        const { societyId } = req.params;

        // validate ID
        if (!mongoose.Types.ObjectId.isValid(societyId)) {
            return res.status(400).json({ success: false, message: "Invalid societyId" });
        }

        // fetch all entries for the society
        const entries = await CashBookEntry.find({
            societyId: new mongoose.Types.ObjectId(societyId),
        })
            .populate("accountHead")
            .sort({ date: 1 });

        return res.json({ success: true, entries });
    } catch (err) {
        console.error("Fetch Entries Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Get single entry by ID
 */
exports.getEntryById = async (req, res) => {
    try {
        const { entryId } = req.params;
        const entry = await CashBookEntry.findById(entryId).populate("accountHead");
        if (!entry) return res.status(404).json({ success: false, message: "Not found" });

        return res.json({ success: true, entry });
    } catch (err) {
        console.error("Get Entry Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Update entry
 */
exports.updateEntry = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { date, type, accountHeadName, description, amount } = req.body;

        const entry = await CashBookEntry.findById(entryId);
        if (!entry) return res.status(404).json({ success: false, message: "Not found" });

        // update account head if changed
        if (accountHeadName) {
            let accountHead = await AccountHead.findOne({
                societyId: entry.societyId,
                name: accountHeadName,
            });
            if (!accountHead) {
                accountHead = await AccountHead.create({
                    societyId: entry.societyId,
                    name: accountHeadName,
                    type: type === "Debit" ? "Debit" : "Credit",
                    category: "CashBook",
                });
            }
            entry.accountHead = accountHead._id;
        }

        if (date) entry.date = date;
        if (type) entry.type = type === "debit" ? "Debit" : "Credit";
        if (description) entry.description = description;
        if (amount) entry.amount = amount;

        await entry.save();

        return res.json({ success: true, entry });
    } catch (err) {
        console.error("Update Entry Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Delete entry
 */
exports.deleteEntry = async (req, res) => {
    try {
        const { entryId } = req.params;
        const deleted = await CashBookEntry.findByIdAndDelete(entryId);
        if (!deleted) return res.status(404).json({ success: false, message: "Not found" });

        return res.json({ success: true, message: "Deleted successfully" });
    } catch (err) {
        console.error("Delete Entry Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Batch delete multiple entries
 */
exports.batchDeleteEntries = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide an array of entry IDs"
            });
        }

        // Validate all IDs are valid ObjectIds
        const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));

        if (validIds.length !== ids.length) {
            return res.status(400).json({
                success: false,
                message: "Some IDs are invalid"
            });
        }

        // Convert to ObjectIds
        const objectIds = validIds.map(id => new mongoose.Types.ObjectId(id));

        // Perform batch deletion
        const result = await CashBookEntry.deleteMany({ _id: { $in: objectIds } });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "No entries found to delete"
            });
        }

        return res.json({
            success: true,
            message: `${result.deletedCount} entries deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error("Batch Delete Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
