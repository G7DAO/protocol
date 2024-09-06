// React and hooks
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useLocation, useNavigate } from 'react-router-dom'
// Styles
import styles from './StakingPage.module.css'
import NotificationsButton from '@/components/notifications/NotificationsButton'
import { FloatingNotification } from '@/components/notifications/NotificationsDropModal'
import PoolsDesktop from '@/components/stake/pools/PoolsDesktop'
// Components
import StakingView from '@/components/stake/stake/StakingView'
// Contexts
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
// Hooks
import { useNotifications, usePendingTransactions } from '@/hooks/useL2ToL1MessageStatus'

const StakingPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount } = useBlockchainContext()
  const pendingTransactions = usePendingTransactions(connectedAccount)
  const [notificationsOffset] = useState(0)
  const [notificationsLimit] = useState(10)

  const notifications = useNotifications(connectedAccount, notificationsOffset, notificationsLimit)
  const { newNotifications, refetchNewNotifications } = useBridgeNotificationsContext()

  const queryClient = useQueryClient()

  useEffect(() => {
    if (pendingTransactions.data && connectedAccount) {
      queryClient.refetchQueries(['incomingMessages'])
      refetchNewNotifications(connectedAccount)
    }
  }, [pendingTransactions.data, connectedAccount])

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <div className={styles.headerContainer}>
          {notifications.data && <FloatingNotification notifications={newNotifications} />}
          <div className={styles.title}>Staker</div>
          <NotificationsButton notifications={notifications.data ?? []} />
        </div>
        <div className={styles.navigationContainer}>
          <button
            className={
              location.pathname === '/staker/pools' || location.pathname === '/staker'
                ? styles.selectedNavigationButton
                : styles.unselectedNavigationButton
            }
            onClick={() => navigate('/staker/pools')}
          >
            Pools
          </button>
          <button
            disabled={true}
            className={
              location.pathname === '/staker/projects'
                ? styles.selectedNavigationButton
                : styles.unselectedNavigationButton
            }
            onClick={() => navigate('/staker/projects')}
            style={{
              color: location.pathname === '/staker/projects' ? 'white' : 'gray'
            }}
          >
            Projects
          </button>{' '}
          <button
            className={
              location.pathname === '/staker/settings'
                ? styles.selectedNavigationButton
                : styles.unselectedNavigationButton
            }
            onClick={() => navigate('/staker/settings')}
          >
            Settings
          </button>
        </div>
      </div>
      <div className={styles.viewContainer}>
        {/* {location.pathname === '/staker/pools' && <StakingView />} */}
        {(location.pathname === '/staker' || location.pathname === '/staker/pools') && <PoolsDesktop />}
        {/* Uncomment when Projects ready. SAFE integration is a blocker/ */}
        {/* {location.pathname === '/staker/projects' && <ProjectsDesktop />} */}
        {/* Uncomment when Settings is ready */}
        {/* {location.pathname === '/staler/settoings' &&^ <SettingsPool />} */}
      </div>
    </div>
  )
}

export default StakingPage
