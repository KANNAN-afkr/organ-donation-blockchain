const OrganListing = require("../models/OrganListing");
const Hospital = require("../models/Hospital");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const { getSignedContract } = require("../blockchain/contractHelper");

const SIGNER_KEY = process.env.BLOCKCHAIN_SIGNER_KEY;

// Hospital posts a new organ listing
exports.createListing = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) return res.status(400).json({ message: "Register your hospital profile first" });

    const { organType, bloodGroup, donorAge, donorGender, medicalCondition, additionalNotes } = req.body;

    const listing = await OrganListing.create({
      hospitalId: hospital._id,
      organType,
      bloodGroup,
      donorAge,
      donorGender,
      medicalCondition,
      additionalNotes,
      reportFileId: req.file ? req.file.id : null,
      reportFileName: req.file ? req.file.filename : "",
    });

    // Emit socket event for real-time notification
    const io = req.app.get("io");
    if (io) {
      io.emit("new_organ_available", {
        listingId: listing._id,
        organType: listing.organType,
        bloodGroup: listing.bloodGroup,
        hospitalName: hospital.name,
        hospitalId: hospital._id,
        createdAt: listing.createdAt,
      });
    }

    try {
      const contract = getSignedContract(SIGNER_KEY);
      if (contract) {
        const tx = await contract.recordOrganListing(
          listing._id.toString(),
          organType,
          bloodGroup,
          hospital.name
        );
        await tx.wait();
        console.log(`[Blockchain] Organ listing TX: ${tx.hash}`);
      }
    } catch (bcErr) {
      console.warn("[Blockchain] recordOrganListing failed:", bcErr.message);
    }

    console.log(`[OrganListing] New organ posted: ${organType} by ${hospital.name}`);
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all available organ listings — only for hospitals with a registered profile
exports.getListings = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) return res.status(403).json({ message: "Register your hospital profile to view available organs" });

    const listings = await OrganListing.find({ isAvailable: true, hospitalId: { $ne: hospital._id } })
      .populate("hospitalId", "name address contactNumber licenseNumber")
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get listings by hospital
exports.getMyListings = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });
    const listings = await OrganListing.find({ hospitalId: hospital._id }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download PDF report
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

// Mark listing as unavailable (after allocation)
exports.markUnavailable = async (req, res) => {
  try {
    const listing = await OrganListing.findByIdAndUpdate(req.params.id, { isAvailable: false }, { new: true });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
