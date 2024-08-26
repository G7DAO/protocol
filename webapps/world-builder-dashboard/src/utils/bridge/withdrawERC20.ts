import { L1_NETWORK, L2_NETWORK } from '../../../constants'
import { ethers } from 'ethers'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { L2GatewayRouterABI } from '@/web3/ABI/l2GatewayRouter_abi'

const L2GatewayRouterAddress = '0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7'
export const sendWithdrawERC20Transaction = async (
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

    const routerContract = new ethers.Contract(L2GatewayRouterAddress, L2GatewayRouterABI, signer)

    const txRequest = await routerContract.populateTransaction.outboundTransfer(
      L1_NETWORK.g7TokenAddress,
      destination,
      amountInWei,
      '0x'
    )

    const txResponse = await signer.sendTransaction(txRequest)

    // Wait for the transaction to be mined
    await txResponse.wait()

    return {
      type: 'WITHDRAWAL',
      amount: amountInNative,
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
