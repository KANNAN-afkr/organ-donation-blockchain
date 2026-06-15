import { createContext, useContext, useState } from "react";
import { ethers } from "ethers";

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask.");
      return;
    }
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await web3Provider.send("eth_requestAccounts", []);
    setProvider(web3Provider);
    setAccount(accounts[0]);
    return accounts[0];
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
  };

  return (
    <Web3Context.Provider value={{ account, provider, connectWallet, disconnectWallet }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
