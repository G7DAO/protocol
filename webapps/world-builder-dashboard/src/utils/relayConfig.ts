import { SwapWidgetToken } from '@/pages/RelayPage/RelayPage'
import { convertViemChainToRelayChain } from '@reservoir0x/relay-sdk'
import { defineChain, http } from 'viem'
import {
    ancient8, apeChain, arbitrumNova, avalanche, b3, bsc, mainnet, arbitrum, base, optimism, polygon, zksync, xai, mantle, zora, superposition, bob, boba, cyber, degen, forma, funkiMainnet, gnosis, gravity, ham, hychain, ink, linea, lisk, mint, mode, polygonZkEvm, redstone, sanko, scroll, sei, shape, worldchain
} from 'viem/chains'
import { createConfig } from 'wagmi'

async function fetchChainData() {
    try {
        const response = await fetch('https://api.relay.link/chains') // Replace with actual API endpoint
        const chainsData = await response.json()
        return chainsData
    } catch (error) {
        console.error('Failed to fetch chain data:', error)
        return null
    }
}

fetchChainData()

const g7Mainnet = defineChain({
    id: 2187,
    caipNetworkId: 'eip155:13746',
    chainNamespace: 'eip155',
    name: 'G7 Network',
    nativeCurrency: {
        decimals: 18,
        name: 'Game7 Token',
        symbol: 'G7',
    },
    rpcUrls: {
        default: {
            http: ['https://mainnet-rpc.game7.io'],
            webSocket: ['wss://rpc.game7.io'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Explorer',
            url: 'https://mainnet.game7.io'
        },
    },
    contracts: {
    },
});


export const chains = [
    convertViemChainToRelayChain(mainnet),
    convertViemChainToRelayChain(arbitrum),
    convertViemChainToRelayChain(base),
    convertViemChainToRelayChain(optimism),
    convertViemChainToRelayChain(polygon),
    convertViemChainToRelayChain(zksync),
    convertViemChainToRelayChain(xai),
    convertViemChainToRelayChain(mantle),
    convertViemChainToRelayChain(ancient8),
    convertViemChainToRelayChain(apeChain),
    convertViemChainToRelayChain(arbitrumNova),
    convertViemChainToRelayChain(avalanche),
    convertViemChainToRelayChain(b3),
    convertViemChainToRelayChain(bsc),
    convertViemChainToRelayChain(zora),
    convertViemChainToRelayChain(superposition),
    convertViemChainToRelayChain(bob),
    convertViemChainToRelayChain(boba),
    convertViemChainToRelayChain(cyber),
    convertViemChainToRelayChain(degen),
    convertViemChainToRelayChain(forma),
    convertViemChainToRelayChain(funkiMainnet),
    convertViemChainToRelayChain(gnosis),
    convertViemChainToRelayChain(gravity),
    convertViemChainToRelayChain(ham),
    convertViemChainToRelayChain(hychain),
    convertViemChainToRelayChain(ink),
    convertViemChainToRelayChain(linea),
    convertViemChainToRelayChain(lisk),
    convertViemChainToRelayChain(mint),
    convertViemChainToRelayChain(mode),
    convertViemChainToRelayChain(polygonZkEvm),
    convertViemChainToRelayChain(redstone),
    convertViemChainToRelayChain(sanko),
    convertViemChainToRelayChain(scroll),
    convertViemChainToRelayChain(sei),
    convertViemChainToRelayChain(shape),
    convertViemChainToRelayChain(worldchain),
    convertViemChainToRelayChain(g7Mainnet),
]

export const wagmiConfig = createConfig({
    chains: [mainnet, ancient8, apeChain, arbitrumNova, avalanche, b3, bsc, zora, arbitrum, base, optimism, polygon, zksync, xai, mantle, superposition, bob, boba, cyber, degen, forma, funkiMainnet, gnosis, gravity, ham, hychain, ink, linea, lisk, mint, mode, polygonZkEvm, redstone, sanko, scroll, sei, shape, worldchain, g7Mainnet],
    transports: {
        [mainnet.id]: http(),
        [arbitrum.id]: http(),
        [base.id]: http(),
        [optimism.id]: http(),
        [polygon.id]: http(),
        [zksync.id]: http(),
        [xai.id]: http(),
        [mantle.id]: http(),
        [ancient8.id]: http(),
        [apeChain.id]: http(),
        [arbitrumNova.id]: http(),
        [avalanche.id]: http(),
        [b3.id]: http(),
        [bsc.id]: http(),
        [zora.id]: http(),
        [superposition.id]: http(),
        [bob.id]: http(),
        [boba.id]: http(),
        [cyber.id]: http(),
        [degen.id]: http(),
        [forma.id]: http(),
        [funkiMainnet.id]: http(),
        [gnosis.id]: http(),
        [gravity.id]: http(),
        [ham.id]: http(),
        [hychain.id]: http(),
        [ink.id]: http(),
        [linea.id]: http(),
        [lisk.id]: http(),
        [mint.id]: http(),
        [mode.id]: http(),
        [polygonZkEvm.id]: http(),
        [redstone.id]: http(),
        [sanko.id]: http(),
        [scroll.id]: http(),
        [sei.id]: http(),
        [shape.id]: http(),
        [worldchain.id]: http(),
        [g7Mainnet.id]: http(),
    }
})

export const USDT: SwapWidgetToken = {
    chainId: 1,
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
    name: 'USDT',
    symbol: 'USDT',
    logoURI: 'https://etherscan.io/token/images/tethernew_32.svg'
}

export const USDT_ARB: SwapWidgetToken = {
    chainId: 42161,
    address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    decimals: 6,
    name: 'USDT',
    symbol: 'USDT',
    logoURI: 'https://etherscan.io/token/images/tethernew_32.svg'
}

export const WETH: SwapWidgetToken = {
    chainId: 1,
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    decimals: 18,
    name: 'WETH',
    symbol: 'WETH',
    logoURI: 'https://etherscan.io/token/images/weth_28.png?v=2'
}

export const WETH_ARB: SwapWidgetToken = {
    chainId: 42161,
    address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    decimals: 18,
    name: 'WETH',
    symbol: 'WETH',
    logoURI: 'https://etherscan.io/token/images/weth_28.png?v=2'
}

export const DAI: SwapWidgetToken = {
    chainId: 1,
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    decimals: 18,
    name: 'DAI',
    symbol: 'DAI',
    logoURI: 'https://etherscan.io/token/images/dairplce_32.svg'
}

export const DAI_ARB: SwapWidgetToken = {
    chainId: 42161,
    address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    decimals: 18,
    name: 'DAI',
    symbol: 'DAI',
    logoURI: 'https://etherscan.io/token/images/dairplce_32.svg'
}

export const MNT: SwapWidgetToken = {
    chainId: 1,
    address: '0x3c3a81e81dc49a522a592e7622a7e711c06bf354',
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
    logoURI: 'https://etherscan.io/token/images/mantle_32.svg'
}

export const MNT_ARB: SwapWidgetToken = {
    chainId: 42161,
    address: '0x3c3a81e81dc49a522a592e7622a7e711c06bf354',
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
    logoURI: 'https://etherscan.io/token/images/mantle_32.svg'
}

export const WBTC: SwapWidgetToken = {
    chainId: 1,
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    decimals: 8,
    name: 'WBTC',
    symbol: 'WBTC',
    logoURI: 'https://etherscan.io/token/images/wrappedbtc_ofc_32.svg'
}

export const WBTC_ARB: SwapWidgetToken = {
    chainId: 42161,
    address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
    decimals: 8,
    name: 'WBTC',
    symbol: 'WBTC',
    logoURI: 'https://etherscan.io/token/images/wrappedbtc_ofc_32.svg'
}


export const USDC: SwapWidgetToken = {
    chainId: 1,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
    logoURI: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694'
}

export const USDC_ARB: SwapWidgetToken = {
    chainId: 42161,
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
    logoURI: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694'
}

export const USDC_G7: SwapWidgetToken = {
    chainId: 2187,
    address: '0x401eCb1D350407f13ba348573E5630B83638E30D',
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
    logoURI: 'https://assets.relay.link/icons/currencies/g7.png'
}

// G7
export const G7: SwapWidgetToken = {
    chainId: 1,
    address: '0x12c88a3C30A7AaBC1dd7f2c08a97145F5DCcD830',
    decimals: 18,
    name: 'G7',
    symbol: 'G7',
    logoURI: 'https://assets.relay.link/icons/currencies/g7.png'
}
export const G7_ARB = {
    chainId: 42161,
    address: '0xF18e4466F26B4cA55bbAb890b314a54976E45B17',
    decimals: 18,
    name: 'G7',
    symbol: 'G7',
    logoURI: 'https://assets.relay.link/icons/currencies/g7.png'
}

export const G7_G7 = {
    chainId: 2187,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    name: 'G7',
    symbol: 'G7',
    logoURI: 'https://assets.relay.link/icons/currencies/g7.png'
}

export const ETH = {
    chainId: 1,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
    logoURI: 'https://www.cdnlogo.com/logos/e/81/ethereum-eth.svg'
}

export const ETH_ARB = {
    chainId: 42161,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
    logoURI: 'https://www.cdnlogo.com/logos/e/81/ethereum-eth.svg'
}



export const TOKENS = [ETH, ETH_ARB, USDC, USDC_ARB, USDC_G7, G7, G7_ARB, G7_G7, WETH, WETH_ARB, WBTC, WBTC_ARB, MNT, MNT_ARB, DAI, DAI_ARB, USDT, USDT_ARB]