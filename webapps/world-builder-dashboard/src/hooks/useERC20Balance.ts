import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'
import { ERC20_ABI } from '@/web3/ABI/erc20_abi'

interface UseERC20BalanceProps {
  tokenAddress: string
  account: string | undefined
  rpc: string
}

const useERC20Balance = ({ tokenAddress, account, rpc }: UseERC20BalanceProps) => {
  return useQuery(
    {
      queryKey: ['ERC20Balance', tokenAddress, account, rpc],
      queryFn: async () => {
        if (!account || tokenAddress === ethers.constants.AddressZero) {
          return { formatted: '0', raw: ethers.BigNumber.from('0') }
        }
        const provider = new ethers.providers.JsonRpcProvider(rpc)
        const ERC20Contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

        const balance = await ERC20Contract.balanceOf(account)
        return {
          formatted: ethers.utils.formatEther(balance),
          raw: balance // BigNumber
        }
      },
      refetchInterval: 50000,
      enabled: !!account
    },
  )
}

interface UseERC20AllowanceProps {
  tokenAddress: string
  owner: string | undefined
  spender: string | undefined
  rpc: string
}

export const fetchERC20Allowance = async ({ tokenAddress, owner, spender, rpc }: UseERC20AllowanceProps) => {
  if (!owner || !spender || tokenAddress === ethers.constants.AddressZero) {
    return { formatted: '0', raw: ethers.BigNumber.from('0') }
  }
  const provider = new ethers.providers.JsonRpcProvider(rpc)
  const ERC20Contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
  const allowance = await ERC20Contract.allowance(owner, spender)

  return { formatted: ethers.utils.formatUnits(allowance, 18), raw: allowance }
}

export default useERC20Balance
