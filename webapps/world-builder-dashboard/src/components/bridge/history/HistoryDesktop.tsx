// External Libraries
import React, { Fragment, useEffect, useState, useRef } from 'react'
// Styles
import styles from './WithdrawTransactions.module.css'
// Absolute Imports
import Deposit from '@/components/bridge/history/Deposit'
import Withdrawal from '@/components/bridge/history/Withdrawal'
import { useBlockchainContext, TransactionRecord } from '@/contexts/BlockchainContext'
import SpyMode from "@/components/bridge/history/SpyMode";
import { useTransactionContext } from '@/contexts/TransactionsContext'

interface HistoryDesktopProps {
  transactions: TransactionRecord[]
}

const HistoryDesktop: React.FC<HistoryDesktopProps> = ({
  transactions
}) => {
  const { selectedNetworkType } = useBlockchainContext()
  const { isSpyMode, setIsSpyMode, setSpyAddress, fetchNextPage } = useTransactionContext()
  const [visibleCount, setVisibleCount] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  const headers = ['Type', 'Submitted', 'Token', 'From', 'To', 'Transaction', 'Status', '']
  const transactionsRef = useRef<HTMLDivElement | null>(null)


  const allTransactionComponents = transactions.map((tx, idx) => (
    tx.type === 'WITHDRAWAL' ? (
      <Withdrawal withdrawal={tx} key={idx} />
    ) : (
      <Fragment key={idx}>
        {tx.lowNetworkHash && <Deposit deposit={tx} />}
      </Fragment>
    )
  ))

  const loadMoreItems = async () => {
    if (isLoading) return
    // If we're about to show all current transactions
    if (visibleCount + 5 >= transactions.length) {
      setIsLoading(true)
      await fetchNextPage()
      setIsLoading(false)
    }
    // Always increase visible count regardless of fetch
    setVisibleCount(prev => Math.min(prev + 5, transactions.length))
  }

  useEffect(() => {
    const checkAndLoadMore = () => {
      if (transactionsRef.current) {
        const { scrollHeight, clientHeight } = transactionsRef.current
        if (scrollHeight - clientHeight < 100 && !isLoading) {
          loadMoreItems()
        }
      }
    }

    const handleScroll = () => {
      if (transactionsRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = transactionsRef.current
        // If we're close to the bottom (within 100px)
        if (scrollHeight - (scrollTop + clientHeight) < 100 && !isLoading) { 
          loadMoreItems()
        }
      }
    }

    // Check immediately when component mounts or updates
    checkAndLoadMore()

    const currentRef = transactionsRef.current
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll)
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll)
      }
    }
  }, [visibleCount, transactions, isLoading])

  return (
    <div className={styles.container}>
      <SpyMode isSpyMode={isSpyMode} setIsSpyMode={setIsSpyMode} onSpyAddress={setSpyAddress} networkType={selectedNetworkType} />
      <div className={styles.content}>
        {allTransactionComponents && (
          <div className={styles.transactions}>
            <div className={styles.withdrawsGrid} ref={transactionsRef}>
              {headers.map((h) => (
                <div
                  className={h !== '' ? styles.transactionsHeader : styles.transactionsHeaderEmpty}
                  key={h}
                >
                  {h}
                </div>
              ))}
              {allTransactionComponents.length !== 0 && allTransactionComponents.slice(0, visibleCount)}
              {allTransactionComponents.length === 0 && (
                <div className={styles.noTransactions}>No transactions yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryDesktop
