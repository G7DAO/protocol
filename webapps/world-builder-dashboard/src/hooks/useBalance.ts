import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'
import { BridgeToken } from 'game7-bridge-sdk'
import { Token } from '@/utils/tokens'

interface UseBalanceProps {
  account: string | undefined
  token: Token | null
}

const useTokenInformation = ({ account, token }: UseBalanceProps) => {
  return useQuery(
    {
      queryKey: ['balance', account, token], queryFn: async () => {
        if (!account || !token) {
          return { tokenBalance: '0', symbol: '' }
        }
        const bridgeToken: BridgeToken = new BridgeToken(token.tokenAddressMap, token.chainId)
        let tokenBalance
        if (token.decimals) {
          tokenBalance = String(
            ethers.utils.formatUnits(await bridgeToken.getBalance(token.rpc, account ?? ''), token.decimals)
          )
        } else {
          tokenBalance = String(ethers.utils.formatEther(await bridgeToken.getBalance(token.rpc, account ?? '')))
        }
        const symbol = await bridgeToken.getSymbol(token.rpc)
        const decimalPlaces = await bridgeToken.getDecimals(token.rpc)
        return { tokenBalance, symbol, decimalPlaces }
      },
      refetchInterval: 50000,
      enabled: !!account && !!token
    }
  )
}

export default useTokenInformation
