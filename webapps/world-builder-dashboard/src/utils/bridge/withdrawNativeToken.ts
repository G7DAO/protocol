import { L2_NETWORK, L3_NETWORK } from '../../../constants'
import { ethers } from 'ethers'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'

export interface WithdrawRecord {
  amount: string
  lowNetworkChainId: number
  highNetworkChainId: number
  highNetworkHash: string
  lowNetworkHash?: string
  highNetworkTimestamp: number
  lowNetworkBlockNumber?: number
  complete?: boolean
  challengePeriod: number //seconds
}

const arbSysAddress = '0x0000000000000000000000000000000000000064'
const arbSysABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'destination',
        type: 'address'
      }
    ],
    name: 'withdrawEth',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  }
]

export const sendWithdrawTransaction = async (
  amountInNative: string,
  destination: string
): Promise<TransactionRecord> => {
  try {
    if (!window.ethereum) {
      throw new Error('no provider')
    }
    const amountInWei = ethers.utils.parseEther(amountInNative.toString())
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()

    const arbSysContract = new ethers.Contract(arbSysAddress, arbSysABI, signer)

    const txRequest = await arbSysContract.populateTransaction.withdrawEth(destination, {
      value: amountInWei
    })

    const txResponse = await signer.sendTransaction(txRequest)
    console.log('Transaction response:', txResponse)

    // Wait for the transaction to be mined
    const receipt = await txResponse.wait()
    console.log('Transaction receipt:', receipt)
    console.log('Transaction hash:', receipt.transactionHash)
    return {
      type: 'WITHDRAWAL',
      amount: amountInNative,
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
  amountInNative: string,
  destination: string,
  provider: ethers.providers.JsonRpcProvider
) => {
  try {
    const amountInWei = ethers.utils.parseEther(amountInNative.toString())
    const arbSysContract = new ethers.Contract(arbSysAddress, arbSysABI, provider)

    const estimatedGas = await arbSysContract.estimateGas.withdrawEth(destination, {
      value: amountInWei
    })

    console.log('Estimated Gas:', estimatedGas.toString())

    const gasPrice = await provider.getGasPrice()
    const estimatedFee = gasPrice.mul(estimatedGas)
    const estimatedFeeInToken = ethers.utils.formatEther(estimatedFee)

    console.log('Estimated Fee in Wei:', estimatedFee.toString())
    console.log('Estimated Fee in token:', estimatedFeeInToken)

    return estimatedFeeInToken
  } catch (error) {
    console.error('Fee estimation failed:', error)
    throw error
  }
}
