import React, { useEffect } from 'react'
import { L3_NATIVE_TOKEN_SYMBOL } from '../../../constants'
import styles from './NotificationsDropModal.module.css'
import { BridgeNotification } from '@/components/bridge/NotificationsButton'
import { timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl, getNetwork } from '@/utils/web3utils'

interface NotificationsDropModalProps {
  notifications: BridgeNotification[]
}
const NotificationsDropModal: React.FC<NotificationsDropModalProps> = ({ notifications }) => {
  useEffect(() => {
    console.log(notifications)
  }, [notifications])
  const badgeClassName = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return styles.badgeCompleted
      case 'CLAIMABLE':
        return styles.badgeClaimable
      case 'FAILED':
        return styles.badgeError
      default:
        return styles.badgeCompleted
    }
  }

  const copy = (notification: BridgeNotification) => {
    const targetNetwork = getNetwork(notification.to)?.displayName ?? 'unknown chain'
    console.log(targetNetwork, notification.to)
    if (notification.status === 'CLAIMABLE') {
      return `Heads Up: Your ${notification.amount} ${L3_NATIVE_TOKEN_SYMBOL} withdrawal is complete and you can now claim your assets`
    }
    if (notification.status === 'COMPLETED') {
      if (notification.type === 'DEPOSIT') {
        return `${notification.amount} ${L3_NATIVE_TOKEN_SYMBOL} deposited to ${targetNetwork}`
      }
      return `Your ${notification.amount} ${L3_NATIVE_TOKEN_SYMBOL} withdrawal is complete`
    }
    switch (notification.type) {
      case 'WITHDRAWAL':
        return
    }
  }
  return (
    <div className={styles.container}>
      {!notifications || (notifications.length === 0 && <div className={styles.content}>No notifications yet</div>)}
      {notifications &&
        notifications.map((n, idx) => (
          <div
            className={
              notifications.length > 2 || idx + 1 !== notifications.length ? styles.item : styles.itemWithoutBorder
            }
            key={idx}
          >
            <div className={styles.itemHeader}>
              <div className={styles.itemHeaderLeft}>
                <div className={styles.itemHeaderTitle}>{n.type.toLowerCase()}</div>
                <div className={badgeClassName(n.status)}>{n.status.toLowerCase()}</div>
              </div>
              <div className={styles.headerTime}>{timeAgo(n.timestamp)}</div>
            </div>
            <div className={styles.content}>{copy(n)}</div>
          </div>
        ))}
    </div>
  )
}

export default NotificationsDropModal
