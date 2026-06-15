const Donor = require("../models/Donor");
const { getSignedContract } = require("../blockchain/contractHelper");

const SIGNER_KEY = process.env.BLOCKCHAIN_SIGNER_KEY;

exports.registerDonor = async (req, res) => {
  try {
    const donor = await Donor.create({ ...req.body, userId: req.user.id });
    let txHash = "";
    try {
      const contract = getSignedContract(SIGNER_KEY);
      if (contract) {
        const tx = await contract.registerDonor(
          donor._id.toString(),
          donor.organType,
          donor.bloodType
        );
        await tx.wait();
        txHash = tx.hash;
        donor.blockchainTxHash = txHash;
        await donor.save();
        console.log(`[Blockchain] Donor registered TX: ${txHash}`);
      }
    } catch (bcErr) {
      console.warn("[Blockchain] registerDonor failed:", bcErr.message);
    }
    res.status(201).json({ donor, txHash });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDonors = async (req, res) => {
  try {
    const donors = await Donor.find().populate("userId", "name email walletAddress");
    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDonorById = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).populate("userId", "name email");
    if (!donor) return res.status(404).json({ message: "Donor not found" });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveDonor = async (req, res) => {
  try {
    const donor = await Donor.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!donor) return res.status(404).json({ message: "Donor not found" });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findOne({ userId: req.user.id });
    if (!donor) return res.status(404).json({ message: "Donor profile not found" });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
