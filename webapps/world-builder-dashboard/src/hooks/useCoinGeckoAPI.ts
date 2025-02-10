import { useQuery } from '@tanstack/react-query'

export const useMoonstreamPricesAPI = () => {
  const useUSDPriceOfToken = (coin: string) => {
    return useQuery(
      {
        queryKey: ['priceCrypto', coin],
        queryFn: async () => {
          const res = await fetch(`https://data.moonstream.to/game7/prices.json`, {
            method: 'GET',
          })
          if (!res.ok) {
            throw new Error(`Error: ${res.statusText}`)
          }
          const data = await res.json()
          return data
        },
        enabled: !!coin,
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity
      }
    )
  }

  return {
    useUSDPriceOfToken
  }
}