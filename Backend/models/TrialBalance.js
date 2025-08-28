const mongoose = require("mongoose");

const trialBalanceMappingSchema = new mongoose.Schema({
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  accountHead: { type: mongoose.Schema.Types.ObjectId, ref: "AccountHead", required: true },
  mappedTo: { 
    type: String, 
    enum: ["ProfitLoss", "ConstructionStatement", "BalanceSheet"], 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model("TrialBalanceMapping", trialBalanceMappingSchema);
