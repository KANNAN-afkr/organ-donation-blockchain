const mongoose = require("mongoose");

const organListingSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    organType: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    donorAge: { type: Number, required: true },
    donorGender: { type: String, enum: ["male", "female", "other"], required: true },
    medicalCondition: { type: String, required: true },
    additionalNotes: { type: String, default: "" },
    reportFileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS file ID
    reportFileName: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
    blockchainTxHash: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrganListing", organListingSchema);
