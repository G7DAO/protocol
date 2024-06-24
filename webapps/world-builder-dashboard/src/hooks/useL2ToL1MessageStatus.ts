import { useQuery, useQueries, UseQueryResult } from 'react-query'
import { ethers } from 'ethers'
import { L3_NETWORKS } from '@/components/bridge/l3Networks'
import { L2ToL1MessageReader, L2ToL1MessageStatus, L2TransactionReceipt } from '@arbitrum/sdk'

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

const useL2ToL1MessageStatus = (txHash: string, l2RPC: string, l3RPC: string) => {
  return useQuery(
    ['withdrawalStatus', txHash, l2RPC, l3RPC],
    async () => {
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
    {
      refetchInterval: 60000 * 3
    }
  )
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

const getL3NetworkRPC = (chainId: number) => {
  const network = L3_NETWORKS.find((n) => n.chainInfo.chainId === chainId)
  return network?.chainInfo.rpcs[0]
}

export const useMessages = (
  connectedAccount: string | undefined,
  l2Chain: { rpcs: string[] }
): UseQueryResult<Transaction[]> => {
  return useQuery(['incomingMessages', connectedAccount], () => {
    if (!connectedAccount) {
      return []
    }
    const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
    if (transactionsString) {
      return JSON.parse(transactionsString)
        .slice(-7)
        .map((tx: any) => ({
          ...tx,
          l2RPC: l2Chain.rpcs[0],
          l3RPC: getL3NetworkRPC(tx.chainId) ?? ''
        }))
        .reverse()
    } else {
      return []
    }
  })
}

export default useL2ToL1MessageStatus
