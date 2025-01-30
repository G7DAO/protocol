import { ethers, providers } from 'ethers'
import { BridgeTransferInfo } from 'game7-bridge-sdk'
import { NetworkInterface } from '@/contexts/BlockchainContext'
import { convertToBigNumber } from '@/utils/web3utils'
import { L2GatewayRouterABI } from '@/web3/ABI/l2GatewayRouter_abi'
import { Erc20Bridger, getArbitrumNetwork } from '@arbitrum/sdk'
import { Signer } from '@ethersproject/abstract-signer'

export interface DepositRecord {
  amount: string
  lowNetworkChainId: number
  highNetworkChainId: number
  lowNetworkHash: string
  lowNetworkTimestamp: number
  lowNetworkBlockNumber?: number
  highNetworkBlockNumber?: number
  highNetworkTimestamp?: number
  complete?: boolean
  retryableCreationTimeout: number //seconds
}

export interface TransactionRecord {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'CLAIM'
  amount: string
  lowNetworkChainId?: number
  lowNetworkHash?: string
  lowNetworkTimestamp?: number
  lowNetworkBlockNumber?: number
  highNetworkChainId?: number
  highNetworkHash?: string
  highNetworkBlockNumber?: number
  highNetworkTimestamp?: number
  complete?: boolean
  retryableCreationTimeout?: number //seconds
  challengePeriod?: number //seconds
  completionTimestamp?: number
  claimableTimestamp?: number
  newTransaction?: boolean
  isFailed?: boolean
  symbol?: string
  status?: number
  ETA?: number
  tokenAddress?: string
  destinationTokenAddress?: string
  transactionInputs?: BridgeTransferInfo
  isCCTP?: boolean
  address?: string
}

export const depositERC20ArbitrumSDK = async (
  lowNetwork: NetworkInterface,
  highNetwork: NetworkInterface,
  amount: string,
  l1Signer: Signer
): Promise<TransactionRecord> => {
  const l2Provider = new providers.JsonRpcProvider(highNetwork.rpcs[0])

  const l2Network = await getArbitrumNetwork(l2Provider)
  const erc20Bridger = new Erc20Bridger(l2Network)

  const l1Erc20Address = lowNetwork.g7TokenAddress

  const tokenDepositAmount = convertToBigNumber(amount)

  const depositTx = await erc20Bridger.deposit({
    amount: tokenDepositAmount,
    erc20ParentAddress: l1Erc20Address,
    parentSigner: l1Signer,
    childProvider: l2Provider
  })

  return {
    type: 'DEPOSIT',
    amount,
    lowNetworkChainId: lowNetwork.chainId,
    highNetworkChainId: highNetwork.chainId,
    lowNetworkHash: depositTx.hash,
    lowNetworkTimestamp: Date.now() / 1000,
    retryableCreationTimeout: 15 * 60
  }
}

export const estimateOutboundTransferGas = async (
  contractAddress: string,
  _l1Token: string,
  _to: string,
  _amount: ethers.BigNumberish,
  _data: string | ethers.BytesLike,
  provider: ethers.providers.Provider
) => {
  const contract = new ethers.Contract(contractAddress, L2GatewayRouterABI, provider)

  try {
    const estimatedGas = await contract.estimateGas.outboundTransfer(_l1Token, _to, _amount, _data, {
      value: ethers.utils.parseEther('0') // Adjust if the function requires ETH
    })
    const multiplier = ethers.BigNumber.from('10')
    const gasLimit = estimatedGas.mul(multiplier)
    const gasPrice = await provider.getGasPrice()
    const fee = gasLimit.mul(gasPrice)
    return {
      estimatedGas: ethers.utils.formatUnits(estimatedGas, 18),
      gasLimit: ethers.utils.formatUnits(gasLimit, 18),
      gasPrice,
      fee: ethers.utils.formatEther(fee)
    }
  } catch (error) {
    console.error('Error estimating gas:', error)
    throw error
  }
}
