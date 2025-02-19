import { L2_NETWORK, L3_NETWORK } from '../../../constants'
import { ethers } from 'ethers'
import { TransactionRecord } from '@/contexts/BlockchainContext'
import { arbSysABI } from '@/web3/ABI/arbSys_abi'

const arbSysAddress = '0x0000000000000000000000000000000000000064'

export const sendWithdrawTransaction = async (
  value: string,
  destination: string,
  signer: ethers.Signer
): Promise<TransactionRecord> => {
  try {
    const valueInWei = ethers.utils.parseEther(value)
    const arbSysContract = new ethers.Contract(arbSysAddress, arbSysABI, signer)
    const txRequest = await arbSysContract.populateTransaction.withdrawEth(destination, {
      value: valueInWei
    })

    const txResponse = await signer.sendTransaction(txRequest)

    // Wait for the transaction to be mined
    await txResponse.wait()

    return {
      type: 'WITHDRAWAL',
      amount: value,
      lowNetworkChainId: L2_NETWORK.chainId,
      highNetworkChainId: L3_NETWORK.chainId,
      highNetworkHash: txResponse.hash,
      highNetworkTimestamp: Date.now() / 1000,
      challengePeriod: 60 * 60
    }
  } catch (error) {
    console.error('Transaction failed:', error)
    throw error
  }
}

export const estimateWithdrawFee = async (
  value: string,
  destination: string,
  provider: ethers.Signer | ethers.providers.Provider
) => {
  try {
    const valueInWei = ethers.utils.parseEther(value)
    const arbSysContract = new ethers.Contract(arbSysAddress, arbSysABI, provider)

    const estimatedGas = await arbSysContract.estimateGas.withdrawEth(destination, {
      value: valueInWei,
      from: destination
    })

    const gasPrice = await provider.getGasPrice()
    const estimatedFee = gasPrice.mul(estimatedGas)
    return { estimatedFee, estimatedGas, gasPrice }
  } catch (error) {
    console.error('Fee estimation failed:', error)
    throw error
  }
}
