const mongoose = require("mongoose");

const cashBookEntrySchema = new mongoose.Schema({
  societyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Society", 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["Debit", "Credit"], 
    required: true 
  },
  accountHead: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "AccountHead", 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String 
  },
}, { timestamps: true });

module.exports = mongoose.model("CashBookEntry", cashBookEntrySchema);
