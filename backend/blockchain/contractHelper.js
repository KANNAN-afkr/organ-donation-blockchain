const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

let contract = null;

function getContract() {
  if (contract) return contract;

  const deploymentPath = path.join(__dirname, "../blockchain/deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.warn("Blockchain deployment.json not found. Blockchain features disabled.");
    return null;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  contract = new ethers.Contract(deployment.address, deployment.abi, provider);
  return contract;
}

function getSignedContract(privateKey) {
  const deploymentPath = path.join(__dirname, "../blockchain/deployment.json");
  if (!fs.existsSync(deploymentPath)) return null;

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(deployment.address, deployment.abi, wallet);
}

module.exports = { getContract, getSignedContract };
