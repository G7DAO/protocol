import { useQueries, useQuery, UseQueryResult } from 'react-query'
import { HIGH_NETWORKS, L2_NETWORK, LOW_NETWORKS } from '../../constants'
import { ethers, providers } from 'ethers'
import { BridgeNotification } from '@/components/bridge/NotificationsButton'
import { DepositRecord } from '@/components/bridge/depositERC20ArbitrumSDK'
import { WithdrawRecord } from '@/components/bridge/withdrawNativeToken'
import { L1TransactionReceipt, L2ToL1MessageReader, L2ToL1MessageStatus, L2TransactionReceipt } from '@arbitrum/sdk'
import { L1ContractCallTransactionReceipt } from '@arbitrum/sdk/dist/lib/message/L1Transaction'

const eventABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'caller', type: 'address' },
      { indexed: true, internalType: 'address', name: 'destination', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'hash', type: 'uint256' },
      { indexed: true, internalType: 'uint256', name: 'position', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'arbBlockNum', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'ethBlockNum', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'callvalue', type: 'uint256' },
      { indexed: false, internalType: 'bytes', name: 'data', type: 'bytes' }
    ],
    name: 'L2ToL1Tx',
    type: 'event'
  }
]

export interface L2ToL1MessageStatusResult {
  from?: string
  to?: string
  value?: string
  timestamp?: number
  confirmations?: number
  status?: L2ToL1MessageStatus
  l2Receipt?: L2TransactionReceipt
}

const fetchL2ToL1MessageStatus = async (withdrawal: WithdrawRecord) => {
  const { lowNetworkChainId, highNetworkChainId, highNetworkHash, amount, highNetworkTimestamp } = withdrawal
  console.log(withdrawal)

  const lowNetwork = LOW_NETWORKS.find((n) => n.chainId === lowNetworkChainId)
  const highNetwork = HIGH_NETWORKS.find((n) => n.chainId === highNetworkChainId)
  if (!highNetwork || !lowNetwork) {
    return undefined
  }

  const l3Provider = new providers.JsonRpcProvider(highNetwork.rpcs[0])
  const l2Provider = new providers.JsonRpcProvider(lowNetwork.rpcs[0])

  const receipt = await l3Provider.getTransactionReceipt(highNetworkHash)
  const l2Receipt = new L2TransactionReceipt(receipt)
  const messages: L2ToL1MessageReader[] = (await l2Receipt.getL2ToL1Messages(l2Provider)) as L2ToL1MessageReader[]
  const l2ToL1Msg: L2ToL1MessageReader = messages[0]
  const status: L2ToL1MessageStatus = await l2ToL1Msg.status(l3Provider)

  return {
    status,
    from: highNetwork.displayName,
    to: lowNetwork.displayName,
    timestamp: highNetworkTimestamp,
    lowNetworkTimeStamp: withdrawal.completionTimestamp,
    amount,
    l2Receipt
  }
}

export const useL2ToL1MessageStatus = (withdrawal: WithdrawRecord) => {
  return useQuery(['withdrawalStatus', withdrawal], () => fetchL2ToL1MessageStatus(withdrawal), {
    refetchInterval: 60 * 1000
  })
}

