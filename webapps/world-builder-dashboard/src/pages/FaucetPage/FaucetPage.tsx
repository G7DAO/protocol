// React and hooks
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
// Constants
import { L3_NATIVE_TOKEN_SYMBOL } from '../../../constants'
// Styles
import bridgeStyles from '../BridgePage/BridgePage.module.css'
import styles from './FaucetPage.module.css'
import FaucetView from '@/components/faucet/FaucetView'
// Components
import NotificationsButton from '@/components/notifications/NotificationsButton'
import { FloatingNotification } from '@/components/notifications/NotificationsDropModal'
// Contexts
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
// Hooks
import { useNotifications, usePendingTransactions } from '@/hooks/useL2ToL1MessageStatus'

const BridgePage = () => {
  const { connectedAccount } = useBlockchainContext()
  const pendingTransacions = usePendingTransactions(connectedAccount)
  const [notificationsOffset] = useState(0)
  const [notificationsLimit] = useState(10)

  const notifications = useNotifications(connectedAccount, notificationsOffset, notificationsLimit)
  const { newNotifications, refetchNewNotifications } = useBridgeNotificationsContext()

  const queryClient = useQueryClient()

  useEffect(() => {
    if (pendingTransacions.data && connectedAccount) {
      queryClient.refetchQueries(['incomingMessages'])
      refetchNewNotifications(connectedAccount)
    }
  }, [pendingTransacions.data, connectedAccount])

  return (
    <div className={bridgeStyles.container}>
      <div className={bridgeStyles.top}>
        <div className={bridgeStyles.headerContainer}>
          {notifications.data && <FloatingNotification notifications={newNotifications} />}
          <div className={styles.title}>Faucet</div>
          <NotificationsButton notifications={notifications.data ?? []} />
        </div>
      </div>
      <div className={styles.viewContainer}>
        {/* TODO: make into component. */}
        {/* <div className={styles.warningWrapper}>
          <div className={styles.warningContainer}>
            <div className={styles.warningBadge}>Warning</div>
            <div
              className={styles.warningText}
            >{`This faucet only dispenses ${L3_NATIVE_TOKEN_SYMBOL} tokens. For other tokens, please visit external faucets.`}</div>
          </div>
        </div> */}

        <FaucetView />
      </div>
    </div>
  )
}

export default BridgePage
