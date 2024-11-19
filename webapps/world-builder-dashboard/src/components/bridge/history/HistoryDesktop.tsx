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

interface HistoryDesktopProps {}

const mergeTransactions = (apiData: TransactionRecord[], localData: TransactionRecord[]): TransactionRecord[] => {
  const combinedData = new Map<string, TransactionRecord>()

  localData.forEach((localTx) => {
    const hashKey = localTx.type === 'DEPOSIT' ? (localTx.lowNetworkHash ?? '') : (localTx.highNetworkHash ?? '')
    combinedData.set(hashKey, localTx)
  })

  // Merge API data, prioritizing latest withdrawal completionTimestamp
  apiData.forEach((apiTx) => {
    const hashKey = apiTx.type === 'DEPOSIT' ? (apiTx.lowNetworkHash ?? '') : (apiTx.highNetworkHash ?? '')
    const existingTx = combinedData.get(hashKey)

    if (existingTx) {
      if (apiTx.type === 'WITHDRAWAL' && !apiTx.completionTimestamp && existingTx.completionTimestamp) {
        combinedData.set(hashKey, existingTx)
      } 
    } else {
      combinedData.set(hashKey, apiTx)
    }
  })

  const combinedDataArray = Array.from(combinedData.values())
  return combinedDataArray
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
    challengePeriod: apiData.challengePeriod,
    tokenAddress: apiData.token
  }
}

const HistoryDesktop: React.FC<HistoryDesktopProps> = () => {
  const { connectedAccount, selectedNetworkType } = useBlockchainContext()
  const {data: messages} = useMessages(connectedAccount, selectedNetworkType)
  const { useHistoryTransactions } = useBridgeAPI()
  const { data: apiTransactions } = useHistoryTransactions(connectedAccount)
  const [mergedTransactions, setMergedTransactions] = useState<TransactionRecord[]>([])
  const headers = ['Type', 'Submitted', 'Token', 'From', 'To', 'Transaction', 'Status']

  // Merge transations only when API data is updated with new data
  useEffect(() => {
    const localTransactions = messages || []
    const formattedApiTransactions = apiTransactions ? apiTransactions.map(mapAPIDataToTransactionRecord) : []
    const combinedTransactions = mergeTransactions(formattedApiTransactions, localTransactions)

    // Retrieve existing transactions from localStorage
    const storedTransactionsString = localStorage.getItem(
      `bridge-${connectedAccount}-transactions-${selectedNetworkType}`
    )
    const storedTransactions = storedTransactionsString ? JSON.parse(storedTransactionsString) : []

    // Check if the combined transactions are different from those in localStorage
    if (
      combinedTransactions.length !== storedTransactions.length ||
      !combinedTransactions.every((tx, index) =>
        tx.type === 'DEPOSIT'
          ? tx.lowNetworkHash === storedTransactions[index]?.lowNetworkHash
          : tx.highNetworkHash === storedTransactions[index]?.highNetworkHash
      )
    ) {
      // Determine new transactions that aren’t in storedTransactions
      const newTransactions = combinedTransactions.filter(
        (newTx) =>
          !storedTransactions.some((storedTx: TransactionRecord) =>
            storedTx.type === 'DEPOSIT'
              ? storedTx.lowNetworkHash === newTx.lowNetworkHash
              : storedTx.highNetworkHash === newTx.highNetworkHash
          )
      )

      localStorage.setItem(
        `bridge-${connectedAccount}-transactions-${selectedNetworkType}`,
        JSON.stringify([...storedTransactions, ...newTransactions])
      )
    }
    setMergedTransactions(selectedNetworkType === "Testnet" ? combinedTransactions : localTransactions)
  }, [messages, apiTransactions])

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

                  return (yTimestamp ?? 0) - (xTimestamp ?? 0)
                })
                .map((tx: TransactionRecord, idx: number) =>
                  tx.type === 'WITHDRAWAL' ? (
                    <Withdrawal withdrawal={tx} key={idx} />
                  ) : (
                    <Fragment key={idx}>{tx.lowNetworkHash && <Deposit deposit={tx} />}</Fragment>
                  )
                )}
              {mergedTransactions.filter((tx: TransactionRecord) => tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL')
                .length === 0 && <div className={styles.noTransactions}> No transactions yet</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryDesktop
