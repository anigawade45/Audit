const CashBookEntry = require("../models/CashBookEntry");
const AccountHead = require("../models/AccountHead");
const Society = require("../models/Society");
const ReportMapping = require("../models/ReportMapping");

// Get Trial Balance (Year-wise)
exports.getTrialBalance = async (req, res) => {
    try {
        const { societyId } = req.params;
        const { year } = req.query; // frontend will send year filter like "2024"

        // 1️⃣ Calculate financial year range
        let startDate, endDate, startYear;
        startYear = Number(year);
        if (!year || Number.isNaN(startYear)) {
            return res.status(400).json({ error: "Invalid year" });
        }
        startDate = new Date(`${startYear}-04-01`);
        endDate = new Date(`${startYear + 1}-03-31T23:59:59.999Z`);

        // 🔹 Society info (source of truth for initial balance)
        const society = await Society.findById(societyId);
        const initialOpening = Number(society?.initialBalance || 0);

        // Helper to get FY start year from a Date
        const fyStartYearFromDate = (d) => {
            const dt = new Date(d);
            return dt.getMonth() >= 3 ? dt.getFullYear() : dt.getFullYear() - 1;
        };

        // Determine first FY start year based on earliest cashbook entry or society's financialYearStart/createdAt
        let firstStartYear = startYear;
        const earliestEntry = await CashBookEntry.find({ societyId }).sort({ date: 1 }).limit(1);
        if (earliestEntry && earliestEntry.length > 0) {
            firstStartYear = fyStartYearFromDate(earliestEntry[0].date);
        } else if (society?.financialYearStart) {
            firstStartYear = fyStartYearFromDate(society.financialYearStart);
        } else if (society?.createdAt) {
            firstStartYear = fyStartYearFromDate(society.createdAt);
        }

        // 2️⃣ Default opening balance = society.initialBalance for first FY; otherwise carry forward from previous years
        let armbhiShillak = initialOpening;

        // If selected year is after the first FY, compute opening as initial + net of all previous FY entries
        if (startYear != null && firstStartYear != null && startYear > firstStartYear) {
            const prevStart = new Date(`${firstStartYear}-04-01`);
            const prevEnd = new Date(`${startYear}-03-31T23:59:59.999Z`);
            const prevEntries = await CashBookEntry.find({
                societyId,
                date: { $gte: prevStart, $lte: prevEnd },
            });
            let netPrev = 0;
            for (const entry of prevEntries) {
                if (String(entry.type).toLowerCase() === "debit") netPrev += Number(entry.amount) || 0;
                else netPrev -= Number(entry.amount) || 0;
            }
            armbhiShillak = initialOpening + netPrev;
        }

        // 4️⃣ Fetch all entries within current year
        const matchStage = { societyId, date: { $gte: startDate, $lte: endDate } };
        const entries = await CashBookEntry.find(matchStage).populate("accountHead");

        // Group by accountHead and calculate balances
        const grouped = {};
        let totalDebit = 0;
        let totalCredit = 0;

        for (const entry of entries) {
            const headId = String(entry.accountHead?._id || entry.accountHead || "");
            if (!headId) continue;
            if (!grouped[headId]) {
                grouped[headId] = {
                    accountHeadId: headId,
                    accountHeadName: entry.accountHead?.name || "",
                    debit: 0,
                    credit: 0,
                };
            }
            if (String(entry.type).toLowerCase() === "debit") {
                grouped[headId].debit += Number(entry.amount) || 0;
                totalDebit += Number(entry.amount) || 0;
            } else {
                grouped[headId].credit += Number(entry.amount) || 0;
                totalCredit += Number(entry.amount) || 0;
            }
        }

        // Inject zero rows for mapped account heads missing from grouped
        if (startYear != null) {
            const doc = await ReportMapping.findOne({ societyId, year: startYear });
            const rawMappings = doc?.mappings instanceof Map ? Object.fromEntries(doc.mappings) : doc?.mappings || {};
            const mappedIds = new Set();
            for (const key of Object.keys(rawMappings)) {
                const [id] = String(key).split(":");
                if (id && id.length === 24) mappedIds.add(id);
            }
            const missing = Array.from(mappedIds).filter((id) => !grouped[id]);
            if (missing.length > 0) {
                const heads = await AccountHead.find({ _id: { $in: missing } });
                const idToName = new Map(heads.map((h) => [String(h._id), h.name || ""]));
                for (const id of missing) {
                    grouped[id] = {
                        accountHeadId: id,
                        accountHeadName: idToName.get(id) || "",
                        debit: 0,
                        credit: 0,
                    };
                }
            }
        }

        // 5️⃣ Calculate अखेरी शिल्लक
        const akherShillak = (totalDebit + armbhiShillak) - totalCredit;
        const openingBalance = armbhiShillak;
        const closingBalance = akherShillak;

        // Build trial balance with armbhi and akher shillak
        let trialBalance = Object.values(grouped);

        // // Add आरंभी शिल्लक
        // trialBalance.unshift({
        //     accountHeadId: "arambhi-shillak",
        //     accountHeadName: "आरंभी शिल्लक",
        //     debit: armbhiShillak > 0 ? armbhiShillak : 0,
        //     credit: armbhiShillak < 0 ? Math.abs(armbhiShillak) : 0,
        // });

        // // Add अखेरी शिल्लक
        // trialBalance.push({
        //     accountHeadId: "akher-shillak",
        //     accountHeadName: "अखेरी शिल्लक",
        //     debit: 0,
        //     credit: akherShillak,
        // });

        // 6️⃣ Calculate totals
        const totals = trialBalance.reduce(
            (acc, row) => {
                acc.debit += row.debit;
                acc.credit += row.credit;
                return acc;
            },
            { debit: 0, credit: 0 }
        );

        return res.json({ 
            success: true, 
            trialBalance, 
            totals,
            openingBalance,
            closingBalance
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


exports.getAvailableYears = async (req, res) => {
    try {
        const { societyId } = req.params;

        const dates = await CashBookEntry.distinct("date", { societyId });

        const fySet = new Set();
        dates.forEach((d) => {
            const dt = new Date(d);
            // FY starts on April (month index >= 3)
            const start = dt.getMonth() >= 3 ? dt.getFullYear() : dt.getFullYear() - 1;
            fySet.add(`${start}-${start + 1}`);
        });

        const society = await Society.findById(societyId);
        if (dates.length === 0 && society?.financialYearStart) {
            const fy = new Date(society.financialYearStart).getFullYear();
            fySet.add(`${fy}-${fy + 1}`);
        }

        const years = Array.from(fySet).sort((a, b) => {
            const aStart = parseInt(a.split("-")[0], 10);
            const bStart = parseInt(b.split("-")[0], 10);
            return bStart - aStart; // DESC
        });

        res.json({ success: true, years });
    } catch (e) {
        console.error("getAvailableYears error:", e);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