const fetchDepositStatus = async (deposit: DepositRecord) => {
  const { lowNetworkChainId, highNetworkChainId, lowNetworkHash, lowNetworkTimestamp } = deposit

  if (lowNetworkChainId === L2_NETWORK.chainId) {
    return {
      l2Result: { complete: true },
      highNetworkTimestamp: lowNetworkTimestamp
    }
  }

  const lowNetwork = LOW_NETWORKS.find((n) => n.chainId === lowNetworkChainId)
  const highNetwork = HIGH_NETWORKS.find((n) => n.chainId === highNetworkChainId)

  if (!lowNetwork) {
    return undefined
  }

  const l1Provider = new providers.JsonRpcProvider(lowNetwork.rpcs[0])
  let receipt
  try {
    receipt = await l1Provider.getTransactionReceipt(lowNetworkHash)
  } catch (e) {
    console.log(e)
  }

  if (!receipt) {
    return
  }

  const l1Receipt = new L1TransactionReceipt(receipt)
  const l1ContractCallReceipt = new L1ContractCallTransactionReceipt(l1Receipt)

  if (!highNetwork) {
    return { l1Receipt }
  }

  const l2Provider = new providers.JsonRpcProvider(highNetwork.rpcs[0])
  let l2Result
  try {
    l2Result = await l1ContractCallReceipt.waitForL2(l2Provider, 3, 1000)
  } catch (e) {
    console.log(e)
  }

  if (!l2Result) {
    return { l1Receipt }
  }

  console.log('to return', deposit.amount)
  const retryableCreationReceipt = await l2Result.message.getRetryableCreationReceipt()
  let highNetworkTimestamp
  if (retryableCreationReceipt) {
    const block = await l2Provider.getBlock(retryableCreationReceipt.blockNumber)
    highNetworkTimestamp = block.timestamp
  }

  return { l1Receipt, l2Result, highNetworkTimestamp }
}

export const useDepositStatus = (deposit: DepositRecord) => {
  return useQuery(['depositStatus', deposit], () => fetchDepositStatus(deposit), {
    refetchInterval: 60000 * 3
  })
}

export interface Transaction {
  txHash: string
  l2RPC: string
  l3RPC: string
}

export const useL2ToL1MessagesStatus = (transactions: Transaction[] | undefined) => {
  if (!transactions) {
    return useQueries([{ queryKey: ['withdrawalStatusEmpty'], queryFn: () => undefined }])
  }
  return useQueries(
    transactions.map(({ txHash, l2RPC, l3RPC }) => ({
      queryKey: ['withdrawalStatus', txHash, l2RPC, l3RPC],
      queryFn: async () => {
        const l3Provider = new ethers.providers.JsonRpcProvider(l3RPC)
        const l2Provider = new ethers.providers.JsonRpcProvider(l2RPC)
        const receipt = await l3Provider.getTransactionReceipt(txHash)
        const l2Receipt = new L2TransactionReceipt(receipt)
        const log = receipt.logs.find((l) => l.data !== '0x')
        let decodedLog

        if (log) {
          try {
            const iface = new ethers.utils.Interface(eventABI)
            decodedLog = iface.parseLog(log)
          } catch (e) {
            console.log(log, e)
          }
        }

        const messages: L2ToL1MessageReader[] = (await l2Receipt.getL2ToL1Messages(l2Provider)) as L2ToL1MessageReader[]
        const l2ToL1Msg: L2ToL1MessageReader = messages[0]
        const status: L2ToL1MessageStatus = await l2ToL1Msg.status(l3Provider)

        return {
          from: decodedLog?.args?.caller,
          to: decodedLog?.args?.destination,
          value: ethers.utils.formatEther(decodedLog?.args?.callvalue ?? '0'),
          timestamp: decodedLog?.args?.timestamp,
          confirmations: receipt.confirmations,
          status,
          l2Receipt
        }
      },
      refetchInterval: 60000 * 3
    }))
  )
}

export const useMessages = (connectedAccount: string | undefined): UseQueryResult<Transaction[]> => {
  return useQuery(['incomingMessages', connectedAccount], () => {
    if (!connectedAccount) {
      return []
    }
    const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
    if (transactionsString) {
      return JSON.parse(transactionsString).slice(-9).reverse()
    } else {
      return []
    }
  })
}

