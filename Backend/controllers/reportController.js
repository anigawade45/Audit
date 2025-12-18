const ReportMapping = require("../models/ReportMapping");
const AccountHead = require("../models/AccountHead");
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

// helper: compute debit/credit totals for a single head in a given FY
async function computeHeadTotalsForYear(societyId, year, accountHeadId) {
  const start = new Date(`${year}-04-01`);
  const end = new Date(`${year + 1}-03-31T23:59:59.999Z`);
  const CashBookEntry = require("../models/CashBookEntry");
  const entries = await CashBookEntry.find({
    societyId: new mongoose.Types.ObjectId(societyId),
    accountHead: new mongoose.Types.ObjectId(accountHeadId),
    date: { $gte: start, $lte: end },
  });
  let debit = 0;
  let credit = 0;
  for (const e of entries) {
    if (String(e.type).toLowerCase() === "debit") debit += Number(e.amount) || 0;
    else credit += Number(e.amount) || 0;
  }
  return { debit, credit };
}

// 📌 Profit & Loss
exports.saveProfitLossMapping = async (req, res) => {
  try {
        const { year, mappings, accountHeadId, reportType, side } = req.body;
        const { societyId } = req.params;

        if (!year) return res.status(400).json({ error: "Year required" });

        // single-edit mode
        if (accountHeadId) {
          if (!mongoose.Types.ObjectId.isValid(accountHeadId)) {
            return res.status(400).json({ error: "Invalid accountHeadId" });
          }
          if (reportType == null) {
            await ReportMapping.findOneAndUpdate(
              { societyId, year },
              { $unset: { [`mappings.${accountHeadId}:${String(side).toLowerCase()}`]: 1 } },
              { new: true }
            );
            return res.json({ success: true });
          }
          const { debit, credit } = await computeHeadTotalsForYear(societyId, year, accountHeadId);
          const totalAmount = (String(side).toLowerCase() === "debit") ? debit : credit;
          const compositeKey = `${accountHeadId}:${String(side).toLowerCase()}`;
          const updated = await upsertMapping(societyId, year, {
            [compositeKey]: { reportType: "profitLoss", side, totalAmount }
          });
          return res.json({ success: true, data: updated });
        }

        const filtered = Object.fromEntries(
          Object.entries(mappings || {}).filter(([k]) => {
            const [id, s] = String(k).split(":");
            return mongoose.Types.ObjectId.isValid(id) && (s === "debit" || s === "credit");
          })
        );
        const updated = await upsertMapping(societyId, year, filtered);

        res.json({ success: true, data: updated });
  } catch (err) {
        console.error("Error saving Profit & Loss mapping:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 📌 Balance Sheet
exports.saveBalanceSheetMapping = async (req, res) => {
  try {
        const { year, mappings, accountHeadId, reportType, side } = req.body;
        const { societyId } = req.params;

        if (!year) return res.status(400).json({ error: "Year required" });

        // single-edit mode
        if (accountHeadId) {
          if (!mongoose.Types.ObjectId.isValid(accountHeadId)) {
            return res.status(400).json({ error: "Invalid accountHeadId" });
          }
          if (reportType == null) {
            await ReportMapping.findOneAndUpdate(
              { societyId, year },
              { $unset: { [`mappings.${accountHeadId}:${String(side).toLowerCase()}`]: 1 } },
              { new: true }
            );
            return res.json({ success: true });
          }
          const existing = await ReportMapping.findOne({ societyId, year });
          const existingMap = existing?.mappings instanceof Map
            ? Object.fromEntries(existing.mappings)
            : existing?.mappings || {};
          const currentKey = `${accountHeadId}:${String(side).toLowerCase()}`;
          const oppositeKey = `${accountHeadId}:${String(side).toLowerCase() === "debit" ? "credit" : "debit"}`;
          const prevOpposite = existingMap[oppositeKey];
          if (prevOpposite && prevOpposite.reportType === "balanceSheet") {
            return res.status(400).json({
              error: "Opposite side already mapped to Balance Sheet. Remove mapping first."
            });
          }
          const { debit, credit } = await computeHeadTotalsForYear(societyId, year, accountHeadId);
          const totalAmount = (String(side).toLowerCase() === "debit") ? debit : credit;
          const updated = await upsertMapping(societyId, year, {
            [currentKey]: { reportType: "balanceSheet", side, totalAmount }
          });
          return res.json({ success: true, data: updated });
        }

        const filtered = Object.fromEntries(
          Object.entries(mappings || {}).filter(([k]) => {
            const [id, s] = String(k).split(":");
            return mongoose.Types.ObjectId.isValid(id) && (s === "debit" || s === "credit");
          })
        );
        const updated = await upsertMapping(societyId, year, filtered);

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

        const doc = await ReportMapping.findOne({ societyId, year });
        if (!doc) return res.json({ success: true, data: {} });

        const raw = doc.mappings instanceof Map
          ? Object.fromEntries(doc.mappings)
          : doc.mappings || {};

        // Backward-compatibility: upgrade non-composite keys on the fly for response only
        const upgraded = {};
        for (const [k, v] of Object.entries(raw)) {
          if (k.includes(":")) {
            upgraded[k] = v;
            continue;
          }
          const s = String(v?.side || "").toLowerCase();
          if (mongoose.Types.ObjectId.isValid(k) && (s === "debit" || s === "credit")) {
            upgraded[`${k}:${s}`] = v;
          }
        }

        res.json({ success: true, data: { ...doc.toObject(), mappings: upgraded } });
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

    // Collect all accountHeadIds used for profitLoss mappings
    const idsSet = new Set();
    const raw = [];
    docs.forEach((doc) => {
      const mappingsObj =
        doc.mappings instanceof Map
          ? Object.fromEntries(doc.mappings)
          : doc.mappings;

      for (const [key, mapping] of Object.entries(mappingsObj)) {
        const [accountHeadId, sideKey] = String(key).split(":");
        if (!mongoose.Types.ObjectId.isValid(accountHeadId)) continue;
        if (mapping && mapping.reportType === "profitLoss") {
          idsSet.add(accountHeadId);
          raw.push({
            doc,
            accountHeadId,
            amount: mapping.totalAmount || 0,
            side: sideKey || mapping.side,
            year: doc.year,
          });
        }
      }
    });

    // Resolve names by ID once
    const ids = Array.from(idsSet)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const heads = await AccountHead.find({ _id: { $in: ids } });
    const idToName = new Map(heads.map((h) => [String(h._id), h.name || ""]));

    const profitLossMappings = raw.map((r) => ({
      societyId: r.doc.societyId,
      accountHeadId: r.accountHeadId,
      accountHeadName: idToName.get(r.accountHeadId) || "",
      amount: r.amount,
      side: r.side,
      year: r.year,
    }));

    res.json({
      success: true,
      mappings: profitLossMappings,
    });
  } catch (err) {
    console.error("Error fetching Profit & Loss mappings:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove mapping by year + accountHeadId
exports.removeMapping = async (req, res) => {
  try {
    const { societyId } = req.params;
    const { year, accountHeadId, side } = req.body;
    if (!year) return res.status(400).json({ error: "Year required" });
    if (!mongoose.Types.ObjectId.isValid(accountHeadId)) {
      return res.status(400).json({ error: "Invalid accountHeadId" });
    }
    const s = String(side).toLowerCase();
    if (s !== "debit" && s !== "credit") {
      return res.status(400).json({ error: "Invalid side" });
    }
    await ReportMapping.findOneAndUpdate(
      { societyId, year },
      { $unset: { [`mappings.${accountHeadId}:${s}`]: 1 } },
      { new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error removing mapping:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Balance Sheet data derived per mapping with carry-forward
const CashBookEntry = require("../models/CashBookEntry");
exports.getBalanceSheet = async (req, res) => {
  try {
    const { societyId } = req.params;

    const docs = await ReportMapping.find({
      societyId: new mongoose.Types.ObjectId(societyId),
    });

    if (!docs || docs.length === 0) {
      return res.json({ success: true, mappings: [] });
    }

    // Helper: FY date range from starting year number
    function getFYRangeFromYear(startYearNumber) {
      const start = new Date(`${startYearNumber}-04-01`);
      const end = new Date(`${startYearNumber + 1}-03-31T23:59:59.999Z`);
      return { start, end };
    }

    const yearToMappings = new Map();
    const yearsSet = new Set();
    const idsSet = new Set();
    docs.forEach((doc) => {
      const year = doc.year;
      yearsSet.add(year);
      const mappingsObj =
        doc.mappings instanceof Map
          ? Object.fromEntries(doc.mappings)
          : doc.mappings;
      const onlyBS = Object.entries(mappingsObj).filter(([k, v]) => {
        const [id] = String(k).split(":");
        return mongoose.Types.ObjectId.isValid(id) && v && v.reportType === "balanceSheet";
      });
      if (onlyBS.length === 0) return;
      if (!yearToMappings.has(year)) yearToMappings.set(year, new Map());
      const m = yearToMappings.get(year);
      for (const [key, v] of onlyBS) {
        const [id, sideKey] = String(key).split(":");
        m.set(id, sideKey || v.side);
        idsSet.add(id);
      }
    });

    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);

    const tbTotalsByYear = new Map();
    for (const y of sortedYears) {
      const { start, end } = getFYRangeFromYear(y);
      const entries = await CashBookEntry.find({
        societyId: new mongoose.Types.ObjectId(societyId),
        date: { $gte: start, $lte: end },
      }).populate("accountHead");

      const totals = new Map();
      for (const e of entries) {
        const idStr = String(e.accountHead?._id || e.accountHead || "");
        if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) continue;
        if (!totals.has(idStr)) totals.set(idStr, { debit: 0, credit: 0 });
        const acc = totals.get(idStr);
        if (String(e.type).toLowerCase() === "debit") {
          acc.debit += Number(e.amount) || 0;
        } else {
          acc.credit += Number(e.amount) || 0;
        }
        totals.set(idStr, acc);
      }
      tbTotalsByYear.set(y, totals);
    }

    const ids = Array.from(idsSet).map((id) => new mongoose.Types.ObjectId(id));
    const heads = await AccountHead.find({ _id: { $in: ids } });
    const idToName = new Map(heads.map((h) => [String(h._id), h.name || ""]));

    const carryForward = new Map();
    const computed = [];

    for (const y of sortedYears) {
      const mappingsForYear = yearToMappings.get(y);
      if (!mappingsForYear) continue;
      const tbTotals = tbTotalsByYear.get(y) || new Map();

      for (const [idStr, side] of mappingsForYear.entries()) {
        const totals = tbTotals.get(idStr) || { debit: 0, credit: 0 };
        const prev = carryForward.get(idStr) || 0;
        let amount = 0;
        if (side === "credit") {
          amount = (totals.credit || 0) + prev - (totals.debit || 0);
        } else {
          amount = (totals.debit || 0) + prev - (totals.credit || 0);
        }
        computed.push({
          societyId,
          accountHeadId: idStr,
          accountHead: idToName.get(idStr) || "",
          amount,
          side,
          year: y,
        });
        carryForward.set(idStr, amount);
      }
    }

    res.json({
      success: true,
      mappings: computed,
    });
  } catch (err) {
    console.error("Error fetching Balance Sheet data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
