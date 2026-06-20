const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

function getDeployment() {
  const p = path.join(__dirname, "../blockchain/deployment.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

exports.getTransactions = async (req, res) => {
  try {
    const deployment = getDeployment();
    if (!deployment) return res.status(404).json({ message: "Contract not deployed yet" });

    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const contract = new ethers.Contract(deployment.address, deployment.abi, provider);

    const currentBlock = await provider.getBlockNumber();
    const CHUNK = 9;
    const deployBlock = deployment.deployedAtBlock || (currentBlock - CHUNK);

    // Fetch in chunks of 9 blocks
    const allEvents = [];
    for (let from = deployBlock; from <= currentBlock; from += CHUNK) {
      const to = Math.min(from + CHUNK - 1, currentBlock);
      try {
        const [donorEvents, recipientEvents, allocationEvents, statusEvents, transplantEvents, hospitalAllocEvents, hospitalStatusEvents, organListedEvents] =
          await Promise.all([
            contract.queryFilter(contract.filters.DonorRegistered(), from, to),
            contract.queryFilter(contract.filters.RecipientRegistered(), from, to),
            contract.queryFilter(contract.filters.OrganAllocated(), from, to),
            contract.queryFilter(contract.filters.OrganStatusUpdated(), from, to),
            contract.queryFilter(contract.filters.TransplantCompleted(), from, to),
            contract.queryFilter(contract.filters.HospitalOrganAllocated(), from, to),
            contract.queryFilter(contract.filters.HospitalOrganStatusUpdated(), from, to),
            contract.queryFilter(contract.filters.OrganListed(), from, to),
          ]);
        allEvents.push(donorEvents, recipientEvents, allocationEvents, statusEvents, transplantEvents, hospitalAllocEvents, hospitalStatusEvents, organListedEvents);
      } catch (e) { continue; }
    }

    const format = (events, type) =>
      events.map((e) => ({
        type,
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: Number(e.args[e.args.length - 1]) * 1000,
        args: Object.fromEntries(
          e.fragment.inputs.map((inp, i) => [inp.name, e.args[i]?.toString()])
        ),
      }));

    const all = allEvents.flat().map((e) => ({
        type: e.fragment?.name || "Unknown",
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: Number(e.args[e.args.length - 1]) * 1000,
        args: Object.fromEntries(
          e.fragment.inputs.map((inp, i) => [inp.name, e.args[i]?.toString()])
        ),
      })).sort((a, b) => b.blockNumber - a.blockNumber);

    res.json(all);
  } catch (err) {
    console.error("[Blockchain] getTransactions error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getOrganLifecycle = async (req, res) => {
  try {
    const { donorId } = req.params;
    const deployment = getDeployment();
    if (!deployment) return res.status(404).json({ message: "Contract not deployed yet" });

    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const contract = new ethers.Contract(deployment.address, deployment.abi, provider);

    const lifecycle = await contract.getOrganLifecycle(donorId);
    const formatted = lifecycle.map((s) => ({
      donorId: s.donorId,
      status: s.status,
      timestamp: Number(s.timestamp) * 1000,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
