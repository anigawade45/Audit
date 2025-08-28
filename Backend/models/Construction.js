const mongoose = require("mongoose");

const constructionStatementSchema = new mongoose.Schema({
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  financialYear: { type: String, required: true },
  income: [{
    accountHead: { type: mongoose.Schema.Types.ObjectId, ref: "AccountHead" },
    amount: { type: Number, default: 0 }
  }],
  expenses: [{
    accountHead: { type: mongoose.Schema.Types.ObjectId, ref: "AccountHead" },
    amount: { type: Number, default: 0 }
  }],
  constructionProfit: { type: Number, default: 0 },
  constructionLoss: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("ConstructionStatement", constructionStatementSchema);
