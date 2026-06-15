const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Personal
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    // Medical (filled when applying)
    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"] },
    bloodGroup: { type: String },
    organNeeded: { type: String },
    urgencyLevel: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    diagnosis: { type: String },
    // Admitted hospital
    hospitalName: { type: String },
    hospitalAddress: { type: String },
    hospitalContactNumber: { type: String },
    hospitalEmergencyContact: { type: String },
    treatingDoctorName: { type: String },
    // Report
    reportFileId: { type: mongoose.Schema.Types.ObjectId },
    reportFileName: { type: String, default: "" },
    isMatched: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipient", recipientSchema);
