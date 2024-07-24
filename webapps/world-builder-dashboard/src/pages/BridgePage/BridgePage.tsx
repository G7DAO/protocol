import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './BridgePage.module.css'
import { Box } from 'summon-ui/mantine'
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import BridgeView from '@/components/bridge/BridgeView'
import NotificationsButton from '@/components/bridge/NotificationsButton'
import WithdrawTransactions from '@/components/bridge/WithdrawTransactions'
import { useNotifications, usePendingTransactions } from '@/hooks/useL2ToL1MessageStatus'

const BridgePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount } = useBlockchainContext()
  const pendingTransacions = usePendingTransactions(connectedAccount)
  const [notificationsOffset, setNotificationsOffset] = useState(0)
  const [notificationsLimit, setNotificationsLimit] = useState(10)

  const notifications = useNotifications(connectedAccount, notificationsOffset, notificationsLimit)
  const queryClient = useQueryClient()
  useEffect(() => {
    if (pendingTransacions.data) {
      queryClient.refetchQueries(['notifications'])
    }
  }, [pendingTransacions.data])

  return (
    <Box px='32px' bg={'#FCFCFD'} h={'100vh'} pt={'1px'}>
      <div className={styles.headerContainer}>
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
      {location.pathname === '/bridge' && <BridgeView />}
      {location.pathname === '/bridge/transactions' && <WithdrawTransactions />}
    </Box>
  )
}

export default BridgePage
