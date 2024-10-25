import { MAX_ALLOWANCE_ACCOUNT } from '../../../constants'
import { ethers, providers } from 'ethers'
import { NetworkInterface } from '@/contexts/BlockchainContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { calculateGasValues } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { convertToBigNumber } from '@/utils/web3utils'
import { ERC20_INBOX_ABI } from '@/web3/ABI/erc20_inbox_abi'
import { NodeInterface__factory } from '@arbitrum/sdk/dist/lib/abi/factories/NodeInterface__factory'
import { NODE_INTERFACE_ADDRESS } from '@arbitrum/sdk/dist/lib/dataEntities/constants'
import { Signer } from '@ethersproject/abstract-signer'

const MIN_GAS_LIMIT = ethers.BigNumber.from(300000)

const estimateGasComponents = async (
  account: string,
  network: NetworkInterface,
  destinationAddress: string,
  data: string
) => {
  const provider = new providers.JsonRpcProvider(network.rpcs[0])
  if (data) {
    const nodeInterface = NodeInterface__factory.connect(NODE_INTERFACE_ADDRESS, provider)
    try {
      return await nodeInterface.callStatic.gasEstimateComponents(destinationAddress, false, data, {
        from: account
      })
    } catch (e: any) {
      console.log("Can't estimate gas: ", e.message)
    }
  }
}

export const estimateCreateRetryableTicketFee = async (
  _account: string,
  network: NetworkInterface,
  destinationAddress: string,
  data: string
) => {
  let account = _account
  if (!_account) {
    account = MAX_ALLOWANCE_ACCOUNT
  }
  const gasEstimateComponents = await estimateGasComponents(account, network, destinationAddress, data)
  if (gasEstimateComponents) {
    const { TXFEES, G } = calculateGasValues(gasEstimateComponents)
    const gasLimit = G.add(G).lt(MIN_GAS_LIMIT) ? MIN_GAS_LIMIT : G.add(G) //adding 100% buffer
    const maxFeePerGas = TXFEES.div(G)

    return { gasLimit, maxFeePerGas }
  }
}

export const sendL2ToL3Message = async (
  lowNetwork: NetworkInterface,
  highNetwork: NetworkInterface,
  amount: string,
  l2Signer: Signer,
  account: string,
  callAddress: string,
  callData: string,
  _feeEstimation: { gasLimit: ethers.BigNumber; maxFeePerGas: ethers.BigNumber } | undefined
): Promise<TransactionRecord> => {
  const destinationAddress = highNetwork.inbox
  if (!destinationAddress) {
    throw new Error('inbox contract address is undefined')
  }
  const ethAmount = convertToBigNumber(amount)
  const ERC20InboxContract = new ethers.Contract(destinationAddress, ERC20_INBOX_ABI, l2Signer)

  const feeEstimation =
    _feeEstimation ?? (await estimateCreateRetryableTicketFee(account, lowNetwork, callAddress, callData))
  if (!feeEstimation) {
    throw new Error('sendL2->L3MessageError: fee estimation error')
  }
  const { gasLimit, maxFeePerGas } = feeEstimation

  const to = callAddress
  const l2CallValue = ethAmount
  const maxSubmissionCost = 0
  const excessFeeRefundAddress = account
  const callValueRefundAddress = account
  const tokenTotalFeeAmount = maxFeePerGas.mul(gasLimit).add(l2CallValue)
  const txResponse = await ERC20InboxContract.createRetryableTicket(
    to,
    l2CallValue,
    maxSubmissionCost,
    excessFeeRefundAddress,
    callValueRefundAddress,
    gasLimit,
    maxFeePerGas,
    tokenTotalFeeAmount,
    callData
  )
  await txResponse.wait()
  return {
    type: 'DEPOSIT',
    amount,
    lowNetworkChainId: lowNetwork.chainId,
    highNetworkChainId: highNetwork.chainId,
    lowNetworkHash: txResponse.hash,
    lowNetworkTimestamp: Date.now() / 1000,
    completionTimestamp: Date.now() / 1000,
    newTransaction: true
  }
}
