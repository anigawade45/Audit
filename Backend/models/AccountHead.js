const mongoose = require("mongoose");

const accountHeadSchema = new mongoose.Schema({
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  type: { type: String, enum: ["Debit", "Credit"], required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ["CashBook", "ProfitLoss", "Construction", "BalanceSheet"], default: "CashBook" },
  isPrebuilt: { type: Boolean, default: false },
  openingAmount: { type: Number, default: 0 }
}, { timestamps: true });


module.exports = mongoose.model("AccountHead", accountHeadSchema);
