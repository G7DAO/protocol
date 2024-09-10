import React from 'react'
import { useWallet } from '../contexts/WalletContext.tsx'
import styles from './BridgeView.module.css'

const WalletConnection = () => {
  const { getProvider, error } = useWallet()

  return (
    <div className={styles.connectButton} onClick={() => getProvider()}>
      Connect wallet
    </div>
  )
}

export default WalletConnection
