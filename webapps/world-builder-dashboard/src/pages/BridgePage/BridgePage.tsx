import { useLocation, useNavigate } from 'react-router-dom'
import styles from './BridgePage.module.css'
import { ContentHeader } from 'summon-ui'
import { Box } from 'summon-ui/mantine'
import { BlockchainProvider } from '@/components/bridge/BlockchainContext'
import BridgeView from '@/components/bridge/BridgeView'
import WithdrawTransactions from '@/components/bridge/WithdrawTransactions'

const BridgePage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <BlockchainProvider>
      <Box px='32px' bg={'#FCFCFD'} h={'100vh'} pt={'5px'}>
        {/*<ContentHeader name='Bridge' tabs={{ list: [], value: location.pathname }} style={""}></ContentHeader>*/}
        <div className={styles.title}>Bridge</div>
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
    </BlockchainProvider>
  )
}

export default BridgePage
