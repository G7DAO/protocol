import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'

interface UseNativeBalanceProps {
  account: string | undefined
  rpc: string
}

const useNativeBalance = ({ account, rpc }: UseNativeBalanceProps) => {
  return useQuery(
    {
      queryKey: ['nativeBalance', account, rpc],
      queryFn: async () => {
        if (!account) {
          return '0'
        }
        const provider = new ethers.providers.JsonRpcProvider(rpc)
        return provider.getBalance(account).then((balance) => ethers.utils.formatEther(balance))
      },
      refetchInterval: 50000,
      enabled: !!account
    }
  )
}

export default useNativeBalance
