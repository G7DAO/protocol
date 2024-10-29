import { useQuery } from 'react-query'
import { ethers } from 'ethers'
import { BridgeToken } from 'game7-bridge-sdk'
import { Token } from '@/utils/tokens'

interface UseBalanceProps {
  account: string | undefined
  token: Token
}

const useBalance = ({ account, token }: UseBalanceProps) => {
  return useQuery(
    ['balance', account, token],
    async () => {
      if (!account) {
        return { tokenBalance: '0', symbol: '' }
      }
      const bridgeToken: BridgeToken = new BridgeToken(token.tokenAddressMap, token.chainId)
      const tokenBalance = String(ethers.utils.formatEther(await bridgeToken.getBalance(token.rpc, account ?? '')))
      const symbol = await bridgeToken.getSymbol(token.rpc)
      return { tokenBalance, symbol }
    },
    {
      refetchInterval: 50000,
      enabled: !!account && !!token
    }
  )
}

export default useBalance
