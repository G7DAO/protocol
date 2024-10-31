import { useQuery } from 'react-query'
import { BridgeTransfer } from 'game7-bridge-sdk'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'

interface UseTransferDataProps {
  txRecord: TransactionRecord
}

const useTransferData = ({ txRecord }: UseTransferDataProps) => {
  const { connectedAccount } = useBlockchainContext()
  return useQuery(
    ['transferData', txRecord],
    async () => {
      if (!txRecord) {
        return { ETA: 0, status: 0 }
      }

      const _bridgeTransfer = new BridgeTransfer({
        txHash: (txRecord.type === 'DEPOSIT' ? txRecord.lowNetworkHash : txRecord.highNetworkHash) ?? '',
        destinationNetworkChainId:
          (txRecord.type === 'DEPOSIT' ? txRecord.highNetworkChainId : txRecord.lowNetworkChainId) ?? 0,
        originNetworkChainId:
          (txRecord.type === 'DEPOSIT' ? txRecord.lowNetworkChainId : txRecord.highNetworkChainId) ?? 0
      })
      const status = await _bridgeTransfer.getStatus()
      
      const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
      const transactions = transactionsString ? JSON.parse(transactionsString) : []

      const newTransactions: TransactionRecord[] = transactions.map((t: TransactionRecord) => {
        const hashComparison: boolean =
          txRecord.type === 'DEPOSIT'
            ? t.lowNetworkHash === txRecord.lowNetworkHash
            : t.highNetworkHash === txRecord.highNetworkHash

        if (hashComparison) {
          return { ...t, status: status?.status }
        }
        return { ...t }
      })
      localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(newTransactions))
      return status
    },
    {
      initialData: () => {
        const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
        if (transactionsString) {
          const transactions = JSON.parse(transactionsString)
          const cachedTransaction = transactions.find((t: TransactionRecord) =>
            txRecord.type === 'DEPOSIT'
              ? t.lowNetworkHash === txRecord.lowNetworkHash
              : t.highNetworkHash === txRecord.highNetworkHash
          )
          return cachedTransaction?.status ? { status: cachedTransaction.status } : { ETA: 0, status: 0 }
        }
        return { ETA: 0, status: 0 }
      },
      refetchInterval: 50000,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: !!txRecord
    }
  )
}

export default useTransferData
