// External Libraries
import React, { Fragment, useEffect, useState, useRef } from 'react'
// Styles
import styles from './WithdrawTransactions.module.css'
// Absolute Imports
import Deposit from '@/components/bridge/history/Deposit'
import Withdrawal from '@/components/bridge/history/Withdrawal'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeAPI } from '@/hooks/useBridgeAPI'
import { useMessages } from '@/hooks/useL2ToL1MessageStatus'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import SpyMode from "@/components/bridge/history/SpyMode";
import LinearRenderer from './LinearRenderer'
import { useTransactionContext } from '@/contexts/TransactionsContext'
interface HistoryDesktopProps { transactions: TransactionRecord[] }

const HistoryDesktop: React.FC<HistoryDesktopProps> = ({ transactions }) => {
  const { connectedAccount, selectedNetworkType } = useBlockchainContext()
  const [isSpyMode, setIsSpyMode] = useState(false)
  const [spyAddress, setSpyAddress] = useState('')
  const [visibleCount, setVisibleCount] = useState(10)
  console.log(visibleCount)

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

  const loadMoreItems = () => {
    setVisibleCount(prev => Math.min(prev + 5, transactions.length))
  }


  // const loadMoreItems = () => {
  //   setVisibleTransactions((prev) => {
  //     const nextItems = transactions.slice(prev.length, prev.length + 5)
  //     return [...prev, ...nextItems]
  //   })
  // }

  useEffect(() => {
    const handleScroll = () => {
      if (transactionsRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = transactionsRef.current
        if (scrollTop + clientHeight >= scrollHeight) {
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
  }, [visibleCount, transactions])

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
              {allTransactionComponents.slice(0, visibleCount)}
              {allTransactionComponents.filter((tx) => tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL').length === 0 && (
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
