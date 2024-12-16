import {TokenMinterAbi} from "../abi/TokenMinterABI";
import {ethers, Signer} from "ethers";
import {MessageTransmitterAbi} from "../abi/MessageTransmitterContract";

export enum ChainId {
    // L1
    Ethereum = 1,
    // L1 Testnets
    Sepolia = 11155111,
    // L2
    ArbitrumOne = 42161,
    // L2 Testnets
    ArbitrumSepolia = 421614,
}
export enum ChainDomain {
    Ethereum = 0,
    ArbitrumOne = 3
}


export type CCTPSupportedChainId =
    | ChainId.Ethereum
    | ChainId.Sepolia
    | ChainId.ArbitrumOne
    | ChainId.ArbitrumSepolia

type Contracts = {
    tokenMessengerContractAddress: string
    targetChainDomain: ChainDomain
    sourceChainDomain: ChainDomain
    targetChainId: CCTPSupportedChainId
    usdcContractAddress: string
    messageTransmitterContractAddress: string
    attestationApiUrl: string
    tokenMinterContractAddress: string
}

export type MessageSent = {
    attestationHash: string
    blockNumber: string
    blockTimestamp: string
    id: string
    message: string
    nonce: string
    sender: string
    recipient: string
    sourceDomain: `${ChainDomain}`
    transactionHash: string
    amount: string
}

export const CommonAddress = {
    Ethereum: {
        USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        tokenMessengerContractAddress: '0xbd3fa81b58ba92a82136038b25adec7066af3155'
    },
    ArbitrumOne: {
        USDC: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        'USDC.e': '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
        tokenMessengerContractAddress: '0x19330d10d9cc8751218eaf51e8885d058642e08a',

        CU: '0x89c49a3fa372920ac23ce757a029e6936c0b8e02'
    },
    Sepolia: {
        USDC: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
        tokenMessengerContractAddress: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5'
    },
    ArbitrumSepolia: {
        USDC: '0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d',
        'USDC.e': '0x119f0e6303bec7021b295ecab27a4a1a5b37ecf0',
        tokenMessengerContractAddress: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5'
    }
} as const

export const chainIdToUSDC = (chainId: number): string | null => {
    const chainMapping: { [key: number]: string | undefined } = {
        1: CommonAddress.Ethereum.USDC, // Mainnet
        42161: CommonAddress.ArbitrumOne.USDC, // Arbitrum One
        11155111: CommonAddress.Sepolia.USDC, // Sepolia
        421613: CommonAddress.ArbitrumSepolia.USDC, // Arbitrum Sepolia
        660279: CommonAddress[660279]?.CU // Xai Mainnet (optional CU as example)
    };

    return chainMapping[chainId] || null;
};

const contracts: Record<CCTPSupportedChainId, Contracts> = {
    [ChainId.Ethereum]: {
        tokenMessengerContractAddress:
        CommonAddress.Ethereum.tokenMessengerContractAddress,
        targetChainDomain: ChainDomain.ArbitrumOne,
        targetChainId: ChainId.ArbitrumOne,
        sourceChainDomain: ChainDomain.Ethereum,
        usdcContractAddress: CommonAddress.Ethereum.USDC,
        messageTransmitterContractAddress:
            '0xc30362313fbba5cf9163f0bb16a0e01f01a896ca',
        attestationApiUrl: 'https://iris-api.circle.com/v1',
        tokenMinterContractAddress: '0xc4922d64a24675e16e1586e3e3aa56c06fabe907'
    },
    [ChainId.Sepolia]: {
        tokenMessengerContractAddress:
        CommonAddress.Sepolia.tokenMessengerContractAddress,
        targetChainDomain: ChainDomain.ArbitrumOne,
        targetChainId: ChainId.ArbitrumSepolia,
        sourceChainDomain: ChainDomain.Ethereum,
        usdcContractAddress: CommonAddress.Sepolia.USDC,
        messageTransmitterContractAddress:
            '0xacf1ceef35caac005e15888ddb8a3515c41b4872',
        attestationApiUrl: 'https://iris-api-sandbox.circle.com/v1',
        tokenMinterContractAddress: '0xe997d7d2f6e065a9a93fa2175e878fb9081f1f0a'
    },
    [ChainId.ArbitrumOne]: {
        tokenMessengerContractAddress:
        CommonAddress.ArbitrumOne.tokenMessengerContractAddress,
        targetChainDomain: ChainDomain.Ethereum,
        targetChainId: ChainId.Ethereum,
        sourceChainDomain: ChainDomain.ArbitrumOne,
        usdcContractAddress: CommonAddress.ArbitrumOne.USDC,
        messageTransmitterContractAddress:
            '0x0a992d191deec32afe36203ad87d7d289a738f81',
        attestationApiUrl: 'https://iris-api.circle.com/v1',
        tokenMinterContractAddress: '0xe7ed1fa7f45d05c508232aa32649d89b73b8ba48'
    },
    [ChainId.ArbitrumSepolia]: {
        tokenMessengerContractAddress:
        CommonAddress.ArbitrumSepolia.tokenMessengerContractAddress,
        targetChainDomain: ChainDomain.Ethereum,
        targetChainId: ChainId.Sepolia,
        sourceChainDomain: ChainDomain.ArbitrumOne,
        usdcContractAddress: CommonAddress.ArbitrumSepolia.USDC,
        messageTransmitterContractAddress:
            '0x7865fafc2db2093669d92c0f33aeef291086befd',
        attestationApiUrl: 'https://iris-api-sandbox.circle.com/v1',
        tokenMinterContractAddress: '0xe997d7d2f6e065a9a93fa2175e878fb9081f1f0a'
    }
}

