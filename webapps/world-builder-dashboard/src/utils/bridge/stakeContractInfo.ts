import { L3_NETWORK } from '../../../constants'
import { ethers } from 'ethers'
import { stakerABI } from '@/web3/ABI/staker'

export const getStakerState = async ({
  contractAddress,
  account,
  poolID
}: {
  contractAddress: string | undefined
  account?: string | undefined
  poolID?: ethers.BigNumber | undefined
}) => {
  if (!contractAddress) {
    console.log('getStakerStateError: contract address is undefined')
    return
  }
  const provider = new ethers.providers.JsonRpcProvider(L3_NETWORK.rpcs[0])
  const contract = new ethers.Contract(contractAddress, stakerABI, provider)
  const totalPools = await contract.TotalPools()
  const nativeType = await contract.NATIVE_TOKEN_TYPE()
  const positionsInPool = poolID ? await contract.Positions(poolID) : undefined
  const balance = account ? ethers.utils.formatEther(await contract.balanceOf(account)) : undefined
  const currentAmountInPool = poolID ? await contract.CurrentAmountInPool(poolID) : undefined
  const amountInPool = ethers.utils.formatEther(currentAmountInPool)

  return { totalPools, nativeType, positionsInPool, balance: balance, amountInPool }
}

export const getStakeNativeTxData = async (contractAddressOrName: string, poolID: ethers.BigNumber, value: string) => {
  const options = {
    value: ethers.utils.parseEther(value)
  }
  const provider = new ethers.providers.JsonRpcProvider(L3_NETWORK.rpcs[0])
  const contract = new ethers.Contract(contractAddressOrName, stakerABI, provider)
  try {
    const tx = await contract.populateTransaction.stakeNative(poolID, options)
    return tx.data
  } catch (error) {
    console.error('Error:', error)
  }
}
