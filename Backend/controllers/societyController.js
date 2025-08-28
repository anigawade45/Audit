const Society = require("../models/Society");
const User = require("../models/User");
const mongoose = require("mongoose");

// 📌 Create Society
const createSociety = async (req, res) => {
    try {
        const {
            name,
            secretaryName,
            taluka,
            district,
            address,
            type,
            initialBalance,
            financialYearStart,
            financialYearEnd,
        } = req.body;

        if (!name || !secretaryName || !type || !financialYearStart || !financialYearEnd) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        // Calculate currentYear from start & end dates
        const startYear = new Date(financialYearStart).getFullYear();
        const endYear = new Date(financialYearEnd).getFullYear();
        const currentYear = `${startYear}-${endYear}`;

        const society = new Society({
            name,
            secretaryName,
            taluka,
            district,
            address,
            type,
            initialBalance: initialBalance || 0,
            financialYearStart,
            financialYearEnd,
            currentYear,
            accountant: req.user._id, // from requireAuth middleware
        });

        await society.save();

        // Push society to user
        await User.findByIdAndUpdate(
            req.user._id,
            { $push: { societies: society._id } },
            { new: true }
        );

        res.status(201).json({ message: "Society created successfully", society });
    } catch (error) {
        console.error("Error creating society:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAllSocieties = async (req, res) => {
    try {
        const societies = await Society.find({ accountant: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: societies.length,
            societies
        });
    } catch (error) {
        console.error("Error fetching societies:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching societies",
            error: error.message
        });
    }
};

// 📌 Get Single Society by ID
const getSocietyById = async (req, res) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid Society ID format" });
        }

        const society = await Society.findOne({
            _id: req.params.id,
            accountant: req.user._id
        }).lean();

        if (!society) {
            return res.status(404).json({ success: false, message: "Society not found" });
        }

        res.status(200).json({ success: true, society });
    } catch (error) {
        console.error("Error fetching society:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching society",
            error: error.message
        });
    }
};

// 📌 Update Society (only allowed fields)
const updateSociety = async (req, res) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid Society ID format" });
        }

        // Allowed fields to update
        const allowedFields = [
            "name",
            "secretaryName",
            "taluka",
            "district",
            "address",
            "type",
            "initialBalance",
            "financialYearStart",
            "financialYearEnd"
        ];

        const updates = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        // If updating financial year, also update currentYear
        if (updates.financialYearStart && updates.financialYearEnd) {
            const startYear = new Date(updates.financialYearStart).getFullYear();
            const endYear = new Date(updates.financialYearEnd).getFullYear();
            updates.currentYear = `${startYear}-${endYear}`;
        }

        const society = await Society.findOneAndUpdate(
            { _id: req.params.id, accountant: req.user._id },
            updates,
            { new: true, runValidators: true }
        );

        if (!society) {
            return res.status(404).json({ success: false, message: "Society not found" });
        }

        res.status(200).json({
            success: true,
            message: "Society updated successfully",
            society
        });
    } catch (error) {
        console.error("Error updating society:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating society",
            error: error.message
        });
    }
};

module.exports = {
    createSociety,
    getAllSocieties,
    getSocietyById,
    updateSociety,
};
