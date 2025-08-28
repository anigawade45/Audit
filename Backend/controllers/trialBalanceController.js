const CashBookEntry = require("../models/CashBookEntry");
const AccountHead = require("../models/AccountHead");

// Get Trial Balance (Year-wise)
exports.getTrialBalance = async (req, res) => {
    try {
        const { societyId } = req.params;
        const { year } = req.query; // frontend will send year filter like "2024"

        // 1️⃣ Calculate financial year range
        let startDate, endDate, startYear;
        if (year) {
            startYear = parseInt(year.split("-")[0]);
            startDate = new Date(`${startYear}-04-01`);
            endDate = new Date(`${startYear + 1}-03-31T23:59:59.999Z`);
        }

        // 🔹 Society info
        const society = await AccountHead.findOne({ societyId, name: "Society" });
        const initialOpening = society?.openingAmount || 0;

        // 2️⃣ Default arambhi shillak = society opening
        let armbhiShillak = initialOpening;

        // 3️⃣ जर चालू वर्ष > society सुरुवातीचं वर्ष असेल,
        // तर मागील वर्षाचं अखेरी शिल्लक काढा
        if (startYear && society?.createdAt) {
            const societyStartYear = society.createdAt.getFullYear();
            if (startYear > societyStartYear) {
                const prevYear = startYear - 1;
                const prevStart = new Date(`${prevYear}-04-01`);
                const prevEnd = new Date(`${startYear}-03-31T23:59:59.999Z`);

                const prevEntries = await CashBookEntry.find({
                    societyId,
                    date: { $gte: prevStart, $lte: prevEnd },
                }).populate("accountHead");

                let prevDebit = 0, prevCredit = 0;
                prevEntries.forEach((entry) => {
                    if (entry.type === "Debit") prevDebit += entry.amount;
                    else prevCredit += entry.amount;
                });

                const prevAkher = (prevDebit + initialOpening) - prevCredit;
                armbhiShillak = prevAkher; // 👈 आता आरंभी शिल्लक = मागच्या वर्षाचं अखेरी शिल्लक
            }
        }

        // 4️⃣ Fetch all entries within current year
        const matchStage = { societyId };
        if (year) {
            matchStage.date = { $gte: startDate, $lte: endDate };
        }
        const entries = await CashBookEntry.find(matchStage).populate("accountHead");

        // Group by accountHead and calculate balances
        const grouped = {};
        let totalDebit = 0;
        let totalCredit = 0;

        entries.forEach((entry) => {
            const headId = entry.accountHead._id.toString();
            if (!grouped[headId]) {
                grouped[headId] = {
                    accountHeadId: headId,
                    accountHeadName: entry.accountHead.name,
                    debit: 0,
                    credit: 0,
                };
            }
            if (entry.type === "Debit") {
                grouped[headId].debit += entry.amount;
                totalDebit += entry.amount;
            } else {
                grouped[headId].credit += entry.amount;
                totalCredit += entry.amount;
            }
        });

        // 5️⃣ Calculate अखेरी शिल्लक
        const akherShillak = (totalDebit + armbhiShillak) - totalCredit;

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
            openingBalance: armbhiShillak,
            closingBalance: akherShillak
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