export const getNotifications = (transactions: any[]) => {
  const completedTransactions = transactions.filter(
    (t: { completionTimestamp: number; claimableTimestamp: number }) => t.completionTimestamp || t.claimableTimestamp
  )
  const notifications: BridgeNotification[] = completedTransactions
    .map((ct) => {
      return {
        status: ct.failed ? 'FAILED' : ct.completionTimestamp ? 'COMPLETED' : 'CLAIMABLE',
        type: ct.isDeposit ? 'DEPOSIT' : 'WITHDRAWAL',
        timestamp: ct.completionTimestamp ?? ct.claimableTimestamp,
        amount: ct.amount,
        to: ct.isDeposit ? ct.highNetworkChainId : ct.lowNetworkChainId,
        seen: !ct.newTransaction
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp)
  return notifications
}

export const useNotifications = (
  connectedAccount: string | undefined,
  offset: number,
  limit: number
): UseQueryResult<BridgeNotification[]> => {
  return useQuery(
    ['notifications', connectedAccount, offset, limit],
    async () => {
      if (!connectedAccount) {
        return []
      }
      const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
      // console.log(transactionsString)
      let transactions
      if (!transactionsString) {
        return []
      }
      try {
        transactions = JSON.parse(transactionsString)
        if (!Array.isArray(transactions)) {
          return []
        }
        return getNotifications(transactions)
      } catch (e) {
        console.log(e)
        return []
      }
    },
    {
      refetchInterval: 10 * 1000
    }
  )
}

export const usePendingTransactions = (connectedAccount: string | undefined): UseQueryResult<boolean> => {
  return useQuery(
    ['pendingTransactions', connectedAccount],
    async () => {
      if (!connectedAccount) {
        return false
      }
      const storageKey = `bridge-${connectedAccount}-transactions`
      const transactionsString = localStorage.getItem(storageKey)
      let transactions
      if (!transactionsString) {
        return false
      }
      try {
        transactions = JSON.parse(transactionsString)
        if (!Array.isArray(transactions)) {
          return false
        }
        const pendingTransactions = transactions.filter((t: { completionTimestamp: number }) => !t.completionTimestamp)
        const completedTransactions = transactions.filter((t: { completionTimestamp: number }) => t.completionTimestamp)
        console.log(pendingTransactions, completedTransactions)
        const newCompletedTransactions: any[] = []
        for (const t of pendingTransactions) {
          if (t.isDeposit) {
            const status = await fetchDepositStatus(t as DepositRecord)
            if (status?.highNetworkTimestamp) {
              newCompletedTransactions.push({
                ...t,
                completionTimestamp: status.highNetworkTimestamp,
                newTransaction: true
              })
            }
          } else {
            const status = await fetchL2ToL1MessageStatus(t as WithdrawRecord)
            if (status?.status === L2ToL1MessageStatus.CONFIRMED) {
              if (!t.claimableTimestamp) {
                newCompletedTransactions.push({ ...t, claimableTimestamp: Date.now() / 1000, newTransaction: true })
              }
            }
            if (status?.status === L2ToL1MessageStatus.EXECUTED) {
              newCompletedTransactions.push({ ...t, completionTimestamp: Date.now() / 1000, newTransaction: true })
            }
          }
        }
        if (newCompletedTransactions.length > 0) {
          const newPendingTransactions = pendingTransactions.filter(
            (pt) =>
              !newCompletedTransactions.some((ct) => {
                console.log(ct.highNetworkHash === pt.highNetworkHash, ct.lowNetworkHash === pt.lowNetworkHash)
                return ct.lowNetworkHash === pt.lowNetworkHash && ct.highNetworkHash === pt.highNetworkHash
              })
          )
          console.log('---', pendingTransactions, newPendingTransactions)
          const allTransactions = [...completedTransactions, ...newCompletedTransactions, ...newPendingTransactions]
          const allTransactionsString = JSON.stringify(allTransactions)
          localStorage.setItem(storageKey, allTransactionsString)
          return true
        }
        console.log(pendingTransactions, newCompletedTransactions)
      } catch (e) {
        console.log(e)
      }
      return false
    },
    {
      refetchInterval: 120 * 1000
    }
  )
}

export default useL2ToL1MessageStatus
