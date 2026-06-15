const Donor = require("../models/Donor");
const Recipient = require("../models/Recipient");
const Hospital = require("../models/Hospital");
const Allocation = require("../models/Allocation");
const { getSignedContract } = require("../blockchain/contractHelper");

const SIGNER_KEY = process.env.BLOCKCHAIN_SIGNER_KEY;

// Blood group compatibility: donor blood → can donate to these recipient blood types
const compatible = {
  "O-":  ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+":  ["O+", "A+", "B+", "AB+"],
  "A-":  ["A-", "A+", "AB-", "AB+"],
  "A+":  ["A+", "AB+"],
  "B-":  ["B-", "B+", "AB-", "AB+"],
  "B+":  ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

function isCompatible(donorBlood, recipientBlood) {
  return (compatible[donorBlood] || []).includes(recipientBlood);
}

// GET /api/match — return all compatible matches
exports.getMatches = async (req, res) => {
  try {
    const donors = await Donor.find({ isApproved: true, isAllocated: false });
    const recipients = await Recipient.find({ isMatched: false });

    const matches = [];
    const usedRecipients = new Set();

    // Sort donors — process critical/high urgency recipients first
    for (const donor of donors) {
      const compatible_recipients = recipients
        .filter((r) =>
          !usedRecipients.has(r._id.toString()) &&
          r.organNeeded === donor.organType &&
          isCompatible(donor.bloodType, r.bloodType)
        )
        .sort((a, b) => (urgencyOrder[a.urgencyLevel] ?? 2) - (urgencyOrder[b.urgencyLevel] ?? 2));

      if (compatible_recipients.length > 0) {
        matches.push({
          donor,
          bestMatch: compatible_recipients[0],
          allMatches: compatible_recipients,
          compatibilityScore: {
            organMatch: true,
            bloodCompatible: true,
            urgencyLevel: compatible_recipients[0].urgencyLevel,
          },
        });
      }
    }

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/match/auto-allocate-all — allocate ALL compatible matches at once
exports.autoAllocateAll = async (req, res) => {
  try {
    const donors = await Donor.find({ isApproved: true, isAllocated: false });
    const recipients = await Recipient.find({ isMatched: false });
    const hospital = await Hospital.findOne();
    const hospitalId = hospital ? hospital._id : null;

    const contract = getSignedContract(SIGNER_KEY);
    const results = [];
    const usedRecipients = new Set();

    for (const donor of donors) {
      const match = recipients
        .filter((r) =>
          !usedRecipients.has(r._id.toString()) &&
          r.organNeeded === donor.organType &&
          isCompatible(donor.bloodType, r.bloodType)
        )
        .sort((a, b) => (urgencyOrder[a.urgencyLevel] ?? 2) - (urgencyOrder[b.urgencyLevel] ?? 2))[0];

      if (!match) continue;

      usedRecipients.add(match._id.toString());

      // Save to MongoDB
      const allocation = await Allocation.create({
        donorId: donor._id,
        recipientId: match._id,
        hospitalId: hospitalId,
        organType: donor.organType,
        status: "confirmed",
      });

      let txHash = "";
      try {
        if (contract) {
          const tx = await contract.autoAllocateOrgan(
            allocation._id.toString(),
            donor._id.toString(),
            match._id.toString(),
            donor.organType
          );
          await tx.wait();
          txHash = tx.hash;
          allocation.allocationTxHash = txHash;
          await allocation.save();
          console.log(`[Blockchain] Auto-allocated ${donor.organType}: ${donor.name} → ${match.name} TX: ${txHash}`);
        }
      } catch (bcErr) {
        console.warn("[Blockchain] autoAllocateOrgan failed:", bcErr.message);
      }

      // Update MongoDB flags
      await Donor.findByIdAndUpdate(donor._id, { isAllocated: true });
      await Recipient.findByIdAndUpdate(match._id, { isMatched: true });

      results.push({
        donor: { id: donor._id, name: donor.name, organType: donor.organType, bloodType: donor.bloodType },
        recipient: { id: match._id, name: match.name, organNeeded: match.organNeeded, bloodType: match.bloodType, urgencyLevel: match.urgencyLevel },
        hospital: hospital ? hospital.name : "System",
        txHash,
        allocationId: allocation._id,
      });
    }

    res.json({ allocated: results.length, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
