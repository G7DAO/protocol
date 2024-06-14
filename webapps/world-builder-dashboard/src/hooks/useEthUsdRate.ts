import { useQuery } from 'react-query';
import { ethers } from 'ethers';

const ETH_USD_CONTRACT_ADDRESS = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';
const ABI = [
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            {
                "internalType": "uint80",
                "name": "roundId",
                "type": "uint80"
            },
            {
                "internalType": "int256",
                "name": "answer",
                "type": "int256"
            },
            {
                "internalType": "uint256",
                "name": "startedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "updatedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint80",
                "name": "answeredInRound",
                "type": "uint80"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

type LatestRoundData = {
    roundId: bigint;
    answer: bigint;
    startedAt: bigint;
    updatedAt: bigint;
    answeredInRound: bigint;
} & [bigint, bigint, bigint, bigint, bigint];

const MAINNET_RPC = import.meta.env.VITE_MAINNET_RPC;

const useEthUsdRate = () => {
    return useQuery('ethUsdRate', async () => {
        if (!MAINNET_RPC) {
            console.log("MAINNET RPC PROVIDER isn't set");
            return;
        }
        const provider = new ethers.providers.JsonRpcProvider(MAINNET_RPC);
        const contract = new ethers.Contract(ETH_USD_CONTRACT_ADDRESS, ABI, provider);
        return contract.latestRoundData().then((data: LatestRoundData) => Number(data.answer) / 1e8);
    });
};

export default useEthUsdRate;