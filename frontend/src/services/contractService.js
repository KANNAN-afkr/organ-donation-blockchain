import { ethers } from "ethers";

export async function getContract(deploymentInfo) {
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(deploymentInfo.address, deploymentInfo.abi, signer);
}

export async function getReadOnlyContract(deploymentInfo, rpcUrl) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(deploymentInfo.address, deploymentInfo.abi, provider);
}
