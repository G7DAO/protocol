// External Libraries
import React, { Fragment, useEffect, useState } from 'react'
// Styles
import styles from './WithdrawTransactions.module.css'
import { ethers } from 'ethers'
// Absolute Imports
import Deposit from '@/components/bridge/history/Deposit'
import Withdrawal from '@/components/bridge/history/Withdrawal'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeAPI } from '@/hooks/useBridgeAPI'
import { useMessages } from '@/hooks/useL2ToL1MessageStatus'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'

interface WithdrawTransactionsProps {}

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

// Maps API data to the TransactionRecord format
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
    challengePeriod: apiData.challengePeriod
  }
}

const HistoryDesktop: React.FC<WithdrawTransactionsProps> = () => {
  const { connectedAccount } = useBlockchainContext()
  const messages = useMessages(connectedAccount)
  const { useHistoryTransactions } = useBridgeAPI()
  const { data: apiTransactions } = useHistoryTransactions(connectedAccount)
  const [mergedTransactions, setMergedTransactions] = useState<TransactionRecord[]>([])
  const headers = ['Type', 'Submitted', 'Token', 'From', 'To', 'Transaction', 'Status']
  const formattedApiTransactions = apiTransactions ? apiTransactions.map(mapAPIDataToTransactionRecord) : []

  // Merge transactions only when API data is updated with new data
  useEffect(() => {
    const localTransactions = messages.data || []
    const formattedApiTransactions = apiTransactions ? apiTransactions.map(mapAPIDataToTransactionRecord) : []
    const combinedTransactions = mergeTransactions(formattedApiTransactions, localTransactions)
    console.log(formattedApiTransactions)
    console.log(messages.data)
    setMergedTransactions(combinedTransactions)
  }, [messages.data, apiTransactions])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {mergedTransactions && (
          <div className={styles.transactions}>
            <div className={styles.withdrawsGrid}>
              {headers.map((h) => (
                <div className={styles.transactionsHeader} key={h}>
                  {h}
                </div>
              ))}
              {mergedTransactions
                .sort((x: TransactionRecord, y: TransactionRecord) => {
                  const xTimestamp = x.type === 'DEPOSIT' ? x.lowNetworkTimestamp : x.highNetworkTimestamp
                  const yTimestamp = y.type === 'DEPOSIT' ? y.lowNetworkTimestamp : y.highNetworkTimestamp

                  return yTimestamp - xTimestamp
                })
                .map((tx: TransactionRecord, idx: number) =>
                  tx.type === 'WITHDRAWAL' ? (
                    <Withdrawal withdrawal={tx} key={idx} />
                  ) : (
                    <Fragment key={idx}>{tx.lowNetworkHash && <Deposit deposit={tx} />}</Fragment>
                  )
                )}
              {formattedApiTransactions.filter((tx) => tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL').length === 0 && (
                <div className={styles.noTransactions}> No transactions yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryDesktop
