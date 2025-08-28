const AccountHead = require("../models/AccountHead");

// 📌 GET all account heads by society
exports.getAccountHeads = async (req, res) => {
    try {
        const { id } = req.params; // societyId
        const heads = await AccountHead.find({ societyId: id }).sort({ createdAt: 1 });

        const debit = heads.filter(h => h.type.toLowerCase() === "debit").map(h => h.name);
        const credit = heads.filter(h => h.type.toLowerCase() === "credit").map(h => h.name);

        res.json({ debit, credit, heads });
    } catch (err) {
        console.error("Error fetching account heads:", err);
        res.status(500).json({ message: "Server error fetching account heads" });
    }
};

// 📌 POST new account head
exports.addAccountHead = async (req, res) => {
    try {
        const { id } = req.params; // societyId
        const { type, name, category, openingAmount } = req.body;

        if (!type || !name) {
            return res.status(400).json({ message: "Type and Name are required" });
        }

        // Prevent duplicates in same society
        const exists = await AccountHead.findOne({ societyId: id, type, name });
        if (exists) {
            return res.status(400).json({ message: "Account head already exists" });
        }

        const newHead = new AccountHead({
            societyId: id,
            type,
            name,
            category: category || "CashBook",
            openingAmount: openingAmount || 0,
        });

        await newHead.save();

        res.status(201).json({ message: "Account head added", head: newHead });
    } catch (err) {
        console.error("Error adding account head:", err);
        res.status(500).json({ message: "Server error adding account head" });
    }
};
