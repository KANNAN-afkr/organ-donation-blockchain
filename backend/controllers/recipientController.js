const Recipient = require("../models/Recipient");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

// Save basic profile (name, fatherName, contact, address)
exports.saveProfile = async (req, res) => {
  try {
    const { name, fatherName, contactNumber, address } = req.body;
    const existing = await Recipient.findOne({ userId: req.user.id });
    if (existing) {
      const updated = await Recipient.findOneAndUpdate(
        { userId: req.user.id },
        { name, fatherName, contactNumber, address },
        { new: true }
      );
      return res.json({ recipient: updated });
    }
    const recipient = await Recipient.create({ userId: req.user.id, name, fatherName, contactNumber, address });
    res.status(201).json({ recipient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Save full application details with PDF — no organ listing needed
exports.saveApplicationProfile = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.reportFileId = req.file.id;
      data.reportFileName = req.file.filename;
    }
    const recipient = await Recipient.findOneAndUpdate(
      { userId: req.user.id },
      data,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`[Recipient] Profile saved for user ${req.user.id}`);
    res.json({ recipient });
  } catch (err) {
    console.error("[saveApplicationProfile]", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const recipient = await Recipient.findOne({ userId: req.user.id });
    if (!recipient) return res.status(404).json({ message: "Profile not found" });
    res.json(recipient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRecipients = async (req, res) => {
  try {
    const recipients = await Recipient.find().populate("userId", "name email");
    res.json(recipients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const { fileId } = req.params;
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "medicalReports" });
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    if (!files.length) return res.status(404).json({ message: "File not found" });
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="${files[0].filename}"`);
    bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId)).pipe(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
