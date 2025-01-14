import { useQuery } from 'react-query'

export const useCoinGeckoAPI = () => {
  const useUSDPriceOfToken = (coin: string) => {
    return useQuery(
      ['priceCrypto', coin],
      async () => {
        const res = await fetch(`https://pro-api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`, {
          method: 'GET',
          headers: { accept: 'application/json', 'x-cg-pro-api-key': import.meta.env.VITE_COIN_GECKO_API_KEY }
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