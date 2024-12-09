import React from 'react'
import { useNavigate } from 'react-router-dom'
import { L3_NATIVE_TOKEN_SYMBOL, L3_NETWORK } from '../../../../constants'
import styles from './SettingsView.module.css'
import IconG7tLarge from '@/assets/IconG7tLarge'
import MessagingSettings from '@/components/bridge/settings/MessagingSettings'
import { NetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { useUISettings } from '@/contexts/UISettingsContext'

interface SettingsViewProps {}
const SettingsView: React.FC<SettingsViewProps> = ({}) => {
  const { setFaucetTargetChainId } = useUISettings()
  const { selectedNetworkType } = useBlockchainContext()
  const navigate = useNavigate()
  const handleClick = (network: NetworkInterface) => {
    setFaucetTargetChainId(network.chainId)
    navigate('/faucet')
  }

  if (selectedNetworkType === 'Mainnet') {
    navigate('/bridge')
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <div className={styles.title}>Testnet Options</div>
        <div className={styles.supportingText}>{`Enable a Testnet to test bridge functionality.`}</div>
      </div>
      <div className={styles.divider} />
      <MessagingSettings />
      <div className={styles.titleContainer}>
        <div className={styles.title}>Testnet funds</div>
        <div className={styles.supportingText}>
          {`Request ${L3_NATIVE_TOKEN_SYMBOL} from the Game7 faucet for test transactions below.`}
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.faucetLinks}>
        <div className={styles.faucetLinkContainer}>
          <IconG7tLarge />
          <div className={styles.textContainer}>
            <div className={styles.linkTitle}>G7 Sepolia</div>
            <div className={styles.supportingText}>Request $G7 testnet tokens</div>
          </div>
          <button className={styles.button} onClick={() => handleClick(L3_NETWORK)}>
            Request
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsView
