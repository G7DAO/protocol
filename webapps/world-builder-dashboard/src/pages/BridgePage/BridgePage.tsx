// React and hooks
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useLocation, useNavigate } from 'react-router-dom'
// Styles
import styles from './BridgePage.module.css'
// Components
import BridgeView from '@/components/bridge/bridge/BridgeView'
import WithdrawTransactions from '@/components/bridge/history/WithdrawTransactions'
import NotificationsButton from '@/components/notifications/NotificationsButton'
import { FloatingNotification } from '@/components/notifications/NotificationsDropModal'
// Contexts
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
// Hooks
import { useNotifications, usePendingTransactions } from '@/hooks/useL2ToL1MessageStatus'

export type DepositDirection = 'DEPOSIT' | 'WITHDRAW'

const BridgePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount } = useBlockchainContext()
  const pendingTransacions = usePendingTransactions(connectedAccount)
  const [notificationsOffset] = useState(0)
  const [notificationsLimit] = useState(10)
  const [direction, setDirection] = useState<DepositDirection>('DEPOSIT')

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
    <div className={styles.container}>
      <div className={styles.top}>
        <div className={styles.headerContainer}>
          {notifications.data && <FloatingNotification notifications={newNotifications} />}
          <div className={styles.title}>Bridge</div>
          <NotificationsButton notifications={notifications.data ?? []} />
        </div>
        <div className={styles.navigationContainer}>
          <button
            className={
              location.pathname === '/bridge' ? styles.selectedNavigationButton : styles.unselectedNavigationButton
            }
            onClick={() => navigate('/bridge')}
          >
            Transfer
          </button>
          <button
            className={
              location.pathname === '/bridge/transactions'
                ? styles.selectedNavigationButton
                : styles.unselectedNavigationButton
            }
            onClick={() => navigate('/bridge/transactions')}
          >
            History
          </button>
        </div>
      </div>
      <div className={styles.viewContainer}>
        {location.pathname === '/bridge' && <BridgeView direction={direction} setDirection={setDirection} />}
        {location.pathname === '/bridge/transactions' && <WithdrawTransactions />}
      </div>
    </div>
  )
}

export default BridgePage
