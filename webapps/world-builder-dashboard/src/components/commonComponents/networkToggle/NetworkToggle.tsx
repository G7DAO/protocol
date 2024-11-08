import React, { useState } from 'react'
import styles from './NetworkToggle.module.css'
import G7LogoBlue from '@/assets/G7LogoBlue'
import G7LogoRed from '@/assets/G7LogoRed'
import IconChevronDownToggle from '@/assets/IconAlertCircle'

interface NetworkToggleOption {
  name: string
  type: string
  logo: React.FC
}

const NETWORK_OPTIONS: NetworkToggleOption[] = [
  {
    name: 'G7 Sepolia',
    type: 'Testnet',
    logo: G7LogoBlue
  },
  {
    name: 'G7 Mainnet',
    type: 'Mainnet',
    logo: G7LogoRed
  }
]

interface NetworkToggleProps {}

const NetworkToggle: React.FC<NetworkToggleProps> = () => {
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORK_OPTIONS[0])
  const [isDropdownOpen, setDropdownOpen] = useState(false)

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen)

  const handleNetworkSelect = (network: NetworkToggleOption) => {
    setSelectedNetwork(network)
    setDropdownOpen(false)
  }
  return (
    <div className={styles.container} onClick={toggleDropdown}>
      <div className={`${styles.toggle} ${selectedNetwork.type === 'Testnet' ? styles.testnet : styles.mainnet}`}>
        <selectedNetwork.logo />
        <div className={styles.testnetContainer}>
          <div className={styles.testnetName}>{selectedNetwork.name}</div>
          <div
            className={`${styles.testnetType} ${selectedNetwork.type === 'Testnet' ? styles.testnetTypeColor : styles.mainnetTypeColor}`}
          >
            {selectedNetwork.type}
          </div>
        </div>
        <IconChevronDownToggle color='#fff' />
      </div>
      {isDropdownOpen && (
        <div className={styles.dropdownContainer}>
          {NETWORK_OPTIONS.filter((network: NetworkToggleOption) => network.name !== selectedNetwork.name).map(
            (network: NetworkToggleOption) => (
              <div key={network.name} className={styles.dropdownOption} onClick={() => handleNetworkSelect(network)}>
                <div className={styles.dropdownNetworkContainer}>
                  <div className={styles.dropdownNetworkInformation}>
                    <network.logo />
                    <div className={styles.dropdownTestnetContainer}>
                      <div className={styles.testnetName}>{network.name}</div>
                      <div
                        className={`${styles.testnetType} ${network.type === 'Testnet' ? styles.testnetTypeColor : styles.mainnetTypeColor}`}
                      >
                        {network.type}
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
  )
}

export default NetworkToggle
