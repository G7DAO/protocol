import React from 'react'
import styles from './HistoryMobile.module.css'
import DepositMobile from '@/components/bridge/history/DepositMobile'
import Withdrawal from '@/components/bridge/history/Withdrawal'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useMessages } from '@/hooks/useL2ToL1MessageStatus'

interface HistoryMobileProps {}
const HistoryMobile: React.FC<HistoryMobileProps> = ({}) => {
  const { connectedAccount } = useBlockchainContext()
  const messages = useMessages(connectedAccount)

  return (
    <div className={styles.container}>
      {messages.data &&
        messages.data.map((tx) =>
          tx.type === 'DEPOSIT' ? <DepositMobile deposit={tx} /> : <Withdrawal withdrawal={tx} />
        )}
    </div>
  )
}

export default HistoryMobile
