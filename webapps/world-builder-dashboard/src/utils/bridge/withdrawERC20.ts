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
