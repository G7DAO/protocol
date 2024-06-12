// BlockchainContext.tsx

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ethers } from 'ethers';
const L3_RPC = "https://game7-testnet-custom.rpc.caldera.xyz/http";
const L2_RPC = "https://sepolia-rollup.arbitrum.io/rpc";

interface BlockchainContextType {
    walletProvider?: ethers.providers.Web3Provider;
    L2Provider?: ethers.providers.JsonRpcProvider;
    L3Provider?: ethers.providers.JsonRpcProvider;
    connectedAccount?: string;
    setL2RPC: (rpcUrl: string) => void;
    setL3RPC: (rpcUrl: string) => void;
    connectWallet: () => Promise<void>;
    tokenAddress: string;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

interface BlockchainProviderProps {
    children: ReactNode;
}

export const BlockchainProvider: React.FC<BlockchainProviderProps> = ({ children }) => {
    const [walletProvider, setWalletProvider] = useState<ethers.providers.Web3Provider>();
    const [L2Provider, setL2Provider] = useState<ethers.providers.JsonRpcProvider>();
    const [L3Provider, setL3Provider] = useState<ethers.providers.JsonRpcProvider>();
    const [connectedAccount, setConnectedAccount] = useState<string>();
    const tokenAddress = "0x5f88d811246222F6CB54266C42cc1310510b9feA";


    useEffect(() => {
        setL2RPC(L2_RPC);
        setL3RPC(L3_RPC);
        const ethereum = window.ethereum;
        if (ethereum && ethereum.on) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            setWalletProvider(provider);
            handleAccountsChanged();

            ethereum.on('accountsChanged', handleAccountsChanged);
            return () => {
                ethereum.removeListener && ethereum?.removeListener('accountsChanged', handleAccountsChanged);
            };
        }

    }, [window.ethereum]);

    const handleAccountsChanged = async () => {
        if (walletProvider) {
            const accounts = await walletProvider.listAccounts();
            if (accounts.length > 0) {
                setConnectedAccount(accounts[0]);
            } else {
                setConnectedAccount(undefined);
            }
        }
    };

    const connectWallet = async () => {
        if (window.ethereum && !walletProvider) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                setWalletProvider(provider);
                await provider.send("eth_requestAccounts", []);
                handleAccountsChanged();
            } catch (error) {
                console.error('Error connecting to wallet:', error);
            }
        }
    };

    const setL2RPC = (rpcUrl: string) => {
        const providerL2 = new ethers.providers.JsonRpcProvider(rpcUrl);
        setL2Provider(providerL2);
    };

    const setL3RPC = (rpcUrl: string) => {
        const providerL3 = new ethers.providers.JsonRpcProvider(rpcUrl);
        setL3Provider(providerL3);
    };

    return (
        <BlockchainContext.Provider value={{
            walletProvider, L2Provider, L3Provider, connectedAccount,
            setL2RPC, setL3RPC, connectWallet, tokenAddress,
        }}>
            {children}
        </BlockchainContext.Provider>
    );
};

// Hook to use the context
export const useBlockchainContext = () => {
    const context = useContext(BlockchainContext);
    if (context === undefined) {
        throw new Error('useBlockchainContext must be used within a BlockchainProvider');
    }
    return context;
};