import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ethers } from 'ethers'
import { Transaction } from 'ethers'
import { BridgeNotification } from '@/components/notifications/NotificationsButton'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { TransactionRecord } from '@/contexts/BlockchainContext'
import { BridgeTransferStatus } from 'game7-bridge-sdk'
import { getTokenSymbol } from '@/utils/web3utils'


export const getDecodedInputs = (tx: Transaction, ABI: any) => {
  //ABI:  ReadonlyArray<Fragment | JsonFragment | string> gives TS building error
  const contractInterface = new ethers.utils.Interface(ABI)
  return contractInterface.parseTransaction({
    data: tx.data,
    value: tx.value
  })
}

export interface TransactionType {
  txHash: string
  l2RPC: string
  l3RPC: string
}

const sortTransactions = (a: TransactionRecord, b: TransactionRecord) => {
  const getTimestamp = (tx: TransactionRecord) => {
    if (tx.type === 'WITHDRAWAL') {
      return tx.completionTimestamp ?? tx.claimableTimestamp ?? tx.highNetworkTimestamp ?? 0
    } else if (tx.type === 'DEPOSIT') {
      return tx.completionTimestamp ?? tx.lowNetworkTimestamp ?? 0
    }
    return 0
  }

  const isClaimableWithoutCompletion = (tx: TransactionRecord) => tx.claimableTimestamp && !tx.completionTimestamp

  if (isClaimableWithoutCompletion(a) && isClaimableWithoutCompletion(b)) {
    return (b.highNetworkTimestamp ?? 0) - (a.highNetworkTimestamp ?? 0)
  }

  if (isClaimableWithoutCompletion(a)) return -1
  if (isClaimableWithoutCompletion(b)) return 1

  return getTimestamp(b) - getTimestamp(a)
}

export const useMessages = (
  connectedAccount: string | undefined,
  networkType: string
): UseQueryResult<TransactionRecord[]> => {
  return useQuery(
    {
      queryKey: ['incomingMessages', connectedAccount, networkType],
      queryFn: () => {
        if (!connectedAccount) {
          return []
        }
        const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions-${networkType}`)
        if (transactionsString) {
          return JSON.parse(transactionsString).sort(sortTransactions)
        } else {
          return []
        }
      },
      enabled: !!networkType && !!connectedAccount
    }
  )
}

export const getNotifications = (transactions: TransactionRecord[]) => {
  const completedTransactions = transactions.filter((tx) =>
    tx.type === 'DEPOSIT' ?
      tx.status === BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED || tx.status === BridgeTransferStatus.DEPOSIT_GAS_DEPOSITED || tx.status === BridgeTransferStatus.CCTP_COMPLETE || tx.status === BridgeTransferStatus.CCTP_REDEEMED :
      tx.completionTimestamp || tx.claimableTimestamp
  )
  const notifications: BridgeNotification[] = completedTransactions
    .map((ct) => {
      let timestamp

      if (ct.type === 'DEPOSIT') {
        if (
          ct.status === BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED ||
          ct.status === BridgeTransferStatus.DEPOSIT_GAS_DEPOSITED ||
          ct.status === BridgeTransferStatus.CCTP_REDEEMED
        ) {
          timestamp = ct.highNetworkTimestamp ?? ct.completionTimestamp ?? Date.now() / 1000
        } else if (ct.status === BridgeTransferStatus.CCTP_COMPLETE) {
          timestamp = ct.claimableTimestamp ?? 0
        } else {
          timestamp = 17000000
        }
      } else if (ct.type === 'WITHDRAWAL') {
        if (ct.status === BridgeTransferStatus.CCTP_REDEEMED || ct.status === BridgeTransferStatus.WITHDRAW_EXECUTED) {
          timestamp = ct.lowNetworkTimestamp ?? ct.highNetworkTimestamp
        } else {
          timestamp = ct.claimableTimestamp ?? Date.now() / 1000
        }
      } else {
        timestamp = ct.completionTimestamp ?? Date.now() / 1000
      }
      const amount = ct.amount
      const symbol = getTokenSymbol(ct, '')
      return {
        status: ct.isFailed ? 'FAILED' : ct.completionTimestamp ? 'COMPLETED' : 'CLAIMABLE',
        type: ct.type,
        amount: amount,
        timestamp: timestamp ?? 0,
        to: (ct.type === 'WITHDRAWAL' ? ct.lowNetworkChainId : ct.highNetworkChainId) ?? 1,
        seen: !ct.newTransaction,
        symbol: symbol,
        tx: ct
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
  const { selectedNetworkType } = useBlockchainContext()
  return useQuery(
    {
      queryKey: ['notifications', connectedAccount, offset, limit, selectedNetworkType],
      queryFn: async () => {
        if (!connectedAccount) {
          return []
        }
        const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions-${selectedNetworkType}`)
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
      refetchInterval: 10 * 1000
    }
  )
}

export const usePendingTransactions = (connectedAccount: string | undefined): UseQueryResult<boolean> => {
  const { selectedNetworkType } = useBlockchainContext()
  return useQuery(
    {
      queryKey: ['pendingTransactions', connectedAccount],
      queryFn: async () => {
        if (!connectedAccount) {
          return false
        }
        const storageKey = `bridge-${connectedAccount}-transactions-${selectedNetworkType}`
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

          const updatedTransactions: TransactionRecord[] = []

          for (const t of transactions) {
            if (t.type === 'DEPOSIT') {
              if (t.status === BridgeTransferStatus.CCTP_COMPLETE) {
                updatedTransactions.push({ ...t, claimableTimestamp: t.claimableTimestamp })
              } else if (t.status === BridgeTransferStatus.DEPOSIT_GAS_PENDING || t.status === BridgeTransferStatus.CCTP_PENDING || t.status === BridgeTransferStatus.DEPOSIT_GAS_PENDING) {
                updatedTransactions.push({ ...t, completionTimestamp: t.completionTimestamp })
              }
            }
            if (t.type === 'WITHDRAWAL') {
              if (t.status === BridgeTransferStatus.WITHDRAW_CONFIRMED || t.status === BridgeTransferStatus.CCTP_COMPLETE) {
                updatedTransactions.push({ ...t, claimableTimestamp: t.claimableTimestamp })
              } else if (t.status === BridgeTransferStatus.CCTP_PENDING) {
                updatedTransactions.push({ ...t, highNetworkTimestamp: t.highNetworkTimestamp })
              } else if (t.status === BridgeTransferStatus.CCTP_REDEEMED) {
                updatedTransactions.push({ ...t, lowNetworkTimestamp: t.lowNetworkTimestamp })
              }
            }
          }

          if (updatedTransactions.length > 0) {
            const allTransactions = transactions.map((t) => {
              const updatedTransaction = updatedTransactions.find((ut) => ut.lowNetworkHash === t.lowNetworkHash && ut.highNetworkHash === t.highNetworkHash)
              return updatedTransaction ? updatedTransaction : t
            })
            const allTransactionsString = JSON.stringify(allTransactions)
            localStorage.setItem(storageKey, allTransactionsString)
            return true
          }
        } catch (e) {
          console.log(e)
        }
        return false
      },
      refetchInterval: 1 * 1000
    }
  )
}