const OrganRequest = require("../models/OrganRequest");
const Hospital = require("../models/Hospital");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

// Post a new organ request (hospital has patient needing organ)
exports.createRequest = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) return res.status(400).json({ message: "Register your hospital profile first" });

    const request = await OrganRequest.create({
      hospitalId: hospital._id,
      ...req.body,
      reportFileId: req.file ? req.file.id : null,
      reportFileName: req.file ? req.file.filename : "",
    });

    // Notify all hospitals via socket
    const io = req.app.get("io");
    if (io) {
      io.emit("new_organ_request", {
        requestId: request._id,
        organNeeded: request.organNeeded,
        bloodGroup: request.bloodGroup,
        urgencyLevel: request.urgencyLevel,
        hospitalName: hospital.name,
        createdAt: request.createdAt,
      });
    }

    console.log(`[OrganRequest] New request: ${request.organNeeded} by ${hospital.name}`);
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all organ requests (all hospitals can see all requests)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await OrganRequest.find()
      .populate("hospitalId", "name address contactNumber")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get my hospital's own requests
exports.getMyRequests = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });
    const requests = await OrganRequest.find({ hospitalId: hospital._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download report
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
