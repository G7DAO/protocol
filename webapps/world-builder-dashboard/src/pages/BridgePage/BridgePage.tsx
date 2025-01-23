// React and hooks
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
// Styles
import styles from './BridgePage.module.css'
// Components
import BridgeView from '@/components/bridge/bridge/BridgeView'
import HistoryDesktop from '@/components/bridge/history/HistoryDesktop'
import HistoryMobile from '@/components/bridge/history/HistoryMobile'
import SettingsView from '@/components/bridge/settings/SettingsView'
import NotificationsButton from '@/components/notifications/NotificationsButton'
import { FloatingNotification } from '@/components/notifications/NotificationsDropModal'
// Contexts
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
// Hooks
import { useNotifications, usePendingTransactions } from '@/hooks/useL2ToL1MessageStatus'
import { useMediaQuery } from '@mantine/hooks'
import { useTransactionContext } from '@/contexts/TransactionsContext'

export type DepositDirection = 'DEPOSIT' | 'WITHDRAW'

const BridgePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount } = useBlockchainContext()
  const [notificationsOffset] = useState(0)
  const [notificationsLimit] = useState(10)
  const [direction, setDirection] = useState<DepositDirection>('DEPOSIT')

  const notifications = useNotifications(connectedAccount, notificationsOffset, notificationsLimit)
  const { newNotifications, refetchNewNotifications } = useBridgeNotificationsContext()
  const smallView = useMediaQuery('(max-width: 1199px)')
  const queryClient = useQueryClient()
  const { transactions } = useTransactionContext()
  const pendingTransactions = usePendingTransactions(connectedAccount)

  useEffect(() => {
    if (pendingTransactions.data && connectedAccount) {
      queryClient.refetchQueries({ queryKey: ['incomingMessages'] })
      refetchNewNotifications(connectedAccount)
    }
  }, [pendingTransactions.data, connectedAccount])

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
            Activity
          </button>
        </div>
      </div>
      <div className={styles.viewContainer}>
        {location.pathname === '/bridge' && <BridgeView direction={direction} setDirection={setDirection} />}
        <div style={{ display: location.pathname === '/bridge/transactions' ? 'block' : 'none' }}>
          {!smallView ? <HistoryDesktop transactions={transactions} /> : <HistoryMobile />}
        </div>
        {location.pathname === '/bridge/settings' && <SettingsView />}
      </div>
    </div>
  )
}

export default BridgePage
