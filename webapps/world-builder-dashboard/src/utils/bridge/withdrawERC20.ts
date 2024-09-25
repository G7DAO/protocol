import { L1_NETWORK, L2_NETWORK } from '../../../constants'
import { ethers } from 'ethers'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { L2GatewayRouterABI } from '@/web3/ABI/l2GatewayRouter_abi'

const L2GatewayRouterAddress = '0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7'
export const sendWithdrawERC20Transaction = async (
  value: string,
  destination: string,
  signer: ethers.Signer
): Promise<TransactionRecord> => {
  try {
    const valueInWei = ethers.utils.parseEther(value)
    const routerContract = new ethers.Contract(L2GatewayRouterAddress, L2GatewayRouterABI, signer)

    const txRequest = await routerContract.populateTransaction.outboundTransfer(
      L1_NETWORK.g7TokenAddress,
      destination,
      valueInWei,
      '0x'
    )

    const txResponse = await signer.sendTransaction(txRequest)

    await txResponse.wait()

    return {
      type: 'WITHDRAWAL',
      amount: value,
      lowNetworkChainId: L1_NETWORK.chainId,
      highNetworkChainId: L2_NETWORK.chainId,
      highNetworkHash: txResponse.hash,
      highNetworkTimestamp: Date.now() / 1000,
      challengePeriod: 60 * 60
    }
  } catch (error) {
    console.error('Transaction failed:', error)
    throw error
  }
}

class GasEstimationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GasEstimationError'
  }
}

export const estimateWithdrawGasAndFee = async (
  value: string,
  from: string,
  destination: string,
  signerOrProvider: ethers.Signer | ethers.providers.Provider
): Promise<{ estimatedGas: ethers.BigNumber; gasPrice: ethers.BigNumber; estimatedFee: ethers.BigNumber }> => {
  try {
    if (!ethers.utils.isAddress(destination)) {
      throw new GasEstimationError('Invalid destination address')
    }

    if (!ethers.utils.isAddress(from)) {
      throw new GasEstimationError('Invalid sender address')
    }

    if (!value || isNaN(Number(value)) || Number(value) < 0) {
      throw new GasEstimationError('Invalid value: must be a non-negative number')
    }

    let valueInWei
    try {
      valueInWei = ethers.utils.parseEther(value)
    } catch (error) {
      throw new GasEstimationError('Invalid value format: must be a valid Ether amount')
    }

    const routerContract = new ethers.Contract(L2GatewayRouterAddress, L2GatewayRouterABI, signerOrProvider)
    const estimatedGas = await routerContract.estimateGas.outboundTransfer(
      L1_NETWORK.g7TokenAddress,
      destination,
      valueInWei,
      '0x',
      { from }
    )
    const gasPrice = await signerOrProvider.getGasPrice()
    const estimatedFee = estimatedGas.mul(gasPrice)

    return {
      estimatedGas,
      gasPrice,
      estimatedFee
    }
  } catch (error: any) {
    console.error('Gas and fee estimation failed:', error)
    throw new GasEstimationError('Gas and fee estimation failed: ' + error.message)
  }
}
