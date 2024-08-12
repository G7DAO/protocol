import { ethers, providers, utils } from 'ethers'
import { HighNetworkInterface, NetworkInterface } from '@/contexts/BlockchainContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { convertToBigNumber } from '@/utils/web3utils'
import { ERC20_INBOX_ABI } from '@/web3/ABI/erc20_inbox_abi'
import { NodeInterface__factory } from '@arbitrum/sdk/dist/lib/abi/factories/NodeInterface__factory'
import { NODE_INTERFACE_ADDRESS } from '@arbitrum/sdk/dist/lib/dataEntities/constants'
import { Signer } from '@ethersproject/abstract-signer'

const estimateGasComponents = async (
  amount: string,
  account: string,
  lowNetwork: NetworkInterface,
  highNetwork: HighNetworkInterface
) => {
  if (!highNetwork.inbox) {
    console.log('inbox contract is undefined')
    return
  }

  const destinationAddress = highNetwork.inbox
  const ethAmount = convertToBigNumber(amount)
  const lowNetworkProvider = new providers.JsonRpcProvider(lowNetwork.rpcs[0])

  const ERC20InboxContract = new ethers.Contract(highNetwork.inbox, ERC20_INBOX_ABI, lowNetworkProvider)
  const tx = await ERC20InboxContract.populateTransaction.depositERC20(ethAmount)
  const data = tx.data

  if (data) {
    const nodeInterface = NodeInterface__factory.connect(NODE_INTERFACE_ADDRESS, lowNetworkProvider)
    try {
      return await nodeInterface.callStatic.gasEstimateComponents(destinationAddress, false, data, {
        from: account
      })
    } catch (e: any) {
      console.log("Can't estimate gas: ", e.message)
    }
  }
}

export const calculateGasValues = (gasEstimateComponents: any) => {
  const l1GasEstimated = gasEstimateComponents.gasEstimateForL1
  const l2GasUsed = gasEstimateComponents.gasEstimate.sub(gasEstimateComponents.gasEstimateForL1)
  const l2EstimatedPrice = gasEstimateComponents.baseFee
  const l1EstimatedPrice = gasEstimateComponents.l1BaseFeeEstimate.mul(16)

  const l1Cost = l1GasEstimated.mul(l2EstimatedPrice)
  const l1Size = l1Cost.div(l1EstimatedPrice)

  const P = l2EstimatedPrice
  const L2G = l2GasUsed
  const L1P = l1EstimatedPrice
  const L1S = l1Size

  const L1C = L1P.mul(L1S)
  const B = L1C.div(P)
  const G = L2G.add(B)
  return { TXFEES: P.mul(G), gasLimit: G, L2G, l2EstimatedPrice, G }
}

export const estimateDepositERC20ToNativeFee = async (
  amount: string,
  account: string,
  lowNetwork: NetworkInterface,
  highNetwork: HighNetworkInterface
) => {
  const gasEstimateComponents = await estimateGasComponents(amount, account, lowNetwork, highNetwork)
  if (gasEstimateComponents) {
    const { TXFEES } = calculateGasValues(gasEstimateComponents)
    return utils.formatEther(TXFEES)
  }
}

export const estimateDepositERC20ToNativeGas = async (
  amount: string,
  account: string,
  lowNetwork: NetworkInterface,
  highNetwork: HighNetworkInterface
) => {
  const gasEstimateComponents = await estimateGasComponents(amount, account, lowNetwork, highNetwork)
  if (gasEstimateComponents) {
    const { gasLimit } = calculateGasValues(gasEstimateComponents)
    return gasLimit
  }
}

export const sendDepositERC20ToNativeTransaction = async (
  lowNetwork: NetworkInterface,
  highNetwork: HighNetworkInterface,
  amount: string,
  l2Signer: Signer,
  account: string
): Promise<TransactionRecord> => {
  const destinationAddress = highNetwork.inbox
  const ethAmount = convertToBigNumber(amount)
  const ERC20InboxContract = new ethers.Contract(destinationAddress, ERC20_INBOX_ABI, l2Signer)
  const gasEstimate = await estimateDepositERC20ToNativeGas(amount, account, lowNetwork, highNetwork)

  const txRequest = await ERC20InboxContract.populateTransaction.depositERC20(ethAmount, {
    gasLimit: gasEstimate
  })

  const txResponse = await l2Signer.sendTransaction(txRequest)

  // Wait for the transaction to be mined
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
