const ReportMapping = require("../models/ReportMapping");
const mongoose = require("mongoose");

// helper to upsert mapping
async function upsertMapping(societyId, year, newMappings) {
    return await ReportMapping.findOneAndUpdate(
        { societyId, year },
        {
            $setOnInsert: { societyId, year },
            $set: Object.fromEntries(
                Object.entries(newMappings).map(([key, val]) => [
                    `mappings.${key}`,
                    val, // Now val is an object with reportType and totalAmount
                ])
            ),
        },
        { new: true, upsert: true }
    );
}

// 📌 Profit & Loss
exports.saveProfitLossMapping = async (req, res) => {
    try {
        const { year, mappings } = req.body;
        const { societyId } = req.params;

        if (!year || !mappings)
            return res.status(400).json({ error: "Year and mappings required" });

        const updated = await upsertMapping(societyId, year, mappings);

        res.json({ success: true, data: updated });
    } catch (err) {
        console.error("Error saving Profit & Loss mapping:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 📌 Balance Sheet
exports.saveBalanceSheetMapping = async (req, res) => {
    try {
        const { year, mappings } = req.body;
        const { societyId } = req.params;

        if (!year || !mappings)
            return res.status(400).json({ error: "Year and mappings required" });

        const updated = await upsertMapping(societyId, year, mappings);

        res.json({ success: true, data: updated });
    } catch (err) {
        console.error("Error saving Balance Sheet mapping:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 📌 Construction Statement
exports.saveConstructionMapping = async (req, res) => {
    try {
        const { year, mappings } = req.body;
        const { societyId } = req.params;

        if (!year || !mappings)
            return res.status(400).json({ error: "Year and mappings required" });

        const updated = await upsertMapping(societyId, year, mappings);

        res.json({ success: true, data: updated });
    } catch (err) {
        console.error("Error saving Construction mapping:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 📌 Get mappings (optional helper)
exports.getMappings = async (req, res) => {
    try {
        const { societyId } = req.params;
        const { year } = req.query;

        const mappings = await ReportMapping.findOne({ societyId, year });
        res.json({ success: true, data: mappings || {} });
    } catch (err) {
        console.error("Error fetching mappings:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 📌 Get Profit & Loss data using mappings
// Example: profitLossController.js
// 📌 Get Profit & Loss mappings only by societyId
exports.getProfitLoss = async (req, res) => {
  try {
    const { societyId } = req.params;

    const docs = await ReportMapping.find({
      societyId: new mongoose.Types.ObjectId(societyId),
    });

    if (!docs || docs.length === 0) {
      return res.json({ success: true, mappings: [] });
    }

    const profitLossMappings = [];

    docs.forEach((doc) => {
      const mappingsObj =
        doc.mappings instanceof Map
          ? Object.fromEntries(doc.mappings)
          : doc.mappings;

      for (const [accountHeadName, mapping] of Object.entries(mappingsObj)) {
        if (mapping && mapping.reportType === "profitLoss") {
          profitLossMappings.push({
            societyId: doc.societyId, // ✅ Add societyId
            accountHead: accountHeadName,
            amount: mapping.totalAmount || 0,
            side: mapping.side,
            year: doc.year,
          });
        }
      }
    });

    res.json({
      success: true,
      mappings: profitLossMappings,
    });
  } catch (err) {
    console.error("Error fetching Profit & Loss mappings:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getBalanceSheet = async (req, res) => {
  try {
    const { societyId } = req.params;

    const docs = await ReportMapping.find({
      societyId: new mongoose.Types.ObjectId(societyId),
    });

    if (!docs || docs.length === 0) {
      return res.json({ success: true, mappings: [] });
    }

    const profitLossMappings = [];

    docs.forEach((doc) => {
      const mappingsObj =
        doc.mappings instanceof Map
          ? Object.fromEntries(doc.mappings)
          : doc.mappings;

      for (const [accountHeadName, mapping] of Object.entries(mappingsObj)) {
        if (mapping && mapping.reportType === "balanceSheet") {
          profitLossMappings.push({
            societyId: doc.societyId, // ✅ Add societyId
            accountHead: accountHeadName,
            amount: mapping.totalAmount || 0,
            side: mapping.side,
            year: doc.year,
          });
        }
      }
    });

    res.json({
      success: true,
      mappings: profitLossMappings,
    });
  } catch (err) {
    console.error("Error fetching Profit & Loss mappings:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};