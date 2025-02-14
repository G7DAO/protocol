import {BridgeToken} from "../bridgeToken";

const ETH: TokenAddressMap = {
    421614: '0x0000000000000000000000000000000000000000',
    11155111: '0x0000000000000000000000000000000000000000'
}

const L1_NETWORK = {
    chainId: 11155111,
    name: 'sepolia',
    displayName: 'Sepolia',
    rpcs: ['https://ethereum-sepolia-rpc.publicnode.com'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: {
        decimals: 18,
        name: 'ETH',
        symbol: 'ETH'
    },
    g7TokenAddress: '0xe2ef69e4af84dbefb0a75f8491f27a52bf047b01',
    routerSpender: '0x902b3e5f8f19571859f4ab1003b960a5df693aff',
    retryableCreationTimeout: 15 * 60
}


import {TokenAddressMap} from "../types";
import {networks} from "../networks";
import {ethers} from "ethers";


const bridgeToken = async (tokenAddresses: TokenAddressMap, chainId: number, account: string) => {
    const token = new BridgeToken(tokenAddresses, chainId)
    console.log(token);
    const network = networks[token.chainId];
    const provider = new ethers.providers.JsonRpcProvider(network.rpcs[0]);
    const balance = await token.getBalance(provider, account)
    console.log(balance)
}

bridgeToken(ETH, L1_NETWORK.chainId, '0x9ed191DB1829371F116Deb9748c26B49467a592A')
