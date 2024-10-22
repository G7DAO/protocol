import { ETH, L1_NETWORK, L2_NETWORK, L3_NETWORK, TG7T } from '../../constants'
import { ZERO_ADDRESS } from './web3utils'
import IconEthereum from '@/assets/IconEthereum'
import IconG7T from '@/assets/IconG7T'
import IconTokenNoSynbol from '@/assets/IconTokenNoSymbol'
import IconUSDC from '@/assets/IconUSDC'
import { TokenAddressMap } from 'game7-bridge-sdk'

export interface Token {
  name: string
  symbol: string
  address: string
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  rpc: string
  tokenAddressMap: TokenAddressMap
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
          tokenAddressMap: TG7T
        },
        // {
        //   name: 'USDC',
        //   symbol: 'USDC',
        //   address: '0xf08A50178dfcDe18524640EA6618a1f965821715',
        //   Icon: IconUSDC,
        //   rpc: L1_NETWORK.rpcs[0],
        //   // tokenAddressMap: 
        // },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: ZERO_ADDRESS,
          Icon: IconEthereum,
          rpc: L1_NETWORK.rpcs[0],
          tokenAddressMap: ETH
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
          tokenAddressMap: TG7T
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: ZERO_ADDRESS,
          Icon: IconEthereum,
          rpc: L2_NETWORK.rpcs[0],
          tokenAddressMap: ETH
        },
        // {
        //   name: 'USDC',
        //   symbol: 'USDC',
        //   address: '0xf3C3351D6Bd0098EEb33ca8f830FAf2a141Ea2E1',
        //   Icon: IconUSDC,
        //   rpc: L2_NETWORK.rpcs[0],
        // },
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
          tokenAddressMap: TG7T
        },
        ...storedTokensWithItems
      ]
    default:
      return [] // Return an empty array or handle unsupported networks
  }
}
