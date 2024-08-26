import { ethers } from 'ethers'
import { ERC20_ABI } from '@/web3/ABI/erc20_abi'
import { Signer } from '@ethersproject/abstract-signer'

export const approve = async (
  amount: ethers.BigNumber,
  signer: Signer,
  tokenAddress: string,
  spender: string | undefined
) => {
  if (!spender) {
    throw new Error('sender is undefined')
  }
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
  const tx = await tokenContract.approve(spender, amount)
  return tx.wait()
}
