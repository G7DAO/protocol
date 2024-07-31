// React and hooks
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
// Constants
import { L3_NATIVE_TOKEN_SYMBOL } from '../../../constants'
// Styles
import bridgeStyles from '../BridgePage/BridgePage.module.css'
import styles from './FaucetPage.module.css'
// Contexts
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { useBridgeNotificationsContext } from '@/components/bridge/BridgeNotificationsContext'
// Components
import NotificationsButton from '@/components/bridge/NotificationsButton'
import { FloatingNotification } from '@/components/bridge/NotificationsDropModal'
import FaucetView from '@/components/faucet/FaucetView'
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
  }, [pendingTransacions.data])

  return (
    <div className={bridgeStyles.container}>
      <div className={bridgeStyles.top}>
        <div className={bridgeStyles.headerContainer}>
          {notifications.data && <FloatingNotification notifications={newNotifications} />}
          <div className={styles.title}>Faucet</div>
          <NotificationsButton notifications={notifications.data ?? []} />
        </div>
      </div>
      <div className={bridgeStyles.viewContainer}>
        <div className={styles.warningContainer}>
          <div className={styles.warningBadge}>Warning</div>
          <div
            className={styles.warningText}
          >{`This faucet only dispenses ${L3_NATIVE_TOKEN_SYMBOL} tokens. For other tokens, please visit external faucets.`}</div>
        </div>

        <FaucetView />
      </div>
    </div>
  )
}

export default BridgePage
