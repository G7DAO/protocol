import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { L3_NATIVE_TOKEN_SYMBOL } from '../../../constants'
import styles from './FaucetPage.module.css'
import { Box } from 'summon-ui/mantine'
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { useBridgeNotificationsContext } from '@/components/bridge/BridgeNotificationsContext'
import NotificationsButton from '@/components/bridge/NotificationsButton'
import { FloatingNotification } from '@/components/bridge/NotificationsDropModal'
import FaucetView from '@/components/faucet/FaucetView'
import { useNotifications, usePendingTransactions } from '@/hooks/useL2ToL1MessageStatus'

const BridgePage = () => {
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
    <Box px={'32px'} bg={'#FCFCFD'} h={'100vh'} pt={'1px'}>
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          {notifications.data && <FloatingNotification notifications={newNotifications} />}
          <div className={styles.title}>Faucet</div>
          <NotificationsButton notifications={notifications.data ?? []} />
        </div>
        <div className={styles.warningContainer}>
          <div className={styles.warningBadge}>Warning</div>
          <div
            className={styles.warningText}
          >{`This faucet only dispenses ${L3_NATIVE_TOKEN_SYMBOL} tokens. For other tokens, please visit external faucets.`}</div>
        </div>

        <FaucetView />
      </div>
    </Box>
  )
}

export default BridgePage
