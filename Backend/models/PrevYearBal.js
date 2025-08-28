const mongoose = require("mongoose");

const previousYearBalanceSchema = new mongoose.Schema({
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  year: { type: String, required: true }, // e.g. "2024-2025"
  balances: [{
    accountHead: { type: mongoose.Schema.Types.ObjectId, ref: "AccountHead" },
    amount: { type: Number, default: 0 },
    type: { type: String, enum: ["Debit", "Credit"] }
  }]
}, { timestamps: true });

module.exports = mongoose.model("PreviousYearBalance", previousYearBalanceSchema);
