import dotenv from 'dotenv';

dotenv.config();

const { INFURA_API_KEY } = process.env;

export enum NETWORK_TYPE {
    MAINNET = 'MAINNET',
    TESTNET = 'TESTNET',
}

export enum ChainId {
    Ganache = 1337,
    Polygon = 137,
    PolygonMumbai = 80001,
    Mantle = 5000,
    MantleSepolia = 5003,
    Ethereum = 1,
    Goerli = 5,
    Sepolia = 11155111,
    ArbitrumOne = 42161,
    ArbitrumSepolia = 421614,
    OPMainnet = 10,
    OPSepolia = 11155420,
    Base = 8453,
    BaseSepolia = 84532,
    Game7Testnet = 13746,
    Linea = 59144,
    LineaSepolia = 59141,
}

export enum NetworkName {
    Localhost = 'localhost',
    Ganache = 'ganache',
    Polygon = 'polygon',
    PolygonMumbai = 'polygonMumbai',
    Ethereum = 'mainnet',
    Goerli = 'goerli',
    Sepolia = 'sepolia',
    Mantle = 'mantle',
    MantleSepolia = 'mantleSepolia',
    ArbitrumOne = 'arbitrumOne',
    ArbitrumSepolia = 'arbitrumSepolia',
    OPMainnet = 'OPMainnet',
    OPSepolia = 'OPSepolia',
    Base = 'base',
    BaseSepolia = 'baseSepolia',
    Game7Testnet = 'game7Testnet',
    LineaSepolia = 'lineaSepolia',
    Linea = 'linea',
}

export enum NetworkConfigFile {
    DEFAULT = 'hardhat.config.ts',
    Localhost = 'hardhat.config.ts',
    Ganache = 'hardhat.config.ts',
    Polygon = 'polygon.config.ts',
    PolygonMumbai = 'polygon.config.ts',
    Ethereum = 'hardhat.config.ts',
    Goerli = 'hardhat.config.ts',
    Sepolia = 'hardhat.config.ts',
    Mantle = 'mantle.config.ts',
    MantleSepolia = 'mantle.config.ts',
    ArbitrumOne = 'arbitrum.config.ts',
    ArbitrumSepolia = 'arbitrum.config.ts',
    OPMainnet = 'op.config.ts',
    OPSepolia = 'op.config.ts',
    Base = 'base.config.ts',
    BaseSepolia = 'base.config.ts',
    Game7Testnet = 'g7.config.ts',
    Linea = 'linea.config.ts',
    LineaSepolia = 'linea.config.ts',
}

export enum Currency {
    Localhost = 'ETH',
    Ganache = 'ETH',
    Polygon = 'MATIC',
    PolygonMumbai = 'MATIC',
    Ethereum = 'ETH',
    Goerli = 'ETH',
    Sepolia = 'ETH',
    Mantle = 'MNT',
    MantleSepolia = 'MNT',
    ArbitrumOne = 'ETH',
    ArbitrumSepolia = 'ETH',
    OPMainnet = 'ETH',
    OPSepolia = 'ETH',
    Base = 'ETH',
    BaseSepolia = 'ETH',
    Game7Testnet = 'TG7T',
    Linea = 'ETH',
    LineaSepolia = 'ETH',
}

export enum NetworkExplorer {
    Localhost = 'http://localhost:8545',
    Ganache = 'http://localhost:7545',
    Polygon = 'https://polygonscan.com',
    PolygonMumbai = 'https://mumbai.polygonscan.com',
    Ethereum = 'https://etherscan.io',
    Goerli = 'https://goerli.etherscan.io',
    Sepolia = 'https://sepolia.etherscan.io',
    Mantle = 'https://explorer.mantle.xyz',
    MantleSepolia = 'https://explorer.sepolia.mantle.xyz',
    ArbitrumOne = 'https://arbiscan.io',
    ArbitrumSepolia = 'https://sepolia.arbiscan.io',
    OPMainnet = 'https://optimistic.etherscan.io',
    OPSepolia = 'https://sepolia-optimistic.etherscan.io',
    Base = 'https://basescan.org',
    BaseSepolia = 'https://base-sepolia.blockscout.com',
    Game7Testnet = 'https://testnet.game7.io',
    Linea = 'https://api.lineascan.build',
    LineaSepolia = 'https://api.sepolia.lineascan.build',
}

export function getTransactionUrl(txHash: string, network: NetworkName): string {
    const explorerUrl = NetworkExplorer[network as unknown as keyof typeof NetworkExplorer];

    if (!explorerUrl) throw new Error(`Unsupported network: ${network}`);

    return `${explorerUrl}/tx/${txHash}`;
}

export const rpcUrls = {
    [ChainId.Ganache]: 'http://localhost:8545',
    [ChainId.Ethereum]: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    [ChainId.Goerli]: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
    [ChainId.Sepolia]: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    [ChainId.Polygon]: 'https://polygon.llamarpc.com',
    [ChainId.PolygonMumbai]: 'https://rpc.ankr.com/polygon_mumbai',
    [ChainId.Mantle]: 'https://rpc.mantle.xyz',
    [ChainId.MantleSepolia]: 'https://rpc.sepolia.mantle.xyz',
    [ChainId.ArbitrumOne]: 'https://arb1.arbitrum.io/rpc',
    [ChainId.ArbitrumSepolia]: 'https://sepolia-rollup.arbitrum.io/rpc',
    [ChainId.OPMainnet]: 'https://mainnet.optimism.io',
    [ChainId.OPSepolia]: 'https://sepolia.optimism.io',
    [ChainId.Base]: 'https://mainnet.base.org',
    [ChainId.BaseSepolia]: 'https://sepolia.base.org',
    [ChainId.Game7Testnet]: 'https://testnet-rpc.game7.io',
    [ChainId.Linea]: 'https://rpc.linea.build',
    [ChainId.LineaSepolia]: 'https://rpc.sepolia.linea.build',
};
