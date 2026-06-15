const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const OrganDonation = await hre.ethers.getContractFactory("OrganDonation");
  const contract = await OrganDonation.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("OrganDonation deployed to:", address);

  // Save ABI and address for frontend and backend
  const artifact = await hre.artifacts.readArtifact("OrganDonation");
  const deploymentInfo = {
    address,
    abi: artifact.abi,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../artifacts/deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to artifacts/deployment.json");

  // Also copy to frontend and backend
  const frontendPath = path.join(__dirname, "../../frontend/src/blockchain/deployment.json");
  const backendPath = path.join(__dirname, "../../backend/blockchain/deployment.json");

  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.mkdirSync(path.dirname(backendPath), { recursive: true });

  fs.writeFileSync(frontendPath, JSON.stringify(deploymentInfo, null, 2));
  fs.writeFileSync(backendPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info copied to frontend and backend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