export type AttestationResponse =
    | {
    attestation: string
    status: 'complete'
}
    | {
    attestation: null
    status: 'pending_confirmations'
}

export function getCctpContracts({originChainId}: {
    originChainId?: ChainId
}) {
    if (!originChainId) {
        return contracts[ChainId.Ethereum]
    }
    return (
        contracts[originChainId as CCTPSupportedChainId] ||
        contracts[ChainId.Ethereum]
    )
}

export function fetchPerMessageBurnLimit({originChainId, originProvider}: {
    originChainId: CCTPSupportedChainId
    originProvider: ethers.providers.Provider
}) {
    const { usdcContractAddress, tokenMinterContractAddress } = getCctpContracts({
        originChainId: originChainId
    })

    const tokenMinterContract = new ethers.Contract(
        tokenMinterContractAddress,
        TokenMinterAbi,
        originProvider
    );

    return tokenMinterContract.burnLimitsPerMessage(usdcContractAddress);
}

export const getCctpUtils = ({ originChainId }: { originChainId?: number }) => {
    const {
        attestationApiUrl,
        messageTransmitterContractAddress,
        sourceChainDomain
    } = getCctpContracts({ originChainId })

    const fetchAttestation = async (attestationHash: string) => {
        const response = await fetch(
            `${attestationApiUrl}/attestations/${attestationHash}`,
            { method: 'GET', headers: { accept: 'application/json' } }
        )

        const attestationResponse: AttestationResponse = await response.json()
        return attestationResponse
    }

    const fetchMessages = async (transactionHash: string) => {
        const response = await fetch(
            `${attestationApiUrl}/messages/${sourceChainDomain}/${transactionHash}`,
            { method: 'GET', headers: { accept: 'application/json' } }
        )

        return await response.json()
    }

    const waitForAttestation = async (attestationHash: string) => {
        while (true) {
            const attestation = await fetchAttestation(attestationHash)
            if (attestation.status === 'complete') {
                return attestation.attestation
            }

            await new Promise(r => setTimeout(r, 30_000))
        }
    }

    const receiveMessage = async ({messageBytes, attestation, destinationSigner}: {
        messageBytes: string
        attestation: string
        destinationSigner: Signer
    }) => {

        const messageTransmitterContract = new ethers.Contract(
            messageTransmitterContractAddress,
            MessageTransmitterAbi,
            destinationSigner
        );

        return await messageTransmitterContract.receiveMessage(
            messageBytes,
            attestation
        );
    }

    const checkNonce = async ({nonce, destinationProvider}: {
        nonce: string
        destinationProvider: ethers.providers.Provider
    }) => {

        const messageTransmitterContract = new ethers.Contract(
            messageTransmitterContractAddress,
            MessageTransmitterAbi,
            destinationProvider
        );

        return await messageTransmitterContract.usedNonces(nonce);
    }

    return {
        receiveMessage,
        fetchAttestation,
        waitForAttestation,
        fetchMessages,
        checkNonce,
    }
}

export const isTokenMainnetUSDC = (tokenAddress: string | undefined) =>
    tokenAddress?.toLowerCase() === CommonAddress.Ethereum.USDC.toLowerCase()

export const isTokenSepoliaUSDC = (tokenAddress: string | undefined) =>
    tokenAddress?.toLowerCase() === CommonAddress.Sepolia.USDC.toLowerCase()

export const isTokenArbitrumOneNativeUSDC = (
    tokenAddress: string | undefined | null
) =>
    tokenAddress?.toLowerCase() === CommonAddress.ArbitrumOne.USDC.toLowerCase()

export const isTokenArbitrumSepoliaNativeUSDC = (
    tokenAddress: string | undefined
) =>
    tokenAddress?.toLowerCase() ===
    CommonAddress.ArbitrumSepolia.USDC.toLowerCase()

export const isTokenNativeUSDC = (tokenAddress: string | undefined) => {
    return (
        isTokenMainnetUSDC(tokenAddress) ||
        isTokenSepoliaUSDC(tokenAddress) ||
        isTokenArbitrumOneNativeUSDC(tokenAddress) ||
        isTokenArbitrumSepoliaNativeUSDC(tokenAddress)
    )
}

export const isCctp = (chainId: number, contractAddress: string) => {
    const chainKey = ChainId[chainId] as keyof typeof CommonAddress;
    const chainData = CommonAddress[chainKey];
    if (!chainData) return false;
    return chainData.tokenMessengerContractAddress === contractAddress;
}

export const isNativeUSDC = (chainId: number, tokenAddress: string) => {
    const chainKey = ChainId[chainId] as keyof typeof CommonAddress;
    const chainData = CommonAddress[chainKey];
    if (!chainData) return false;
    return chainData.USDC === tokenAddress;
}

export const hashSourceAndNonce = (source: number, nonce: number): string => {
    if (!Number.isInteger(source) || source < 0) {
        throw new Error("Source must be a non-negative integer.");
    }
    if (!Number.isInteger(nonce) || nonce < 0) {
        throw new Error("Nonce must be a non-negative integer.");
    }

    // Pack the source and nonce into a single byte array
    const encodedData = ethers.utils.solidityPack(["uint32", "uint64"], [source, nonce]);

    // Compute the keccak256 hash of the encoded data
    return ethers.utils.keccak256(encodedData);
};
