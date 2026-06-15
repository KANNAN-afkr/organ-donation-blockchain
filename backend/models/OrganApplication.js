const mongoose = require("mongoose");

const organApplicationSchema = new mongoose.Schema(
  {
    organListingId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganListing", required: true },
    organRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganRequest", required: true },
    requestingHospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true }, // hospital with patient
    providingHospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },  // hospital with organ
    status: { type: String, enum: ["pending", "ai_analyzed", "approved", "rejected"], default: "pending" },
    organStatus: {
      type: String,
      enum: ["Pending", "Approved", "InTransit", "NearbyHospital", "Delivered", "Completed", "Rejected"],
      default: "Pending"
    },
    organStatusHistory: [{
      status: String,
      note: { type: String, default: "" },
      updatedBy: { type: String, default: "" },
      updatedAt: { type: Date, default: Date.now },
    }],
    aiAnalysis: {
      matchScore: { type: Number, default: 0 },
      keyInsights: [{ type: String }],
      bloodCompatibility: { type: String, default: "" },
      organCompatibility: { type: String, default: "" },
      medicalSummary: { type: String, default: "" },
      recommendation: { type: String, default: "" },
      rawAnalysis: { type: String, default: "" },
    },
    doctorNotes: { type: String, default: "" },
    allocationTxHash: { type: String, default: "" },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrganApplication", organApplicationSchema);
