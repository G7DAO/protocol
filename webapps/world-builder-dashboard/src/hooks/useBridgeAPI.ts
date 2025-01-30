import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'
import { useBlockchainContext } from '@/contexts/BlockchainContext'

const BASE_URL = 'https://api.game7.build'

export const useBridgeAPI = () => {
  const useHistoryTransactions = (address: string | undefined) => {
    const isValidAddress = ethers.utils.isAddress(address ?? '')
    const { selectedNetworkType } = useBlockchainContext()
    const uriSnippet = selectedNetworkType === 'Testnet' ? '-testnet' : ''
    return useQuery(
      {
        queryKey: ['historyTransactions', address, selectedNetworkType],
        queryFn: async () => {
          const res = await fetch(`${BASE_URL}/bridge/game7${uriSnippet}/${address}/transactions?limit=50&offset=0`, {
            method: 'GET'
          })
          if (!res.ok) {
            throw new Error(`Error: ${res.statusText}`)
          }
          const data = await res.json()
          return data
        },

        enabled: !!address && isValidAddress && !!selectedNetworkType,
        retry: false,
        refetchInterval: 600000,
        refetchIntervalInBackground: true
      },
    )
  }

  return {
    useHistoryTransactions
  }
}
