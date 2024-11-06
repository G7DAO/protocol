import { ETH, L1_NETWORK, L2_NETWORK, L3_NETWORK, TG7T, USDC } from '../../constants'
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
          chainId: L1_NETWORK.chainId
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: ZERO_ADDRESS,
          Icon: IconEthereum,
          rpc: L1_NETWORK.rpcs[0],
          tokenAddressMap: ETH,
          chainId: L1_NETWORK.chainId
        },
        {
          name: 'USDC',
          symbol: 'USDC',
          address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
          Icon: IconUSDC,
          rpc: L1_NETWORK.rpcs[0],
          tokenAddressMap: USDC,
          chainId: L1_NETWORK.chainId
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
          chainId: L2_NETWORK.chainId
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: ZERO_ADDRESS,
          Icon: IconEthereum,
          rpc: L2_NETWORK.rpcs[0],
          tokenAddressMap: ETH,
          chainId: L2_NETWORK.chainId
        },
        {
          name: 'USDC',
          symbol: 'USDC',
          address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          Icon: IconUSDC,
          rpc: L2_NETWORK.rpcs[0],
          tokenAddressMap: USDC,
          chainId: L2_NETWORK.chainId
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
          chainId: L3_NETWORK.chainId
        },
        {
          name: 'USDC',
          symbol: 'USDC',
          address: '0x6a0D75EF95d21f1Ba5e2619fBc9D15F424d130BF',
          Icon: IconUSDC,
          rpc: L3_NETWORK.rpcs[0],
          tokenAddressMap: USDC,
          chainId: L3_NETWORK.chainId
        },
        ...storedTokensWithItems
      ]
    default:
      return [] // Return an empty array or handle unsupported networks
  }
}
