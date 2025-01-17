
import { SwapWidgetToken } from '@/pages/RelayPage/RelayPage'
import { convertViemChainToRelayChain } from '@reservoir0x/relay-sdk'
import { http } from 'viem'
import { mainnet, arbitrum, base, optimism, polygon, zksync, xai } from 'viem/chains'
import { createConfig } from 'wagmi'

export const chains = [
    convertViemChainToRelayChain(mainnet),
    convertViemChainToRelayChain(arbitrum),
    convertViemChainToRelayChain(base),
    convertViemChainToRelayChain(optimism),
    convertViemChainToRelayChain(polygon),
    convertViemChainToRelayChain(zksync),
    convertViemChainToRelayChain(xai),
]

export const wagmiConfig = createConfig({
    chains: [mainnet],
    transports: {
        [mainnet.id]: http(),
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
    logoURI: 'https://2248955668-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhE4weeNpCJSNUXnecN1R%2Ficon%2FgJEa5WUcw0RjBfGqTNof%2Fxai%20symbol%20red%20svg.svg?alt=media&token=9131a0bf-a73d-4052-a957-fd69884aee62'
}

export const USDC_ARB: SwapWidgetToken = {
    chainId: 42161,
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
    logoURI: 'https://2248955668-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhE4weeNpCJSNUXnecN1R%2Ficon%2FgJEa5WUcw0RjBfGqTNof%2Fxai%20symbol%20red%20svg.svg?alt=media&token=9131a0bf-a73d-4052-a957-fd69884aee62'
}

export const USDC_G7: SwapWidgetToken = {
    chainId: 2187,
    address: '0x401eCb1D350407f13ba348573E5630B83638E30D',
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
    logoURI: 'https://2248955668-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhE4weeNpCJSNUXnecN1R%2Ficon%2FgJEa5WUcw0RjBfGqTNof%2Fxai%20symbol%20red%20svg.svg?alt=media&token=9131a0bf-a73d-4052-a957-fd69884aee62'
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
    logoURI: 'https://2248955668-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhE4weeNpCJSNUXnecN1R%2Ficon%2FgJEa5WUcw0RjBfGqTNof%2Fxai%20symbol%20red%20svg.svg?alt=media&token=9131a0bf-a73d-4052-a957-fd69884aee62'
}

export const G7_G7 = {
    chainId: 2187,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    name: 'G7',
    symbol: 'G7',
    logoURI: 'https://2248955668-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhE4weeNpCJSNUXnecN1R%2Ficon%2FgJEa5WUcw0RjBfGqTNof%2Fxai%20symbol%20red%20svg.svg?alt=media&token=9131a0bf-a73d-4052-a957-fd69884aee62'
}


export const TOKENS = [ETH, ETH_ARB, USDC, USDC_ARB, USDC_G7, G7, G7_ARB, G7_G7]