const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  societies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Society"
  }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
