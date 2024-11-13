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
          address: '0xf2B58E3519C5b977a254993A4A6EaD581A8989A0',
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
          address: '0x119f0E6303BEc7021B295EcaB27A4a1A5b37ECf0',
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
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          Icon: IconUSDC,
          rpc: L3_NETWORK.rpcs[0],
          tokenAddressMap: USDC,
          chainId: L3_NETWORK.chainId,
          decimals: 6,
          geckoId: 'usd-coin'
        },
        ...storedTokensWithItems
      ]
    default:
      return [] // Return an empty array or handle unsupported networks
  }
}
