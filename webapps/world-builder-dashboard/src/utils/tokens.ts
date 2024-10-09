import { L1_NETWORK, L2_NETWORK, L3_NETWORK } from '../../constants'
import { ZERO_ADDRESS } from './web3utils'
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
          rpc: L1_NETWORK.rpcs[0]
        },
        {
          name: 'USDC',
          symbol: 'USDC',
          address: '0xf08A50178dfcDe18524640EA6618a1f965821715',
          Icon: IconUSDC,
          rpc: L1_NETWORK.rpcs[0]
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: ZERO_ADDRESS,
          Icon: IconEthereum,
          rpc: L1_NETWORK.rpcs[0]
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
          rpc: L2_NETWORK.rpcs[0]
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          address: ZERO_ADDRESS,
          Icon: IconEthereum,
          rpc: L2_NETWORK.rpcs[0]
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
          rpc: L3_NETWORK.rpcs[0]
        },
        ...storedTokensWithItems
      ]
    default:
      return [] // Return an empty array or handle unsupported networks
  }
}
