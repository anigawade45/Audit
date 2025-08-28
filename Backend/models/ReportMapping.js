const mongoose = require("mongoose");
const reportMappingSchema = new mongoose.Schema(
    {
        societyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Society",
            required: true,
        },
        year: { type: Number, required: true }, // starting year of FY (e.g., 2024 for 2024-2025)

        mappings: {
            type: Map,
            of: {
                reportType: {
                    type: String,
                    enum: ["profitLoss", "balanceSheet", "construction"],
                    required: true,
                },
                accountHeadId: { type: String }, // optional: link to account head id
                totalAmount: { type: Number, default: 0 }, // store the total amount
                side: { 
                    type: String, 
                    enum: ["debit", "credit"], 
                    required: true 
                }, // store whether debit or credit side
            },
            default: {},
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ReportMapping", reportMappingSchema);
