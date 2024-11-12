import React, { useState } from 'react'
import styles from './NetworkToggle.module.css'
import IconChevronDownToggle from '@/assets/IconAlertCircle'
import { NetworkType, useBlockchainContext } from '@/contexts/BlockchainContext'

const NETWORK_OPTIONS: NetworkType[] = ['Testnet', 'Mainnet']

interface NetworkToggleProps {}

const NetworkToggle: React.FC<NetworkToggleProps> = () => {
  const { selectedNetworkType, setSelectedNetworkType } = useBlockchainContext()
  const [isDropdownOpen, setDropdownOpen] = useState(false)

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen)

  const handleNetworkSelect = (network: NetworkType) => {
    setSelectedNetworkType(network as NetworkType)
    setDropdownOpen(false)
  }
  return (
    <div className={styles.container} onClick={toggleDropdown}>
      <div className={`${styles.toggle} ${selectedNetworkType === 'Testnet' ? styles.testnet : styles.mainnet}`}>
        {/* <selectedNetwork.logo /> */}
        <div className={styles.testnetContainer}>
          <div
            className={`${styles.testnetType} ${selectedNetworkType === 'Testnet' ? styles.testnetTypeColor : styles.mainnetTypeColor}`}
          >
            {selectedNetworkType}
          </div>
        </div>
        <IconChevronDownToggle color='#fff' />
        {isDropdownOpen && (
          <div className={styles.dropdownContainer}>
            {NETWORK_OPTIONS.filter((network: NetworkType) => network !== selectedNetworkType).map(
              (network: NetworkType) => (
                <div key={network} className={styles.dropdownOption} onClick={() => handleNetworkSelect(network)}>
                  <div className={styles.dropdownNetworkContainer}>
                    <div className={styles.dropdownNetworkInformation}>
                      {/* <network.logo /> */}
                      <div className={styles.dropdownTestnetContainer}>
                        <div
                          className={`${styles.testnetType} ${network === 'Testnet' ? styles.testnetTypeColor : styles.mainnetTypeColor}`}
                        >
                          {network}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NetworkToggle
