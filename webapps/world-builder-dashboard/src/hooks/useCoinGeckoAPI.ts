import { useQuery } from 'react-query'
const BASE_URL = 'https://api.coingecko.com/api/v3/simple/price'

export const useCoinGeckoAPI = () => {
  const useUSDPriceOfToken = (coin: string) => {
    return useQuery(
      ['priceCrypto', coin],
      async () => {
        const res = await fetch(`${BASE_URL}?ids=${coin}&vs_currencies=usd`, {
          method: 'GET'
        })
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`)
        }
        const data = await res.json()
        return data
      },
      {
        enabled: !!coin,
        retry: false,
        staleTime: Infinity,
        cacheTime: Infinity
      }
    )
  }

  return {
    useUSDPriceOfToken
  }
}
