import { providers } from 'ethers'
import { NetworkInterface } from '@/contexts/BlockchainContext'
import { convertToBigNumber } from '@/utils/web3utils'
import { Erc20Bridger, getL2Network } from '@arbitrum/sdk'
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
}

export const depositERC20ArbitrumSDK = async (
  lowNetwork: NetworkInterface,
  highNetwork: NetworkInterface,
  amount: string,
  l1Signer: Signer
): Promise<TransactionRecord> => {
  const l2Provider = new providers.JsonRpcProvider(highNetwork.rpcs[0])

  const l2Network = await getL2Network(l2Provider)
  const erc20Bridger = new Erc20Bridger(l2Network)

  const l1Erc20Address = lowNetwork.g7TokenAddress

  const tokenDepositAmount = convertToBigNumber(amount)

  const depositTx = await erc20Bridger.deposit({
    amount: tokenDepositAmount,
    erc20L1Address: l1Erc20Address,
    l1Signer,
    l2Provider: l2Provider
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