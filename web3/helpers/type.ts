import { ethers } from "hardhat";

export type HardhatEthersSigner = Awaited<ReturnType<typeof ethers.getSigner>>;

export const Networks = {
    SEPOLIA: "sepolia",
    ARBITRUM_SEPOLIA: "arbitrum-sepolia",
    BASE_SEPOLIA: "base-sepolia",
    GAME7_TESTNET: "game7-testnet",
}

export const ChainIds = {
    [Networks.SEPOLIA]: 1,
    [Networks.ARBITRUM_SEPOLIA]: 421611,
    [Networks.BASE_SEPOLIA]: 84532,
    [Networks.GAME7_TESTNET]: 13746,
}

export const TxServiceUrl = {
    [ChainIds[Networks.SEPOLIA]]: "https://safe-transaction-sepolia.safe.global",
    [ChainIds[Networks.ARBITRUM_SEPOLIA]]: "https://safe-transaction-arbitrum-sepolia.safe.global",
    [ChainIds[Networks.BASE_SEPOLIA]]: "https://safe-transaction-base-sepolia.safe.global",
    [ChainIds[Networks.GAME7_TESTNET]]: "https://safe-transaction-game7-testnet.safe.global",
}