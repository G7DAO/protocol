import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'
import { BridgeToken } from 'game7-bridge-sdk'
import { Token } from '@/utils/tokens'
import { NetworkInterface } from '@/contexts/BlockchainContext'

interface UseBalanceProps {
  account: string | undefined
  token: Token | null
  selectedLowNetwork?: NetworkInterface
  selectedHighNetwork?: NetworkInterface

}

const useTokenInformation = ({ account, token, selectedLowNetwork, selectedHighNetwork }: UseBalanceProps) => {
  return useQuery(
    {
      queryKey: ['balance', account, token, selectedLowNetwork, selectedHighNetwork],
      queryFn: async () => {
        if (!account || !token) {
          return { tokenBalance: '0', symbol: '' }
        }
        const filteredTokenMap = Object.fromEntries(
          Object.entries(token.tokenAddressMap).filter(
            ([chainId, _]: [string, string]) =>
              Number(chainId) === token.chainId
          )
        )
        const bridgeToken: BridgeToken = new BridgeToken(filteredTokenMap, token.chainId)
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
