import { useLocation, useNavigate } from 'react-router-dom'
import styles from './BridgePage.module.css'
import { Box } from 'summon-ui/mantine'
import BridgeView from '@/components/bridge/BridgeView'
import NotificationsButton from '@/components/bridge/NotificationsButton'
import WithdrawTransactions from '@/components/bridge/WithdrawTransactions'

const BridgePage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Box px='32px' bg={'#FCFCFD'} h={'100vh'} pt={'1px'}>
      <div className={styles.headerContainer}>
        <div className={styles.title}>Bridge</div>
        <NotificationsButton />
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
