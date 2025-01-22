// External Libraries
import React, { Fragment, useEffect, useState, useRef } from 'react'
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
import SpyMode from "@/components/bridge/history/SpyMode";

interface HistoryDesktopProps { }

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
      } else if (apiTx.type === 'WITHDRAWAL' && apiTx.completionTimestamp && !existingTx.completionTimestamp) {
        combinedData.set(hashKey, apiTx)
      } else if (apiTx.type === 'DEPOSIT' && !apiTx.symbol && existingTx.symbol) {
        combinedData.set(hashKey, existingTx)
      } else if (apiTx.type === 'DEPOSIT' && !apiTx.symbol && existingTx.symbol) {
        combinedData.set(hashKey, apiTx)
      }
    } else {
      combinedData.set(hashKey, apiTx)
    }
  })
  const combinedDataArray = Array.from(combinedData.values())
  return combinedDataArray
}

// Maps API data to the TransactionRecord format
const apiDataToTransactionRecord = (apiData: any): TransactionRecord => {
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
    tokenAddress: apiData.token,
    symbol: apiData.symbol,
    isCCTP: apiData.isCctp
  }
}

const HistoryDesktop: React.FC<HistoryDesktopProps> = () => {
  const { connectedAccount, selectedNetworkType } = useBlockchainContext()
  const [isSpyMode, setIsSpyMode] = useState(false)
  const [spyAddress, setSpyAddress] = useState('')
  const { data: messages } = useMessages(isSpyMode ? spyAddress : connectedAccount, selectedNetworkType || 'Testnet')
  const { useHistoryTransactions } = useBridgeAPI()
  const { data: apiTransactions } = useHistoryTransactions(isSpyMode ? spyAddress : connectedAccount)
  const [visibleTransactions, setVisibleTransactions] = useState<TransactionRecord[]>([])
  const [mergedTransactions, setMergedTransactions] = useState<TransactionRecord[]>([])
  const headers = ['Type', 'Submitted', 'Token', 'From', 'To', 'Transaction', 'Status', '']
  const transactionsRef = useRef<HTMLDivElement | null>(null)

  // Merge transations only when API data is updated with new data
  useEffect(() => {
    const localTransactions = messages || []
    const formattedApiTransactions = apiTransactions ? apiTransactions.map(apiDataToTransactionRecord) : []
    const combinedTransactions = mergeTransactions(formattedApiTransactions, localTransactions)

    // Check if the combined transactions are different from those in localStorage
    if (
      combinedTransactions.length !== localTransactions.length ||
      !combinedTransactions.every((tx, index) =>
        tx.type === 'DEPOSIT'
          ? tx.lowNetworkHash === localTransactions[index]?.lowNetworkHash
          : tx.highNetworkHash === localTransactions[index]?.highNetworkHash
      )
    ) {
      // Determine new transactions that aren’t in storedTransactions
      const newTransactions = combinedTransactions.filter(
        (newTx) =>
          !localTransactions.some((storedTx: TransactionRecord) =>
            storedTx.type === 'DEPOSIT'
              ? storedTx.lowNetworkHash === newTx.lowNetworkHash
              : storedTx.highNetworkHash === newTx.highNetworkHash
          )
      )

      localStorage.setItem(
        `bridge-${isSpyMode ? spyAddress : connectedAccount}-transactions-${selectedNetworkType}`,
        JSON.stringify([...localTransactions, ...newTransactions])
      )
    }
    // sort first
    combinedTransactions.sort((x: TransactionRecord, y: TransactionRecord) => {
      const xTimestamp = x.type === 'DEPOSIT' ? x.lowNetworkTimestamp : x.highNetworkTimestamp
      const yTimestamp = y.type === 'DEPOSIT' ? y.lowNetworkTimestamp : y.highNetworkTimestamp

      return (yTimestamp ?? 0) - (xTimestamp ?? 0)
    })
    setMergedTransactions(combinedTransactions)
    setVisibleTransactions(combinedTransactions.slice(0, 10))
  }, [messages, apiTransactions])

  const loadMoreItems = () => {
    setVisibleTransactions((prev) => {
      const nextItems = mergedTransactions.slice(prev.length, prev.length + 5)
      return [...prev, ...nextItems]
    })
  }

  useEffect(() => {
    const handleScroll = () => {
      if (transactionsRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = transactionsRef.current
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          loadMoreItems()
        }
      }
    }

    const currentRef = transactionsRef.current
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll)
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll)
      }
    }
  }, [visibleTransactions])

  return (
    <div className={styles.container}>
      <SpyMode isSpyMode={isSpyMode} setIsSpyMode={setIsSpyMode} onSpyAddress={setSpyAddress} />
      <div className={styles.content}>
        {visibleTransactions && (
          <div className={styles.transactions}>
            <div className={styles.withdrawsGrid} ref={transactionsRef}>
              {headers.map((h) => (
                <div className={h !== '' ? styles.transactionsHeader : styles.transactionsHeaderEmpty} key={h}>
                  {h}
                </div>
              ))}
              {visibleTransactions
                .map((tx: TransactionRecord, idx: number) =>
                  tx.type === 'WITHDRAWAL' ? (
                    <Withdrawal withdrawal={tx} key={idx} />
                  ) : (
                    <Fragment key={idx}>{tx.lowNetworkHash && <Deposit deposit={tx} />}</Fragment>
                  )
                )}
              {visibleTransactions.filter((tx: TransactionRecord) => tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL').length === 0 && <div className={styles.noTransactions}> No transactions yet</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryDesktop
