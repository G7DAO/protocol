// React and hooks
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
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
        <FaucetView />
      </div>
    </div>
  )
}

export default BridgePage
