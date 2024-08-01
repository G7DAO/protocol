import React, { useEffect } from 'react'
import { L3_NATIVE_TOKEN_SYMBOL } from '../../../constants'
import styles from './NotificationsDropModal.module.css'
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { useBridgeNotificationsContext } from '@/components/bridge/BridgeNotificationsContext'
import { BridgeNotification } from '@/components/bridge/NotificationsButton'
import { timeAgo } from '@/utils/timeFormat'
import { getNetwork } from '@/utils/web3utils'

interface NotificationsDropModalProps {
  notifications: BridgeNotification[]
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
    if (notification.type === 'CLAIM') {
      return `You received ${notification.amount} ${L3_NATIVE_TOKEN_SYMBOL}`
    }
    return `Your ${notification.amount} ${L3_NATIVE_TOKEN_SYMBOL} withdrawal is complete`
  }
}

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

const NotificationsDropModal: React.FC<NotificationsDropModalProps> = ({ notifications }) => {
  const { connectedAccount } = useBlockchainContext()
  const { cleanNewNotifications } = useBridgeNotificationsContext()

  useEffect(() => {
    console.log(notifications, notifications.slice(0, 3))
    if (connectedAccount) {
      cleanNewNotifications(connectedAccount)
    }
  }, [])

  return (
    <div className={styles.container}>
      {!notifications || (notifications.length === 0 && <div className={styles.content}>No notifications yet</div>)}
      {notifications &&
        notifications.slice(0, 3).map((n, idx) => (
          <div className={styles.item} key={idx}>
            <div className={styles.itemHeader}>
              <div className={styles.itemHeaderLeft}>
                <div className={styles.itemHeaderTitle}>{n.type.toLowerCase()}</div>
                <div className={badgeClassName(n.status)}>{n.status.toLowerCase()}</div>
              </div>
              <div className={styles.headerTime}>{timeAgo(n.timestamp, true)}</div>
            </div>
            <div className={styles.content}>{copy(n)}</div>
          </div>
        ))}
      <button className={styles.button}>See more</button>
    </div>
  )
}

export default NotificationsDropModal

const toastClassName = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return styles.toastCompleted
    case 'CLAIMABLE':
      return styles.toastClaimable
    case 'FAILED':
      return styles.toastError
    default:
      return styles.badgeCompleted
  }
}

export const FloatingNotification = ({ notifications }: { notifications: BridgeNotification[] }) => {
  const { setIsDropdownOpened } = useBridgeNotificationsContext()
  const handleClick = () => {
    setIsDropdownOpened(true)
  }
  if (!notifications || notifications.length === 0) {
    return <></>
  }

  if (notifications.length > 1) {
    return (
      <div
        onClick={handleClick}
        className={styles.toastMultiple}
      >{`You have ${notifications.length} new notifications. Click here to view`}</div>
    )
  }

  return (
    <div onClick={handleClick} className={toastClassName(notifications[0].status)}>
      {copy(notifications[0])}
    </div>
  )
}
