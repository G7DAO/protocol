import { useQuery } from 'react-query'
import { ethers } from 'ethers'

interface UseERC20BalanceProps {
  tokenAddress: string
  account: string | undefined
  rpc: string
}

const useERC20Balance = ({ tokenAddress, account, rpc }: UseERC20BalanceProps) => {
  return useQuery(
    ['ERC20Balance', tokenAddress, account, rpc],
    async () => {
      if (!account) {
        return '0'
      }
      const provider = new ethers.providers.JsonRpcProvider(rpc)
      const ERC20Contract = new ethers.Contract(
        tokenAddress,
        [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function'
          }
        ],
        provider
      )

      const balance = await ERC20Contract.balanceOf(account)
      return ethers.utils.formatEther(balance)
    },
    {
      refetchInterval: 50000,
      enabled: !!account
    }
  )
}

export default useERC20Balance
