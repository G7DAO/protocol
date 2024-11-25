import { useQueries, useQuery, UseQueryResult } from 'react-query'
import { getHighNetworks, getLowNetworks, L2_NETWORK } from '../../constants'
import { ethers, providers } from 'ethers'
import { Transaction } from 'ethers'
import { BridgeNotification } from '@/components/notifications/NotificationsButton'
import { NetworkType, useBlockchainContext } from '@/contexts/BlockchainContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import {
  ParentTransactionReceipt,
  ChildToParentMessageReader,
  ChildToParentMessageStatus,
  ChildTransactionReceipt
} from '@arbitrum/sdk'
import { ParentContractCallTransactionReceipt } from '@arbitrum/sdk/dist/lib/message/ParentTransaction'

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
  status?: ChildToParentMessageStatus
  l2Receipt?: ChildTransactionReceipt
}

const fetchL2ToL1MessageStatus = async (withdrawal: TransactionRecord, selectedNetworkType: NetworkType) => {
  const { lowNetworkChainId, highNetworkChainId, highNetworkHash, amount, highNetworkTimestamp } = withdrawal

  const lowNetwork = getLowNetworks(selectedNetworkType)?.find((n) => n.chainId === lowNetworkChainId)
  const highNetwork = getHighNetworks(selectedNetworkType)?.find((n) => n.chainId === highNetworkChainId)
  if (!highNetwork || !lowNetwork || !highNetworkHash) {
    return undefined
  }

  const l3Provider = new providers.JsonRpcProvider(highNetwork.rpcs[0])
  const l2Provider = new providers.JsonRpcProvider(lowNetwork.rpcs[0])

  const receipt = await l3Provider.getTransactionReceipt(highNetworkHash)
  const l2Receipt = new ChildTransactionReceipt(receipt)
  const messages: ChildToParentMessageReader[] = (await l2Receipt.getChildToParentMessages(
    l2Provider
  )) as ChildToParentMessageReader[]
  const l2ToL1Msg: ChildToParentMessageReader = messages[0]
  const status: ChildToParentMessageStatus = await l2ToL1Msg.status(l3Provider)

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

export const useL2ToL1MessageStatus = (withdrawal: TransactionRecord, selectedNetworkType: NetworkType) => {
  return useQuery(['withdrawalStatus', withdrawal], () => fetchL2ToL1MessageStatus(withdrawal, selectedNetworkType), {
    refetchInterval: 60 * 1000
  })
}

export const getDecodedInputs = (tx: Transaction, ABI: any) => {
  //ABI:  ReadonlyArray<Fragment | JsonFragment | string> gives TS building error
  const contractInterface = new ethers.utils.Interface(ABI)
  return contractInterface.parseTransaction({
    data: tx.data,
    value: tx.value
  })
}

// const getDepositTransferType = (tx: Transaction) => {
//   if (tx.to === networks[this.destinationNetworkChainId]?.ethBridge?.inbox) {
//     try {
//       const decodedInputs = getDecodedInputs(tx, INBOX_ABI)
//       return { transferType: BridgeTransferType.DEPOSIT_GAS, decodedInputs }
//     } catch (_) {
//       try {
//         const decodedInputs = getDecodedInputs(tx, ERC20_INBOX_ABI)
//         return { transferType: BridgeTransferType.DEPOSIT_ERC20_TO_GAS, decodedInputs }
//       } catch (_) {
//         throw new Error(`Unable to decode inputs - unknown method of inbox contract ${tx.to}`)
//       }
//     }
//   } else if (tx.to === networks[this.destinationNetworkChainId]?.tokenBridge?.parentGatewayRouter) {
//     const decodedInputs = getDecodedInputs(tx, L1GatewayRouterABI)
//     return { transferType: BridgeTransferType.DEPOSIT_ERC20, decodedInputs }
//   }
//   throw new Error(`Unable to decode inputs - ${tx.to} is unknown contract`)
// }

const fetchDepositStatus = async (deposit: TransactionRecord, selectedNetworkType: NetworkType) => {
  const { lowNetworkChainId, highNetworkChainId, lowNetworkHash, lowNetworkTimestamp } = deposit
  if (lowNetworkChainId === L2_NETWORK.chainId) {
    return {
      l2Result: { complete: true },
      highNetworkTimestamp: lowNetworkTimestamp
    }
  }

  const lowNetwork = getLowNetworks(selectedNetworkType)?.find((n) => n.chainId === lowNetworkChainId)
  const highNetwork = getHighNetworks(selectedNetworkType)?.find((n) => n.chainId === highNetworkChainId)

  if (!lowNetwork || !lowNetworkHash) {
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

  const l1Receipt = new ParentTransactionReceipt(receipt)
  const l1ContractCallReceipt = new ParentContractCallTransactionReceipt(l1Receipt)

  if (!highNetwork) {
    return { l1Receipt }
  }

  const l2Provider = new providers.JsonRpcProvider(highNetwork.rpcs[0])
  let l2Result

  try {
    l2Result = await l1ContractCallReceipt.waitForChildTransactionReceipt(l2Provider, l1Receipt.confirmations, 1)
  } catch (e) {
    console.error('Error waiting for child transaction receipt:', { deposit, e })
  }

  if (!l2Result) {
    return { l1Receipt }
  }

  const retryableCreationReceipt = await l2Result.message.getRetryableCreationReceipt()
  let highNetworkTimestamp
  if (retryableCreationReceipt) {
    const block = await l2Provider.getBlock(retryableCreationReceipt.blockNumber)
    highNetworkTimestamp = block.timestamp
  }

  return { l1Receipt, l2Result, highNetworkTimestamp }
}

export const useDepositStatus = (deposit: TransactionRecord, selectedNetworkType: NetworkType) => {
  return useQuery(['depositStatus', deposit], () => fetchDepositStatus(deposit, selectedNetworkType), {
    refetchInterval: 60000 * 3,
    staleTime: 2 * 60 * 1000
  })
}

export interface TransactionType {
  txHash: string
  l2RPC: string
  l3RPC: string
}

export const useL2ToL1MessagesStatus = (transactions: TransactionType[] | undefined) => {
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
        const l2Receipt = new ChildTransactionReceipt(receipt)
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

        const messages: ChildToParentMessageReader[] = (await l2Receipt.getChildToParentMessages(
          l2Provider
        )) as ChildToParentMessageReader[]
        const l2ToL1Msg: ChildToParentMessageReader = messages[0]
        const status: ChildToParentMessageStatus = await l2ToL1Msg.status(l3Provider)

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
    ['incomingMessages', connectedAccount, networkType],
    () => {
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
    {
      enabled: !!networkType && !!connectedAccount
    }
  )
}

export const getNotifications = (transactions: TransactionRecord[]) => {
  const completedTransactions = transactions.filter((tx) => tx.completionTimestamp || tx.claimableTimestamp)
  const notifications: BridgeNotification[] = completedTransactions
    .map((ct) => {
      const timestamp = ct.completionTimestamp ?? ct.claimableTimestamp ?? Date.now() / 1000 //
      return {
        status: ct.isFailed ? 'FAILED' : ct.completionTimestamp ? 'COMPLETED' : 'CLAIMABLE',
        type: ct.type,
        timestamp,
        amount: ct.amount,
        to: (ct.type === 'WITHDRAWAL' ? ct.lowNetworkChainId : ct.highNetworkChainId) ?? 1, //TODO remove null assertion
        seen: !ct.newTransaction,
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
    ['notifications', connectedAccount, offset, limit, selectedNetworkType],
    async () => {
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
    {
      refetchInterval: 10 * 1000
    }
  )
}

export const usePendingTransactions = (connectedAccount: string | undefined): UseQueryResult<boolean> => {
  const { selectedNetworkType } = useBlockchainContext()
  return useQuery(
    ['pendingTransactions', connectedAccount],
    async () => {
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
        const pendingTransactions: TransactionRecord[] = transactions.filter(
          (t: { completionTimestamp: number }) => !t.completionTimestamp
        )
        const completedTransactions = transactions.filter((t: { completionTimestamp: number }) => t.completionTimestamp)
        const newCompletedTransactions: TransactionRecord[] = []
        for (const t of transactions) {
          if (t.type === 'DEPOSIT') {
            const status = await fetchDepositStatus(t as TransactionRecord, selectedNetworkType)
            if (status?.highNetworkTimestamp) {
              newCompletedTransactions.push({
                ...t,
                completionTimestamp: status.highNetworkTimestamp,
                newTransaction: true
              })
            }
          }
          if (t.type === 'WITHDRAWAL') {
            const status = await fetchL2ToL1MessageStatus(t as TransactionRecord, selectedNetworkType)
            if (status?.status === ChildToParentMessageStatus.CONFIRMED) {
              if (!t.claimableTimestamp) {
                newCompletedTransactions.push({ ...t, claimableTimestamp: Date.now() / 1000, newTransaction: true })
              }
            }
            if (status?.status === ChildToParentMessageStatus.EXECUTED) {
              newCompletedTransactions.push({ ...t, completionTimestamp: Date.now() / 1000, newTransaction: true })
            }
          }
        }
        if (newCompletedTransactions.length > 0) {
          const newPendingTransactions = pendingTransactions.filter(
            (pt) =>
              !newCompletedTransactions.some((ct) => {
                return ct.lowNetworkHash === pt.lowNetworkHash && ct.highNetworkHash === pt.highNetworkHash
              })
          )
          const allTransactions = [...completedTransactions, ...newCompletedTransactions, ...newPendingTransactions]
          const allTransactionsString = JSON.stringify(allTransactions)
          localStorage.setItem(storageKey, allTransactionsString)
          return true
        }
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
