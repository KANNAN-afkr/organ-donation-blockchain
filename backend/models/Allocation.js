const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
  {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipient", required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: false },
    organType: { type: String, required: true },
    status: { type: String, enum: ["pending", "confirmed", "completed"], default: "pending" },
    allocationTxHash: { type: String, default: "" },
    transplantTxHash: { type: String, default: "" },
    transplantDate: { type: Date },
    isSmartContract: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Allocation", allocationSchema);
