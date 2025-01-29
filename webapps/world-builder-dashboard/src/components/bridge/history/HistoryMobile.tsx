import React, { Fragment, useEffect } from 'react'
import Deposit from './Deposit'
import styles from './HistoryMobile.module.css'
import Withdrawal from '@/components/bridge/history/Withdrawal'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'


interface HistoryMobileProps {
  transactions: TransactionRecord[]
  containerRef: React.RefObject<HTMLDivElement>
}


const HistoryMobile: React.FC<HistoryMobileProps> = ({ transactions, containerRef }) => {

  useEffect(() => {
    const scrollToTop = () => {
      if (containerRef.current) {
        console.log('going up the scrolltop')
        containerRef.current.scrollTop = 0
      }
    }

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(scrollToTop, 0)

    return () => clearTimeout(timeoutId)
  }, [transactions])

  const allTransactionComponents = transactions.map((tx: TransactionRecord, idx: number) => (
    tx.type === 'WITHDRAWAL' ? (
      <Withdrawal withdrawal={tx} key={idx} />
    ) : (
      <Fragment key={idx}>
        {tx.lowNetworkHash && <Deposit deposit={tx} />}
      </Fragment>
    )
  ))


  return (
    <div className={styles.container} ref={containerRef}>
      {allTransactionComponents.length !== 0 && allTransactionComponents}
    </div>
  )
}

export default HistoryMobile
