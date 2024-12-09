import React, { useEffect, useState } from 'react'
import Deposit from './Deposit'
import styles from './HistoryMobile.module.css'
import { ethers } from 'ethers'
import Withdrawal from '@/components/bridge/history/Withdrawal'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeAPI } from '@/hooks/useBridgeAPI'
import { useMessages } from '@/hooks/useL2ToL1MessageStatus'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'

interface HistoryMobileProps {}

const mergeTransactions = (localData: TransactionRecord[], apiData: TransactionRecord[]): TransactionRecord[] => {
  const combinedData = new Map<string, TransactionRecord>()

  localData.forEach((tx) =>
    combinedData.set(tx.type === 'DEPOSIT' ? (tx.lowNetworkHash ?? '') : (tx.highNetworkHash ?? ''), tx)
  )
  apiData.forEach((tx) =>
    combinedData.set(tx.type === 'DEPOSIT' ? (tx.lowNetworkHash ?? '') : (tx.highNetworkHash ?? ''), tx)
  )
  return Array.from(combinedData.values())
}

const mapAPIDataToTransactionRecord = (apiData: any): TransactionRecord => {
  const amountFormatted = apiData?.amount ? ethers.utils.formatEther(apiData.amount) : '0.0'
  return {
    type: apiData.type,
    amount: amountFormatted,
    lowNetworkChainId: apiData.parentNetworkChainId,
    highNetworkChainId: apiData.childNetworkChainId,
    lowNetworkHash: apiData.parentNetworkHash,
    highNetworkHash: apiData.childNetworkHash,
    lowNetworkTimestamp: apiData.parentNetworkTimestamp,
    highNetworkTimestamp: apiData.childNetworkTimestamp,
    completionTimestamp: apiData.completionTimestamp,
    claimableTimestamp: apiData.claimableTimestamp,
    challengePeriod: apiData.challengePeriod,
    tokenAddress: apiData.token
  }
}
const HistoryMobile: React.FC<HistoryMobileProps> = ({}) => {
  const { connectedAccount, selectedNetworkType } = useBlockchainContext()
  const messages = useMessages(connectedAccount, selectedNetworkType || 'Testnet')
  const { useHistoryTransactions } = useBridgeAPI()
  const { data: apiTransactions } = useHistoryTransactions(connectedAccount)
  const [mergedTransactions, setMergedTransactions] = useState<TransactionRecord[]>([])

  useEffect(() => {
    const localTransactions = messages.data || []
    const formattedApiTransactions = apiTransactions ? apiTransactions.map(mapAPIDataToTransactionRecord) : []
    const combinedTransactions = mergeTransactions(formattedApiTransactions, localTransactions)
    setMergedTransactions(combinedTransactions)
  }, [messages.data, apiTransactions])

  return (
    <div className={styles.container}>
      {mergedTransactions &&
        mergedTransactions
          .sort((x: TransactionRecord, y: TransactionRecord) => {
            const xTimestamp = x.type === 'DEPOSIT' ? x.lowNetworkTimestamp : x.highNetworkTimestamp
            const yTimestamp = y.type === 'DEPOSIT' ? y.lowNetworkTimestamp : y.highNetworkTimestamp

            return (yTimestamp ?? 0) - (xTimestamp ?? 0)
          })
          .map((tx: TransactionRecord, idx: number) =>
            tx.type === 'DEPOSIT' ? <Deposit deposit={tx} key={idx} /> : <Withdrawal withdrawal={tx} key={idx} />
          )}
    </div>
  )
}

export default HistoryMobile
