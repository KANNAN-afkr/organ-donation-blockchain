const OrganApplication = require("../models/OrganApplication");
const OrganListing = require("../models/OrganListing");
const OrganRequest = require("../models/OrganRequest");
const Hospital = require("../models/Hospital");
const { analyzeMedicalReports } = require("../services/geminiService");
const { getSignedContract } = require("../blockchain/contractHelper");

const SIGNER_KEY = process.env.BLOCKCHAIN_SIGNER_KEY;

// Hospital with organ allocates to hospital with patient request
exports.allocateOrgan = async (req, res) => {
  try {
    const { organListingId, organRequestId } = req.body;

    const providingHospital = await Hospital.findOne({ userId: req.user.id });
    if (!providingHospital) return res.status(400).json({ message: "Register your hospital profile first" });

    const listing = await OrganListing.findById(organListingId);
    if (!listing) return res.status(404).json({ message: "Organ listing not found" });
    if (!listing.isAvailable) return res.status(400).json({ message: "This organ is no longer available" });

    const request = await OrganRequest.findById(organRequestId).populate("hospitalId");
    if (!request) return res.status(404).json({ message: "Organ request not found" });
    if (request.isFulfilled) return res.status(400).json({ message: "This request is already fulfilled" });

    const existing = await OrganApplication.findOne({ organListingId, organRequestId });
    if (existing) return res.status(400).json({ message: "Already applied for this combination" });

    const application = await OrganApplication.create({
      organListingId,
      organRequestId,
      requestingHospitalId: request.hospitalId._id,
      providingHospitalId: providingHospital._id,
      status: "approved",
      organStatus: "Approved",
      organStatusHistory: [{ status: "Approved", note: "Organ allocated by providing hospital", updatedBy: providingHospital.name, updatedAt: new Date() }],
      approvedAt: new Date(),
    });

    // Mark listing unavailable and request fulfilled
    await OrganListing.findByIdAndUpdate(organListingId, { isAvailable: false });
    await OrganRequest.findByIdAndUpdate(organRequestId, { isFulfilled: true });

    // Record on blockchain
    let txHash = "";
    try {
      const contract = getSignedContract(SIGNER_KEY);
      if (contract) {
        const tx = await contract.recordHospitalAllocation(
          application._id.toString(),
          listing.organType,
          providingHospital.name,
          request.hospitalId.name || "",
          request.patientName
        );
        await tx.wait();
        txHash = tx.hash;
        application.allocationTxHash = txHash;
        await application.save();
        console.log(`[Blockchain] Allocation recorded. TX: ${txHash}`);
      }
    } catch (bcErr) {
      console.warn("[Blockchain] recordHospitalAllocation failed:", bcErr.message);
    }

    // Notify both hospitals via socket
    const io = req.app.get("io");
    if (io) {
      const payload = {
        type: "organ_allocated",
        applicationId: application._id.toString(),
        organType: listing.organType,
        organStatus: "Approved",
        fromHospital: providingHospital.name,
        organStatusHistory: application.organStatusHistory,
      };
      io.emit(`application_${application._id}`, payload);
      io.emit(`hospital_${request.hospitalId._id}`, payload);
      io.emit(`hospital_${providingHospital._id}`, payload);
    }

    res.status(201).json({ application, message: "Organ allocated. AI analysis in progress..." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get applications for my hospital (both as provider and requester)
exports.getMyApplications = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    const applications = await OrganApplication.find({
      $or: [
        { providingHospitalId: hospital._id },
        { requestingHospitalId: hospital._id },
      ]
    })
      .populate({ path: "organListingId", populate: { path: "hospitalId", select: "name" } })
      .populate("organRequestId")
      .populate("requestingHospitalId", "name address contactNumber")
      .populate("providingHospitalId", "name address contactNumber")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve application → blockchain records it → IMMUTABLE
exports.approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorNotes } = req.body;

    const application = await OrganApplication.findById(id)
      .populate({ path: "organListingId", populate: { path: "hospitalId", select: "name" } })
      .populate("organRequestId")
      .populate("requestingHospitalId", "name address contactNumber")
      .populate("providingHospitalId", "name address contactNumber");

    let txHash = "";
    try {
      const contract = getSignedContract(SIGNER_KEY);
      if (contract) {
        const tx = await contract.autoAllocateOrgan(
          application._id.toString(),
          application.organListingId._id.toString(),
          application.organRequestId._id.toString(),
          application.organListingId.organType
        );
        await tx.wait();
        txHash = tx.hash;
        console.log(`[Blockchain] Approved. TX: ${txHash}`);
      }
    } catch (bcErr) {
      console.warn("[Blockchain] TX failed:", bcErr.message);
    }

    application.status = "approved";
    application.organStatus = "Approved";
    application.organStatusHistory = [{ status: "Approved", note: "Doctor approved the allocation", updatedBy: application.providingHospitalId?.name || "Providing Hospital", updatedAt: new Date() }];
    application.doctorNotes = doctorNotes || "";
    application.allocationTxHash = txHash;
    application.approvedAt = new Date();
    await application.save();

    await OrganListing.findByIdAndUpdate(application.organListingId._id, { isAvailable: false });
    await OrganRequest.findByIdAndUpdate(application.organRequestId._id, { isFulfilled: true });

    const io = req.app.get("io");
    if (io) {
      const payload = { type: "application_approved", organType: application.organListingId.organType, txHash, applicationId: application._id.toString(), organStatus: "Approved", organStatusHistory: application.organStatusHistory };
      io.emit(`application_${application._id}`, payload);
      io.emit(`hospital_${application.requestingHospitalId}`, payload);
      io.emit(`hospital_${application.providingHospitalId}`, payload);
    }

    res.json({ application, txHash, message: "Approved and recorded on blockchain" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject application
exports.rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorNotes } = req.body;
    const application = await OrganApplication.findById(id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.status === "approved") return res.status(400).json({ message: "Cannot reject — already approved on blockchain" });
    application.status = "rejected";
    application.organStatus = "Rejected";
    application.doctorNotes = doctorNotes || "";
    await application.save();
    res.json({ application, message: "Application rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update organ transport status
exports.updateOrganStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { organStatus, note, customMessage } = req.body;

    // Allow predefined status update OR custom message only
    const validStatuses = ["InTransit", "NearbyHospital", "Delivered", "Completed"];
    const isCustomOnly = !organStatus && customMessage;
    if (!isCustomOnly && !validStatuses.includes(organStatus))
      return res.status(400).json({ message: "Invalid status" });

    const hospital = await Hospital.findOne({ userId: req.user.id });

    const application = await OrganApplication.findById(id)
      .populate({ path: "organListingId", populate: { path: "hospitalId", select: "name" } })
      .populate("organRequestId")
      .populate("requestingHospitalId", "name address contactNumber")
      .populate("providingHospitalId", "name address contactNumber");
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.status !== "approved") return res.status(400).json({ message: "Can only update approved applications" });

    const historyEntry = {
      status: organStatus || application.organStatus,
      note: customMessage || note || "",
      updatedBy: hospital?.name || "Hospital",
      updatedAt: new Date(),
    };

    if (!isCustomOnly) application.organStatus = organStatus;
    application.organStatusHistory.push(historyEntry);
    await application.save();

    // Record status update on blockchain
    try {
      const contract = getSignedContract(SIGNER_KEY);
      if (contract) {
        const tx = await contract.recordOrganStatusUpdate(
          id,
          organStatus || application.organStatus,
          historyEntry.note || ""
        );
        await tx.wait();
        console.log(`[Blockchain] Status update recorded. TX: ${tx.hash}`);
      }
    } catch (bcErr) {
      console.warn("[Blockchain] recordOrganStatusUpdate failed:", bcErr.message);
    }

    if (organStatus === "Completed") {
      await OrganListing.findByIdAndUpdate(application.organListingId, { isAvailable: false });
      await OrganRequest.findByIdAndUpdate(application.organRequestId, { isFulfilled: true });
    }

    const io = req.app.get("io");
    if (io) {
      const payload = {
        type: "organ_status_update",
        organStatus: application.organStatus,
        applicationId: id,
        note: historyEntry.note,
        updatedBy: historyEntry.updatedBy,
        organStatusHistory: application.organStatusHistory,
      };
      io.emit(`application_${id}`, payload);
      io.emit(`hospital_${application.requestingHospitalId._id || application.requestingHospitalId}`, payload);
      io.emit(`hospital_${application.providingHospitalId._id || application.providingHospitalId}`, payload);
    }

    console.log(`[OrganStatus] ${id} → ${application.organStatus}`);
    res.json({ application, message: `Status updated` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Re-analyze with AI
exports.reAnalyze = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await OrganApplication.findById(id)
      .populate("organListingId")
      .populate("organRequestId");
    if (!application) return res.status(404).json({ message: "Application not found" });

    const r = application.organRequestId;
    const analysis = await analyzeMedicalReports(application.organListingId, {
      patientName: r.patientName,
      patientAge: r.patientAge,
      patientGender: r.patientGender,
      bloodGroup: r.bloodGroup,
      organNeeded: r.organNeeded,
      urgencyLevel: r.urgencyLevel,
      diagnosis: r.diagnosis,
      reportFileId: r.reportFileId,
    });
    application.aiAnalysis = analysis;
    application.status = "ai_analyzed";
    await application.save();
    res.json({ application, message: "AI re-analysis complete" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Quick AI insights without creating an application
exports.quickAiInsights = async (req, res) => {
  try {
    const { organListingId, organRequestId } = req.body;
    const listing = await OrganListing.findById(organListingId);
    if (!listing) return res.status(404).json({ message: "Organ listing not found" });
    const request = await OrganRequest.findById(organRequestId);
    if (!request) return res.status(404).json({ message: "Organ request not found" });

    const analysis = await analyzeMedicalReports(listing, {
      patientName: request.patientName,
      patientAge: request.patientAge,
      patientGender: request.patientGender,
      bloodGroup: request.bloodGroup,
      organNeeded: request.organNeeded,
      urgencyLevel: request.urgencyLevel,
      diagnosis: request.diagnosis,
      reportFileId: request.reportFileId,
    });
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
