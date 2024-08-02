import { ethers, providers, utils } from 'ethers'
import { HighNetworkInterface, NetworkInterface } from '@/contexts/BlockchainContext'
import { convertToBigNumber } from '@/utils/web3utils'
import { NodeInterface__factory } from '@arbitrum/sdk/dist/lib/abi/factories/NodeInterface__factory'
import { NODE_INTERFACE_ADDRESS } from '@arbitrum/sdk/dist/lib/dataEntities/constants'

// const L2_RPC = 'https://sepolia-rollup.arbitrum.io/rpc'
// const l2Provider = new providers.JsonRpcProvider(L2_RPC)

const L1_GATEWAY_ROUTER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_token',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_maxGas',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_gasPriceBid',
        type: 'uint256'
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes'
      }
    ],
    name: 'outboundTransfer',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_token',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_refundTo',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_maxGas',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_gasPriceBid',
        type: 'uint256'
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes'
      }
    ],
    name: 'outboundTransferCustomRefund',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  }
]

const generateRandomNumber = () => {
  const baseNumber = 0.000027234234347654
  const baseString = baseNumber.toString()
  const [integerPart, fractionalPart] = baseString.split('.')

  const firstTwoDigits = fractionalPart.slice(0, 2)
  const randomFractionalDigits = Array.from({ length: fractionalPart.length - 2 }, () =>
    Math.floor(Math.random() * 10)
  ).join('')

  return parseFloat(`${integerPart}.${firstTwoDigits}${randomFractionalDigits}`)
}

export const estimateDepositFee = async (
  amount: string,
  account: string,
  lowNetwork: NetworkInterface,
  highNetwork: HighNetworkInterface
) => {
  const destinationAddress = highNetwork.l1GatewayRouter ?? ''

  const ethAmount = convertToBigNumber(amount)
  const l2Provider = new providers.JsonRpcProvider(lowNetwork.rpcs[0])
  const L1GatewatyContract = new ethers.Contract(highNetwork.l1GatewayRouter ?? '', L1_GATEWAY_ROUTER_ABI, l2Provider)
  const tx = await L1GatewatyContract.populateTransaction.outboundTransfer(
    lowNetwork.g7TokenAddress,
    account,
    ethAmount,
    0,
    0,
    '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000'
  )
  const data = tx.data

  const nodeInterface = NodeInterface__factory.connect(NODE_INTERFACE_ADDRESS, l2Provider)
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
  return String(generateRandomNumber())
}

const estimateDepositERC20Gas = async (
  amount: string,
  account: string,
  lowNetwork: NetworkInterface,
  highNetwork: HighNetworkInterface
) => {
  const destinationAddress = highNetwork.l1GatewayRouter ?? ''

  const ethAmount = convertToBigNumber(amount)
  const lowNetworkProvider = new providers.JsonRpcProvider(lowNetwork.rpcs[0])
  const L1GatewatyContract = new ethers.Contract(
    highNetwork.l1GatewayRouter ?? '',
    L1_GATEWAY_ROUTER_ABI,
    lowNetworkProvider
  )
  const tx = await L1GatewatyContract.populateTransaction.outboundTransfer(
    lowNetwork.g7TokenAddress,
    account,
    ethAmount,
    0,
    0,
    '0x'
  )
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

  return ethers.BigNumber.from('0x093d2d') //fallback for zero price (P);
}

export const sendDepositERC20Transaction = async (
  amount: string,
  account: string,
  lowNetwork: NetworkInterface,
  highNetwork: HighNetworkInterface,
  lowNetworkProvider: ethers.providers.Web3Provider
) => {
  const ethAmount = convertToBigNumber(amount)
  // const l2Provider = new providers.JsonRpcProvider(lowNetwork.rpcs[0])
  const L1GatewatyContract = new ethers.Contract(
    highNetwork.l1GatewayRouter ?? '',
    L1_GATEWAY_ROUTER_ABI,
    lowNetworkProvider
  )
  const gasEstimate = await estimateDepositERC20Gas(amount, account, lowNetwork, highNetwork)
  const txRequest = await L1GatewatyContract.populateTransaction.outboundTransfer(
    lowNetwork.g7TokenAddress,
    account,
    ethAmount,
    0,
    0,
    '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000',
    { gasLimit: gasEstimate }
  )

  const txResponse = await lowNetworkProvider.getSigner(account).sendTransaction(txRequest)

  // Wait for the transaction to be mined
  return await txResponse.wait()
}
