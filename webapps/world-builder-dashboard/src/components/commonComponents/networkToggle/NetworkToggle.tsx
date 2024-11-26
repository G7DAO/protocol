import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import styles from './NetworkToggle.module.css'
import IconChevronDownToggle from '@/assets/IconChevronDownToggle'
import { NetworkType, useBlockchainContext } from '@/contexts/BlockchainContext'

const NETWORK_OPTIONS: NetworkType[] = ['Testnet', 'Mainnet']

interface NetworkToggleProps {}

const NetworkToggle: React.FC<NetworkToggleProps> = () => {
  const { selectedNetworkType, setSelectedNetworkType } = useBlockchainContext()
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const toggleDropdown = () => setDropdownOpen((prev) => !prev)

  useEffect(() => {
    const networkType = searchParams.get('network')
    setSelectedNetworkType(networkType ? (networkType as NetworkType) : selectedNetworkType ? selectedNetworkType : 'Mainnet')
    setSearchParams({ network: networkType ? (networkType as string) : selectedNetworkType ? (selectedNetworkType as string) : 'Mainnet' })
  }, [selectedNetworkType])

  const handleNetworkSelect = (network: NetworkType) => {
    setSelectedNetworkType(network as NetworkType)
    setDropdownOpen(!isDropdownOpen)
    setSearchParams({ network: network as string })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  return (
    <div ref={dropdownRef} className={styles.container} onClick={toggleDropdown}>
      <div className={`${styles.toggle} ${selectedNetworkType === 'Testnet' ? styles.testnet : styles.mainnet}`}>
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
