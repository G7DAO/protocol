import React from 'react'
import styles from './HistoryMobile.module.css'
import DepositMobile from '@/components/bridge/history/DepositMobile'
import Withdrawal from '@/components/bridge/history/Withdrawal'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useMessages } from '@/hooks/useL2ToL1MessageStatus'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'

interface HistoryMobileProps {}
const HistoryMobile: React.FC<HistoryMobileProps> = ({}) => {
  const { connectedAccount } = useBlockchainContext()
  const messages = useMessages(connectedAccount)

  return (
    <div className={styles.container}>
      {messages.data &&
        messages.data.map((tx: TransactionRecord, idx: number) =>
          tx.type === 'DEPOSIT' ? <DepositMobile deposit={tx} key={idx} /> : <Withdrawal withdrawal={tx} key={idx} />
        )}
    </div>
  )
}

export default HistoryMobile
