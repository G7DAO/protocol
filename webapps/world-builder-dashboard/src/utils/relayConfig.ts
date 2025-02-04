
import { SwapWidgetToken } from '@/pages/RelayPage/RelayPage'
import { convertViemChainToRelayChain } from '@reservoir0x/relay-sdk'
import { defineChain, http } from 'viem'
import {
    ancient8, apeChain, arbitrumNova, avalanche, b3, bsc, mainnet, arbitrum, base, optimism, polygon, zksync, xai, mantle, zora, superposition, bob, boba, cyber, degen, forma, funkiMainnet, gnosis, gravity, ham, hychain, ink, linea, lisk, mint, mode, polygonZkEvm, redstone, sanko, scroll, sei, shape, worldchain
} from 'viem/chains'
import { createConfig } from 'wagmi'

const g7Mainnet = defineChain({
    id: 2187,
    caipNetworkId: 'eip155:13746',
    chainNamespace: 'eip155',
    name: 'G7',
    nativeCurrency: {
      decimals: 18,
      name: 'Game7 Token',
      symbol: 'G7T',
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
        url: 'https://mainnet.game7.io.game7.io'
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
    convertViemChainToRelayChain(g7Mainnet)
]

export const wagmiConfig = createConfig({
    chains: [mainnet, ancient8, apeChain, arbitrumNova, avalanche, b3, bsc, zora, arbitrum, base, optimism, polygon, zksync, xai, mantle, superposition, bob, boba, cyber, degen, forma, funkiMainnet, gnosis, gravity, ham, hychain, ink, linea, lisk, mint, mode, polygonZkEvm, redstone, sanko, scroll, sei, shape, worldchain],
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
        [g7Mainnet.id]: http()
    }
})

export const ETH: SwapWidgetToken = {
    chainId: 1,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
    logoURI: 'https://2248955668-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhE4weeNpCJSNUXnecN1R%2Ficon%2FgJEa5WUcw0RjBfGqTNof%2Fxai%20symbol%20red%20svg.svg?alt=media&token=9131a0bf-a73d-4052-a957-fd69884aee62'
}

export const ETH_ARB: SwapWidgetToken = {
    chainId: 42161,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
    logoURI: 'https://2248955668-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhE4weeNpCJSNUXnecN1R%2Ficon%2FgJEa5WUcw0RjBfGqTNof%2Fxai%20symbol%20red%20svg.svg?alt=media&token=9131a0bf-a73d-4052-a957-fd69884aee62'
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
    logoURI: 'https://2248955668-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhE4weeNpCJSNUXnecN1R%2Ficon%2FgJEa5WUcw0RjBfGqTNof%2Fxai%20symbol%20red%20svg.svg?alt=media&token=9131a0bf-a73d-4052-a957-fd69884aee62'
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

export const XAI: SwapWidgetToken = {
    chainId: 660279,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    name: 'XAI',
    symbol: 'XAI',
    logoURI: 'https://2248955668-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhE4weeNpCJSNUXnecN1R%2Ficon%2FgJEa5WUcw0RjBfGqTNof%2Fxai%20symbol%20red%20svg.svg?alt=media&token=9131a0bf-a73d-4052-a957-fd69884aee62'
}


export const TOKENS = [ETH, ETH_ARB, USDC, USDC_ARB, USDC_G7, G7, G7_ARB, G7_G7]