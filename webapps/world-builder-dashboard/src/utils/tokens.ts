import {
  ETH,
  ETH_MAINNET,
  G7T_MAINNET,
  L1_MAIN_NETWORK,
  L1_NETWORK,
  L2_MAIN_NETWORK,
  L2_NETWORK,
  L3_MAIN_NETWORK,
  L3_NETWORK,
  TG7T,
  USDC,
  USDC_MAINNET
} from '../../constants'
import { ZERO_ADDRESS } from './web3utils'
import { TokenAddressMap } from 'game7-bridge-sdk'
import IconEthereum from '@/assets/IconEthereum'
import IconG7T from '@/assets/IconG7T'
import IconTokenNoSynbol from '@/assets/IconTokenNoSymbol'
import IconUSDC from '@/assets/IconUSDC'

export interface Token {
  name: string
  symbol: string
  address: string
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  rpc: string
  tokenAddressMap: TokenAddressMap
  chainId: number
  decimals?: number
  geckoId?: string
}

export const getTokensForNetwork = (chainId: number | undefined, userAddress: string | undefined): Token[] => {
  const storageKey = `${userAddress}-${chainId}`
  const storedTokens = JSON.parse(localStorage.getItem(storageKey) || '[]')
  const storedTokensWithItems = storedTokens.map((token: any) => ({
    ...token,
    Icon: IconTokenNoSynbol
  }))
  switch (chainId) {
    case L1_NETWORK.chainId:
      return [
        {
          name: 'Game7DAO',
          symbol: 'TG7T',
          address: L1_NETWORK.g7TokenAddress,
          Icon: IconG7T,
          tokenAddressMap: TG7T,
          rpc: L1_NETWORK.rpcs[0],
          chainId: L1_NETWORK.chainId,
          geckoId: 'G7T'
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: ZERO_ADDRESS,
          Icon: IconEthereum,
          rpc: L1_NETWORK.rpcs[0],
          tokenAddressMap: ETH,
          chainId: L1_NETWORK.chainId,
          geckoId: 'ethereum'
        },
        {
          name: 'USDC',
          symbol: 'USDC',
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          Icon: IconUSDC,
          rpc: L1_NETWORK.rpcs[0],
          tokenAddressMap: USDC,
          chainId: L1_NETWORK.chainId,
          decimals: 6,
          geckoId: 'usd-coin'
        },
        ...storedTokensWithItems
      ]
    case L2_NETWORK.chainId:
      return [
        {
          name: 'Game7DAO',
          symbol: 'TG7T',
          address: L2_NETWORK.g7TokenAddress,
          Icon: IconG7T,
          rpc: L2_NETWORK.rpcs[0],
          tokenAddressMap: TG7T,
          chainId: L2_NETWORK.chainId,
          geckoId: 'G7T'
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: ZERO_ADDRESS,
          Icon: IconEthereum,
          rpc: L2_NETWORK.rpcs[0],
          tokenAddressMap: ETH,
          chainId: L2_NETWORK.chainId,
          geckoId: 'ethereum'
        },
        {
          name: 'USDC',
          symbol: 'USDC',
          address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
          Icon: IconUSDC,
          rpc: L2_NETWORK.rpcs[0],
          tokenAddressMap: USDC,
          chainId: L2_NETWORK.chainId,
          decimals: 6,
          geckoId: 'usd-coin'
        },
        ...storedTokensWithItems
      ]
    case L3_NETWORK.chainId:
      return [
        {
          name: 'Testnet Game7 Token',
          symbol: 'TG7T',
          address: L3_NETWORK.g7TokenAddress,
          Icon: IconG7T,
          rpc: L3_NETWORK.rpcs[0],
          tokenAddressMap: TG7T,
          chainId: L3_NETWORK.chainId,
          geckoId: 'G7T'
        },
        {
          name: 'USDC',
          symbol: 'USDC',
          address: '0xf2B58E3519C5b977a254993A4A6EaD581A8989A0',
          Icon: IconUSDC,
          rpc: L3_NETWORK.rpcs[0],
          tokenAddressMap: USDC,
          chainId: L3_NETWORK.chainId,
          decimals: 6,
          geckoId: 'usd-coin'
        },
        ...storedTokensWithItems
      ]
    case L1_MAIN_NETWORK.chainId:
      return [
        {
          name: 'Game7DAO',
          symbol: 'G7',
          address: L1_MAIN_NETWORK.g7TokenAddress,
          Icon: IconG7T,
          tokenAddressMap: G7T_MAINNET,
          rpc: L1_MAIN_NETWORK.rpcs[0],
          chainId: L1_MAIN_NETWORK.chainId,
          geckoId: 'G7T'
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: ZERO_ADDRESS,
          Icon: IconEthereum,
          rpc: L1_MAIN_NETWORK.rpcs[0],
          tokenAddressMap: ETH_MAINNET,
          chainId: L1_MAIN_NETWORK.chainId,
          geckoId: 'ethereum'
        },
        {
          name: 'USDC',
          symbol: 'USDC',
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          Icon: IconUSDC,
          rpc: L1_MAIN_NETWORK.rpcs[0],
          tokenAddressMap: USDC_MAINNET,
          chainId: L1_MAIN_NETWORK.chainId,
          decimals: 6,
          geckoId: 'usd-coin'
        },
        ...storedTokensWithItems
      ]
    case L2_MAIN_NETWORK.chainId:
      return [
        {
          name: 'Game7DAO',
          symbol: 'G7',
          address: L2_MAIN_NETWORK.g7TokenAddress,
          Icon: IconG7T,
          tokenAddressMap: G7T_MAINNET,
          rpc: L2_MAIN_NETWORK.rpcs[0],
          chainId: L2_MAIN_NETWORK.chainId,
          geckoId: 'G7T'
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: ZERO_ADDRESS,
          Icon: IconEthereum,
          rpc: L2_MAIN_NETWORK.rpcs[0],
          tokenAddressMap: ETH_MAINNET,
          chainId: L2_MAIN_NETWORK.chainId,
          geckoId: 'ethereum'
        },
        {
          name: 'USDC',
          symbol: 'USDC',
          address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          Icon: IconUSDC,
          rpc: L2_MAIN_NETWORK.rpcs[0],
          tokenAddressMap: USDC_MAINNET,
          chainId: L2_MAIN_NETWORK.chainId,
          decimals: 6,
          geckoId: 'usd-coin'
        },
        ...storedTokensWithItems
      ]
    case L3_MAIN_NETWORK.chainId:
      return [
        {
          name: 'Game7DAO',
          symbol: 'G7',
          address: L3_MAIN_NETWORK.g7TokenAddress,
          Icon: IconG7T,
          tokenAddressMap: G7T_MAINNET,
          rpc: L3_MAIN_NETWORK.rpcs[0],
          chainId: L3_MAIN_NETWORK.chainId,
          geckoId: 'G7T'
        },
        {
          name: 'USDC',
          symbol: 'USDC',
          address: '0x401eCb1D350407f13ba348573E5630B83638E30D',
          Icon: IconUSDC,
          rpc: L3_MAIN_NETWORK.rpcs[0],
          tokenAddressMap: USDC_MAINNET,
          chainId: L3_MAIN_NETWORK.chainId,
          decimals: 6,
          geckoId: 'usd-coin'
        },
        ...storedTokensWithItems
      ]
    default:
      return [] // Return an empty array or handle unsupported networks
  }
}
