// React and External Libraries
import React, { useEffect, useRef, useState } from 'react'
// Constants and Configuration
import { L3_NATIVE_TOKEN_SYMBOL } from '../../../constants'
// Styles
import styles from './NotificationsDropModal.module.css'
import modalStyles from './NotificationsModal.module.css'
// Assets and Icons
import IconClose from '@/assets/IconClose'
import IconCloseSmall from '@/assets/IconCloseSmall'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
// Components
import { BridgeNotification } from '@/components/notifications/NotificationsButton'
// Context and Hooks
import { NetworkType, useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
// Utilities
import { timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl, getNetwork, getTokenSymbol } from '@/utils/web3utils'

interface NotificationsDropModalProps {
  notifications: BridgeNotification[]
}

const copy = (notification: BridgeNotification, selectedNetworkType: NetworkType, connectedAccount: string) => {
  const targetNetwork = getNetwork(notification.to, selectedNetworkType)?.displayName ?? 'unknown chain'
  if (notification.status === 'CLAIMABLE') {
    return `Your ${notification.amount} ${getTokenSymbol(notification.tx, connectedAccount) ?? notification.tx.symbol ?? notification.tx.transactionInputs?.tokenSymbol} withdrawal is ready to complete. Claim your token in Activity.`
  }
  if (notification.status === 'COMPLETED') {
    if (notification.type === 'DEPOSIT') {
      return `${notification.amount} ${notification.tx.symbol ?? notification.tx.transactionInputs?.tokenSymbol} deposited to ${targetNetwork}`
    }
    if (notification.type === 'CLAIM') {
      return (
        <>You received 1 {L3_NATIVE_TOKEN_SYMBOL}</>
      )
    }
    return `Your ${notification.amount} ${notification.tx.symbol ?? notification.tx.transactionInputs?.tokenSymbol} withdrawal is complete`
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
  const { connectedAccount, selectedNetworkType } = useBlockchainContext()
  const { cleanNewNotifications, setIsDropdownOpened, setIsModalOpened } = useBridgeNotificationsContext()

  useEffect(() => {
    if (connectedAccount) {
      cleanNewNotifications(connectedAccount)
    }
  }, [])

  return (
    <div className={styles.container}>
      {!notifications || (notifications.length === 0 && <div className={styles.content}>No notifications</div>)}
      {notifications &&
        notifications.slice(0, 3).map((n, idx) => (
          <div className={styles.item} key={idx}>
            <div className={styles.itemHeader}>
              <div className={styles.itemHeaderLeft}>
                <div className={styles.itemHeaderTitle}>{n.type.toLowerCase()}</div>
                {getTransactionUrl(n) ? (
                  <a href={getTransactionUrl(n)} target={'_blank'} className={modalStyles.explorerLink}>
                    <div className={badgeClassName(n.status)}>
                      {n.status.toLowerCase()}
                      <IconLinkExternal02 stroke={'#fff'} />
                    </div>
                  </a>
                ) : (
                  <div className={badgeClassName(n.status)}>{n.status.toLowerCase()}</div>
                )}
              </div>
              <div className={styles.headerTime}>{timeAgo(n.timestamp, true)}</div>
            </div>
            <div className={styles.content}>{copy(n, selectedNetworkType, connectedAccount ?? '')}</div>
          </div>
        ))}
      <button
        className={styles.button}
        onClick={() => {
          setIsModalOpened(true)
          setIsDropdownOpened(false)
        }}
      >
        See more
      </button>
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

const iconCloseClassName = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return styles.iconCloseCompleted
    case 'CLAIMABLE':
      return styles.iconCloseClaimable
    case 'FAILED':
      return styles.iconCloseError
    default:
      return styles.iconCloseCompleted
  }
}

export const FloatingNotification = ({ notifications }: { notifications: BridgeNotification[] }) => {
  const { setIsDropdownOpened } = useBridgeNotificationsContext()
  const { selectedNetworkType, connectedAccount } = useBlockchainContext()
  const [show, setShow] = useState(false)
  const handleClick = () => {
    setIsDropdownOpened(true)
    setShow(!show)
  }

  const handleExit = () => {
    setShow(!show)
  }

  if (!notifications || notifications.length === 0) {
    return <></>
  }

  if (notifications.length > 1) {
    return (
      show && (
        <div onClick={handleClick} className={styles.toastMultiple}>
          {`You have ${notifications.length} new notifications. Click here to view`}
          <IconCloseSmall
            onClick={(e) => {
              e.stopPropagation()
              handleExit()
            }}
            className={styles.closeIconMultiple}
          />
        </div>
      )
    )
  }

  return (
    <div onClick={handleClick} className={toastClassName(notifications[0].status)}>
      <a href={getTransactionUrl(notifications[0])} target="_blank" style={{ color: 'white', textDecoration: 'underline' }}>
        {copy(notifications[0], selectedNetworkType, connectedAccount ?? '')}
      </a>
      <IconCloseSmall className={iconCloseClassName(notifications[0].status)} onClick={handleExit} />
    </div>
  )
}
const getTransactionUrl = (notification: BridgeNotification): string | undefined => {
  const { selectedNetworkType } = useBlockchainContext()
  const { tx, status } = notification
  let chainId: number | undefined
  let txHash: string | undefined
  switch (tx.type) {
    case 'DEPOSIT':
      chainId = tx.lowNetworkChainId
      txHash = tx.lowNetworkHash
      break
    case 'WITHDRAWAL':
      chainId = status === 'COMPLETED' ? tx.lowNetworkChainId : tx.highNetworkChainId
      txHash = status === 'COMPLETED' ? tx.lowNetworkHash : tx.highNetworkHash
      break
    case 'CLAIM':
      chainId = tx.highNetworkChainId
      txHash = tx.highNetworkHash
      break
    default:
  }
  const explorerUrl = getBlockExplorerUrl(chainId, selectedNetworkType)
  if (explorerUrl && txHash) {
    return `${explorerUrl}/tx/${txHash}`
  }
}

export const NotificationsModal: React.FC<NotificationsDropModalProps> = ({ notifications }) => {
  const { selectedNetworkType, connectedAccount } = useBlockchainContext()
  const [page, setPage] = useState(0)
  const { setIsModalOpened } = useBridgeNotificationsContext()
  const LIMIT = 4

  const itemsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (itemsContainerRef.current) {
      itemsContainerRef.current.scrollTo({
        top: itemsContainerRef.current.scrollHeight,
        behavior: 'smooth' // Optional, for smooth scrolling
      })
    }
  }, [page])

  return (
    <div className={modalStyles.container}>
      <div className={modalStyles.header}>
        <div className={modalStyles.title}>
          Notifications
          <IconClose className={modalStyles.closeButton} onClick={() => setIsModalOpened(false)} />
        </div>
      </div>
      <div className={modalStyles.itemsContainer} ref={itemsContainerRef}>
        {!notifications || (notifications.length === 0 && <div className={styles.content}>No notifications</div>)}
        {notifications &&
          notifications.slice(0, LIMIT * page + LIMIT).map((n, idx) => (
            <div
              className={
                idx + 1 === notifications.slice(0, LIMIT * page + LIMIT).length
                  ? modalStyles.itemWithoutBorder
                  : modalStyles.item
              }
              key={idx}
            >
              <div className={modalStyles.itemHeader}>
                <div className={modalStyles.itemHeaderLeft}>
                  <div className={modalStyles.itemHeaderTitle}>{n.type.toLowerCase()}</div>
                  {getTransactionUrl(n) ? (
                    <a href={getTransactionUrl(n)} target={'_blank'} className={modalStyles.explorerLink}>
                      <div className={badgeClassName(n.status)}>
                        {n.status.toLowerCase()}
                        <IconLinkExternal02 stroke={n.status === 'CLAIMABLE' ? '#fff' : '#fff'} />
                      </div>
                    </a>
                  ) : (
                    <div className={badgeClassName(n.status)}>{n.status.toLowerCase()}</div>
                  )}
                </div>
                <div className={modalStyles.headerTime}>{timeAgo(n.timestamp, true)}</div>
              </div>
              <div className={modalStyles.content}>{copy(n, selectedNetworkType, connectedAccount ?? '')}</div>
            </div>
          ))}
      </div>
      {notifications.length >= LIMIT * page + LIMIT && (
        <button className={modalStyles.button} onClick={() => setPage((prev) => prev + 1)}>
          See more
        </button>
      )}
    </div>
  )
}
