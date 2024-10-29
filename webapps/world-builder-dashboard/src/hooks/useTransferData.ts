import { useQuery } from 'react-query'
import { BridgeTransfer } from 'game7-bridge-sdk'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'

interface UseTransferDataProps {
  txRecord: TransactionRecord
}

const useTransferData = ({ txRecord }: UseTransferDataProps) => {
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
      return status
    },
    {
      refetchInterval: 50000,
      enabled: !!txRecord
    }
  )
}

export default useTransferData
