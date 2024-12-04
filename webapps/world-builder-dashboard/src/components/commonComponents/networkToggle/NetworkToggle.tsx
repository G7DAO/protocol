import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import styles from './NetworkToggle.module.css'
import IconChevronDownToggle from '@/assets/IconChevronDownToggle'
import { NetworkType, useBlockchainContext } from '@/contexts/BlockchainContext'

interface NetworkOption {
  type: NetworkType
  label: String
}

const NETWORK_OPTIONS: NetworkOption[] = [
  { type: 'testnet', label: 'Testnet' },
  { type: 'mainnet', label: 'Mainnet' }
]

interface NetworkToggleProps {}

const NetworkToggle: React.FC<NetworkToggleProps> = () => {
  const { selectedNetworkType, setSelectedNetworkType } = useBlockchainContext()
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const toggleDropdown = () => setDropdownOpen((prev) => !prev)

  useEffect(() => {
    const networkType = searchParams.get('network')
    setSelectedNetworkType(
      networkType ? (networkType as NetworkType) : selectedNetworkType ? selectedNetworkType : 'mainnet'
    )
    setSearchParams({
      network: networkType ? (networkType as string) : selectedNetworkType ? (selectedNetworkType as string) : 'mainnet'
    })
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
      <div className={`${styles.toggle} ${selectedNetworkType === 'testnet' ? styles.testnet : styles.mainnet}`}>
        <div className={styles.testnetContainer}>
          <div
            className={`${styles.testnetType} ${selectedNetworkType === 'testnet' ? styles.testnetTypeColor : styles.mainnetTypeColor}`}
          >
            {selectedNetworkType}
          </div>
        </div>
        <IconChevronDownToggle color='#fff' />
        {isDropdownOpen && (
          <div className={styles.dropdownContainer}>
            {NETWORK_OPTIONS.filter((network: NetworkOption) => network.type !== selectedNetworkType).map(
              (network: NetworkOption) => (
                <div
                  key={network.type}
                  className={styles.dropdownOption}
                  onClick={() => handleNetworkSelect(network.type)}
                >
                  <div className={styles.dropdownNetworkContainer}>
                    <div className={styles.dropdownNetworkInformation}>
                      <div className={styles.dropdownTestnetContainer}>
                        <div
                          className={`${styles.testnetType} ${network.type === 'testnet' ? styles.testnetTypeColor : styles.mainnetTypeColor}`}
                        >
                          {network.label}
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
