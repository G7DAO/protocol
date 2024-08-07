// React and hooks
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useLocation, useNavigate } from 'react-router-dom'

// Styles
import styles from './StakingPage.module.css'

// Components
import StakingView from '@/components/stake/stake/StakingView'
import HistoryDesktop from '@/components/bridge/history/HistoryDesktop'
import HistoryMobile from '@/components/bridge/history/HistoryMobile'
import NotificationsButton from '@/components/notifications/NotificationsButton'
import { FloatingNotification } from '@/components/notifications/NotificationsDropModal'

// Contexts
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'

// Hooks
import { useNotifications, usePendingTransactions } from '@/hooks/useL2ToL1MessageStatus'
import { useMediaQuery } from '@mantine/hooks'
import PoolsDesktop from '@/components/stake/pools/PoolsDesktop'

export type DepositDirection = 'DEPOSIT' | 'WITHDRAW'

const StakingPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount } = useBlockchainContext()
  const pendingTransacions = usePendingTransactions(connectedAccount)
  const [notificationsOffset] = useState(0)
  const [notificationsLimit] = useState(10)
  const [direction, setDirection] = useState<DepositDirection>('DEPOSIT')

  const notifications = useNotifications(connectedAccount, notificationsOffset, notificationsLimit)
  const { newNotifications, refetchNewNotifications } = useBridgeNotificationsContext()
  const smallView = useMediaQuery('(max-width: 767px)')

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
          <div className={styles.title}>Stake</div>
          <NotificationsButton notifications={notifications.data ?? []} />
        </div>
        <div className={styles.navigationContainer}>
          <button
            className={
              location.pathname === '/stake' ? styles.selectedNavigationButton : styles.unselectedNavigationButton
            }
            onClick={() => navigate('/stake')}
          >
            Create Pool
          </button>
          <button
            className={
              location.pathname === '/stake/pools'
                ? styles.selectedNavigationButton
                : styles.unselectedNavigationButton
            }
            onClick={() => navigate('/stake/pools')}
          >
            View Pools
          </button>
        </div>
      </div>
      <div className={styles.viewContainer}>
        {location.pathname === '/stake' && <StakingView direction={direction} setDirection={setDirection} />}
        {location.pathname === '/stake/pools' && <PoolsDesktop />}
      </div>
    </div>
  )
}

export default StakingPage
