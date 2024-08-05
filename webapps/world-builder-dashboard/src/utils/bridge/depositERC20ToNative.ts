import { ethers, providers, utils } from 'ethers'
import { HighNetworkInterface, NetworkInterface } from '@/contexts/BlockchainContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { convertToBigNumber } from '@/utils/web3utils'
import { NodeInterface__factory } from '@arbitrum/sdk/dist/lib/abi/factories/NodeInterface__factory'
import { NODE_INTERFACE_ADDRESS } from '@arbitrum/sdk/dist/lib/dataEntities/constants'
import { Signer } from '@ethersproject/abstract-signer'

const ERC20_INBOX_ABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'depositERC20',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

export const estimateDepositERC20ToNativeFee = async (
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
  const lowNetworkProvider = new providers.JsonRpcProvider(lowNetwork.rpcs[0])

  const ethAmount = convertToBigNumber(amount)
  const ERC20InboxContract = new ethers.Contract(highNetwork.inbox, ERC20_INBOX_ABI, lowNetworkProvider)
  const tx = await ERC20InboxContract.populateTransaction.depositERC20(ethAmount)
  const data = tx.data

  const nodeInterface = NodeInterface__factory.connect(NODE_INTERFACE_ADDRESS, lowNetworkProvider)

  if (data) {
    try {
      const gasEstimateComponents = await nodeInterface.callStatic.gasEstimateComponents(
        destinationAddress,
        false,
        data,
        {
          from: account
        }
      )
      // Getting useful values for calculating the formula
      const l1GasEstimated = gasEstimateComponents.gasEstimateForL1
      const l2GasUsed = gasEstimateComponents.gasEstimate.sub(gasEstimateComponents.gasEstimateForL1)
      const l2EstimatedPrice = gasEstimateComponents.baseFee
      const l1EstimatedPrice = gasEstimateComponents.l1BaseFeeEstimate.mul(16)

      // Calculating some extra values to be able to apply all variables of the formula
      // -------------------------------------------------------------------------------
      // NOTE: This one might be a bit confusing, but l1GasEstimated (B in the formula) is calculated based on l2 gas fees
      const l1Cost = l1GasEstimated.mul(l2EstimatedPrice)
      // NOTE: This is similar to 140 + utils.hexDataLength(txData);
      const l1Size = l1Cost.div(l1EstimatedPrice)

      // Getting the result of the formula
      // ---------------------------------
      // Setting the basic variables of the formula
      const P = l2EstimatedPrice
      const L2G = l2GasUsed
      const L1P = l1EstimatedPrice
      const L1S = l1Size

      // L1C (L1 Cost) = L1P * L1S
      const L1C = L1P.mul(L1S)

      // B (Extra Buffer) = L1C / P
      const B = L1C.div(P)

      // G (Gas Limit) = L2G + B
      const G = L2G.add(B)

      // TXFEES (Transaction fees) = P * G
      const TXFEES = P.mul(G)

      return utils.formatEther(TXFEES)
    } catch (e: any) {
      console.log("Can't estimate gas: ", e.message)
    }
  }
}

const estimateDepositERC20ToNativeGas = async (
  amount: string,
  account: string,
  lowNetwork: NetworkInterface,
  highNetwork: HighNetworkInterface
) => {
  const destinationAddress = highNetwork.inbox

  const ethAmount = convertToBigNumber(amount)
  const lowNetworkProvider = new providers.JsonRpcProvider(lowNetwork.rpcs[0])

  const ERC20InboxContract = new ethers.Contract(highNetwork.inbox, ERC20_INBOX_ABI, lowNetworkProvider)
  const tx = await ERC20InboxContract.populateTransaction.depositERC20(ethAmount)
  const data = tx.data
  const nodeInterface = NodeInterface__factory.connect(NODE_INTERFACE_ADDRESS, lowNetworkProvider)
  if (data) {
    try {
      const gasEstimateComponents = await nodeInterface.callStatic.gasEstimateComponents(
        destinationAddress,
        false,
        data,
        {
          from: account
        }
      )
      // Getting useful values for calculating the formula
      const l1GasEstimated = gasEstimateComponents.gasEstimateForL1
      const l2GasUsed = gasEstimateComponents.gasEstimate.sub(gasEstimateComponents.gasEstimateForL1)
      const l2EstimatedPrice = gasEstimateComponents.baseFee
      const l1EstimatedPrice = gasEstimateComponents.l1BaseFeeEstimate.mul(16)

      // Calculating some extra values to be able to apply all variables of the formula
      // -------------------------------------------------------------------------------
      // NOTE: This one might be a bit confusing, but l1GasEstimated (B in the formula) is calculated based on l2 gas fees
      const l1Cost = l1GasEstimated.mul(l2EstimatedPrice)
      // NOTE: This is similar to 140 + utils.hexDataLength(txData);
      const l1Size = l1Cost.div(l1EstimatedPrice)

      // Getting the result of the formula
      // ---------------------------------
      // Setting the basic variables of the formula
      const P = l2EstimatedPrice
      const L2G = l2GasUsed
      const L1P = l1EstimatedPrice
      const L1S = l1Size

      // L1C (L1 Cost) = L1P * L1S
      const L1C = L1P.mul(L1S)

      // B (Extra Buffer) = L1C / P
      const B = L1C.div(P)

      // G (Gas Limit) = L2G + B
      return L2G.add(B)
    } catch (e: any) {
      console.log("Can't estimate gas: ", e.message)
    }
  }

  // return ethers.BigNumber.from('0x346d32') //fallback for zero price (P);
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
