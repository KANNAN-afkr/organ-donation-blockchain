const Allocation = require("../models/Allocation");
const Donor = require("../models/Donor");
const Recipient = require("../models/Recipient");
const { getSignedContract } = require("../blockchain/contractHelper");

const SIGNER_KEY = process.env.BLOCKCHAIN_SIGNER_KEY;

exports.allocateOrgan = async (req, res) => {
  try {
    const { donorId, recipientId, hospitalId, organType } = req.body;
    const allocation = await Allocation.create({ donorId, recipientId, hospitalId, organType });
    let txHash = "";
    try {
      const contract = getSignedContract(SIGNER_KEY);
      if (contract) {
        const tx = await contract.autoAllocateOrgan(
          allocation._id.toString(), donorId, recipientId, organType
        );
        await tx.wait();
        txHash = tx.hash;
        allocation.allocationTxHash = txHash;
        allocation.status = "confirmed";
        await allocation.save();
        await Donor.findByIdAndUpdate(donorId, { isAllocated: true });
        await Recipient.findByIdAndUpdate(recipientId, { isMatched: true });
        console.log(`[Blockchain] Organ allocated TX: ${txHash}`);
      }
    } catch (bcErr) {
      console.warn("[Blockchain] allocateOrgan failed:", bcErr.message);
    }
    res.status(201).json({ allocation, txHash });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrganStatus = async (req, res) => {
  try {
    const { donorId, status } = req.body;
    let txHash = "";
    try {
      const contract = getSignedContract(SIGNER_KEY);
      if (contract) {
        const tx = await contract.updateOrganStatus(donorId, status);
        await tx.wait();
        txHash = tx.hash;
        console.log(`[Blockchain] Organ status updated to "${status}" TX: ${txHash}`);
      }
    } catch (bcErr) {
      console.warn("[Blockchain] updateOrganStatus failed:", bcErr.message);
    }
    res.json({ success: true, status, txHash });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmTransplant = async (req, res) => {
  try {
    const { id } = req.params;
    const allocation = await Allocation.findById(id);
    if (!allocation) return res.status(404).json({ message: "Allocation not found" });
    let txHash = "";
    try {
      const contract = getSignedContract(SIGNER_KEY);
      if (contract) {
        const transplantId = `transplant_${id}`;
        const tx = await contract.confirmTransplant(
          transplantId, id, allocation.hospitalId.toString()
        );
        await tx.wait();
        txHash = tx.hash;
        console.log(`[Blockchain] Transplant confirmed TX: ${txHash}`);
      }
    } catch (bcErr) {
      console.warn("[Blockchain] confirmTransplant failed:", bcErr.message);
    }
    allocation.status = "completed";
    allocation.transplantTxHash = txHash;
    allocation.transplantDate = new Date();
    await allocation.save();
    res.json({ allocation, txHash });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate("donorId", "name organType bloodType")
      .populate("recipientId", "name organNeeded bloodType urgencyLevel")
      .populate("hospitalId", "name");
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.smartAutoAllocate = async (req, res) => {
  try {
    const contract = getSignedContract(SIGNER_KEY);
    if (!contract) return res.status(500).json({ message: "Contract not available" });
    
    console.log("[Smart Contract] Starting automated organ allocation...");
    
    const tx = await contract.smartAutoAllocate();
    const receipt = await tx.wait();
    
    console.log(`[Smart Contract] Smart allocation completed! TX: ${tx.hash}`);
    
    // Parse events to get allocation details
    const allocationEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === "OrganAllocated";
      } catch { return false; }
    });
    
    if (allocationEvent) {
      const parsed = contract.interface.parseLog(allocationEvent);
      const { allocationId, donorId, recipientId, organType } = parsed.args;
      
      // Save to MongoDB
      const allocation = await Allocation.create({
        _id: allocationId,
        donorId,
        recipientId,
        hospitalId: req.user.id,
        organType,
        status: "confirmed",
        allocationTxHash: tx.hash,
        isSmartContract: true
      });
      
      // Update MongoDB flags
      await Donor.findByIdAndUpdate(donorId, { isAllocated: true });
      await Recipient.findByIdAndUpdate(recipientId, { isMatched: true });
      
      res.json({
        success: true,
        allocation,
        txHash: tx.hash,
        message: "Smart contract successfully allocated organ!"
      });
    } else {
      res.json({ success: true, txHash: tx.hash, message: "Smart allocation completed" });
    }
  } catch (err) {
    console.error("[Smart Contract] Auto-allocation failed:", err.message);
    if (err.message.includes("No compatible match found")) {
      res.status(400).json({ message: "No compatible donor-recipient match found" });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
};
