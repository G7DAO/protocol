// External Libraries
import React, { Fragment } from 'react'

// Styles
import styles from './WithdrawTransactions.module.css'

// Absolute Imports
import Deposit from '@/components/bridge/history/Deposit'
import Withdrawal from '@/components/bridge/history/Withdrawal'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useMessages } from '@/hooks/useL2ToL1MessageStatus'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'

interface WithdrawTransactionsProps {}
const HistoryDesktop: React.FC<WithdrawTransactionsProps> = () => {
  const { connectedAccount } = useBlockchainContext()
  const messages = useMessages(connectedAccount)
  const headers = ['Type', 'Submitted', 'Token', 'From', 'To', 'Transaction', 'Status']

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {messages.data && (
          <div className={styles.transactions}>
            <div className={styles.withdrawsGrid}>
              {headers.map((h) => (
                <div className={styles.transactionsHeader} key={h}>
                  {h}
                </div>
              ))}
              {messages.data
                .filter((tx) => tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL')
                .map((tx: TransactionRecord, idx: number) =>
                  tx.type === 'WITHDRAWAL' ? (
                    <Withdrawal withdrawal={tx} key={idx} />
                  ) : (
                    <Fragment key={idx}>{tx.lowNetworkHash && <Deposit deposit={tx} />}</Fragment>
                  )
                )}
              {messages.data.filter((tx) => tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL').length === 0 && (
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
