const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    contactNumber: { type: String, required: true },
    specializations: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hospital", hospitalSchema);
