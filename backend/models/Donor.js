const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    bloodType: { type: String, required: true },
    organType: { type: String, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    medicalHistory: { type: String, default: "" },
    isApproved: { type: Boolean, default: false },
    isAllocated: { type: Boolean, default: false },
    blockchainTxHash: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donor", donorSchema);
