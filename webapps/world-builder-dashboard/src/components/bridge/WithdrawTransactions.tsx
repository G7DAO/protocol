import React from 'react'
import { L2_NETWORK } from '../../../constants'
import styles from './WithdrawTransactions.module.css'
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import Deposit from '@/components/bridge/Deposit'
import Withdrawal from '@/components/bridge/Withdrawal'
import { useMessages } from '@/hooks/useL2ToL1MessageStatus'

interface WithdrawTransactionsProps {}
const WithdrawTransactions: React.FC<WithdrawTransactionsProps> = () => {
  const { connectedAccount } = useBlockchainContext()
  const messages = useMessages(connectedAccount, L2_NETWORK)

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
                .reverse()
                .map((tx: any, idx: number) =>
                  !tx.isDeposit ? (
                    <Withdrawal withdrawal={tx} key={idx} />
                  ) : (
                    <>{tx.lowNetworkHash && <Deposit deposit={tx} key={idx} />}</>
                  )
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WithdrawTransactions
