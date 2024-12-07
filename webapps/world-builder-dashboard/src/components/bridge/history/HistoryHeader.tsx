import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './HistoryHeader.module.css'
import { Icon } from 'summon-ui'
import { L2ToL1MessageStatusResult } from '@/hooks/useL2ToL1MessageStatus'
import { ChildToParentMessageStatus } from '@arbitrum/sdk'

interface HistoryHeaderProps {
  messages: (L2ToL1MessageStatusResult | undefined)[] | undefined
}

const numberOfUnconfirmed = (messages: (L2ToL1MessageStatusResult | undefined)[]) => {
  if (!messages) return 0
  return messages.filter((m) => m?.status === ChildToParentMessageStatus.UNCONFIRMED).length
}
const numberOfConfirmed = (messages: (L2ToL1MessageStatusResult | undefined)[]) => {
  if (!messages) return 0
  return messages.filter((m) => m?.status === ChildToParentMessageStatus.CONFIRMED).length
}
const HistoryHeader: React.FC<HistoryHeaderProps> = ({ messages }) => {
  const navigate = useNavigate()
  return (
    <div onClick={() => navigate('/bridge/transactions')}>
      {(!messages ||
        !messages.some(
          (m) => m?.status === ChildToParentMessageStatus.UNCONFIRMED || m?.status === ChildToParentMessageStatus.CONFIRMED
        )) && (
        <div className={styles.container}>
          <Icon className={styles.defaultIcon} name={'File06'} />
          <div className={styles.default}>See transaction history</div>
          <Icon className={styles.defaultIcon} name={'ArrowNarrowRight'} />
        </div>
      )}
      {messages && messages.some((m) => m?.status === ChildToParentMessageStatus.CONFIRMED) && (
        <div className={styles.claimable}>
          <Icon name={'AlertTriangle'} color={'#F79009'} />
          <div className={styles.claimableCaption}>
            {`You must claim `}
            <span
              style={{ fontWeight: 600 }}
            >{`${numberOfConfirmed(messages)} transaction${numberOfConfirmed(messages) === 1 ? '' : 's'}`}</span>
          </div>
          <Icon name={'ArrowNarrowRight'} color={'#B54708'} />
        </div>
      )}
      {messages &&
        messages.some((m) => m?.status === ChildToParentMessageStatus.UNCONFIRMED) &&
        !messages.some((m) => m?.status === ChildToParentMessageStatus.CONFIRMED) && (
          <div className={styles.pending}>
            <Icon name={'SwitchHorizontal01'} color={'#4E5BA6'} />
            <div className={styles.claimableCaption}>
              {`You have `}
              <span
                style={{ fontWeight: 600 }}
              >{`${numberOfUnconfirmed(messages)} pending transaction${numberOfUnconfirmed(messages) === 1 ? '' : 's'}`}</span>
            </div>
            <Icon name={'ArrowNarrowRight'} color={'#363F72'} />
          </div>
        )}
    </div>
  )
}

export default HistoryHeader
