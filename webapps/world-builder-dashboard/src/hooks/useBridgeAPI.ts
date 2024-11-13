import { useQuery } from 'react-query'
import { ethers } from 'ethers'

const BASE_URL = 'https://api.game7.build'

export const useBridgeAPI = () => {
  const useHistoryTransactions = (address: string | undefined) => {
    const isValidAddress = ethers.utils.isAddress(address ?? '')
    return useQuery(
      ['historyTransactions', address],
      async () => {
        const res = await fetch(`${BASE_URL}/bridge/${address}/transactions?limit=50&offset=0`, {
          method: 'GET'
        })
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`)
        }
        const data = await res.json()
        return data
      },
      {
        enabled: !!address && isValidAddress,
        retry: false
      }
    )
  }

  return {
    useHistoryTransactions
  }
}
