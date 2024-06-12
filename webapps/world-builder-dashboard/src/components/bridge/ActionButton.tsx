import React, {useState} from 'react';
import styles from "./ActionButton.module.css";
import { ethers } from "ethers";
import {useBlockchainContext} from "@/components/bridge/BlockchainContext";


interface ActionButtonProps {
    direction: "DEPOSIT" | "WITHDRAW";
}
const ActionButton: React.FC<ActionButtonProps> = ({direction}) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const {connectedAccount} = useBlockchainContext();

    // Function to request connection to a MetaMask wallet
    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                setIsConnecting(true);
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                console.log('Connected account:', await signer.getAddress());
            } catch (error) {
                console.error('Error connecting to wallet:', error);
            } finally {
                setIsConnecting(false);
            }
        } else {
            alert("Wallet is not installed. Please install it to use this feature.");
        }
    };

    const handleClick = async () => {
        if (typeof window.ethereum !== 'undefined') {

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length === 0) {
                await connectWallet();
            } else {
                console.log('Wallet already connected');
            }
        } else {
            alert("Wallet is not installed. Please install it to use this feature.");
        }
    };


  return (
      <button className={styles.container} onClick={handleClick} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : connectedAccount ? direction.toLowerCase() : 'Connect wallet'}
      </button>
  );
};

export default ActionButton;
