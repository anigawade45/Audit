const mongoose = require("mongoose");

const societySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Society Name
    secretaryName: { type: String, required: true }, // Secretary Name
    taluka: { type: String, required: true }, // Taluka
    district: { type: String, required: true }, // District
    address: { type: String, required: true }, // Address
    type: { type: String, enum: ["housing", "labour"], required: true }, // Matches form radio buttons
    initialBalance: { type: Number, default: 0 },
    financialYearStart: { type: Date, required: true },
    financialYearEnd: { type: Date, required: true },
    currentYear: { type: String, required: true }, // e.g. "2024-2025"
    accountant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Society", societySchema);
