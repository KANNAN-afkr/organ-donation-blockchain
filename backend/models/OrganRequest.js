const mongoose = require("mongoose");

const organRequestSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    // Patient details
    patientName: { type: String, required: true },
    patientAge: { type: Number, required: true },
    patientGender: { type: String, enum: ["male", "female", "other"], required: true },
    bloodGroup: { type: String, required: true },
    organNeeded: { type: String, required: true },
    urgencyLevel: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    diagnosis: { type: String, required: true },
    treatingDoctorName: { type: String, default: "" },
    // Report
    reportFileId: { type: mongoose.Schema.Types.ObjectId },
    reportFileName: { type: String, default: "" },
    // Status
    isFulfilled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrganRequest", organRequestSchema);
