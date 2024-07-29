import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from '../BridgePage/BridgePage.module.css'
import { Box } from 'summon-ui/mantine'
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import {
  BridgeNotificationsProvider,
  useBridgeNotificationsContext
} from '@/components/bridge/BridgeNotificationsContext'
import BridgeView from '@/components/bridge/BridgeView'
import NotificationsButton from '@/components/bridge/NotificationsButton'
import { FloatingNotification } from '@/components/bridge/NotificationsDropModal'
import WithdrawTransactions from '@/components/bridge/WithdrawTransactions'
import FaucetView from '@/components/faucet/FaucetView'
import { useNotifications, usePendingTransactions } from '@/hooks/useL2ToL1MessageStatus'

const BridgePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount } = useBlockchainContext()
  const pendingTransacions = usePendingTransactions(connectedAccount)
  const [notificationsOffset, setNotificationsOffset] = useState(0)
  const [notificationsLimit, setNotificationsLimit] = useState(10)

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
    <Box bg={'#FCFCFD'} h={'100vh'}>
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          {notifications.data && <FloatingNotification notifications={newNotifications} />}
          <div className={styles.title}>Faucet</div>
          <NotificationsButton notifications={notifications.data ?? []} />
        </div>
        <FaucetView />
      </div>
    </Box>
  )
}

export default BridgePage
