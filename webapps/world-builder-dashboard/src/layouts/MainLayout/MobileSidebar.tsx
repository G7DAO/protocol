import React, { ReactNode, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import parentStyles from './MainLayout.module.css'
import styles from './MobileSidebar.module.css'
import IconExternalLink from '@/assets/IconExternalLink'
import IconHamburgerLanding from '@/assets/IconHamburgerLanding'
import IconLogoutLarge from '@/assets/IconLogoutLarge'
import NetworkToggle from '@/components/commonComponents/networkToggle/NetworkToggle'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Game7Logo from '@/layouts/MainLayout/Game7Logo'

interface MobileSidebarProps {
  navigationItems: { name: string; navigateTo: string; icon: ReactNode }[]
}
const MobileSidebar: React.FC<MobileSidebarProps> = ({ navigationItems }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount, isMetaMask, disconnectWallet, connectWallet, isConnecting, selectedNetworkType } =
    useBlockchainContext()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <div className={styles.container}>
        <Game7Logo />
        <div className={styles.networkAndIconContainer} onClick={() => setIsExpanded(!isExpanded)}>
          {!isExpanded && (
            <div
              className={`${styles.networkBadge} ${selectedNetworkType === 'Testnet' ? styles.networkTestnet : styles.networkMainnet}`}
            >
              {selectedNetworkType}
            </div>
          )}
          <div className={styles.iconContainer}>
            <IconHamburgerLanding className={parentStyles.iconButton} />
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className={styles.expanded}>
          <div className={styles.spacer} />
          <NetworkToggle />
          <div className={styles.navigation}>
            {navigationItems.map((item) => (
              <div
                className={
                  location.pathname.startsWith(item.navigateTo)
                    ? parentStyles.selectedNavButton
                    : parentStyles.navButton
                }
                onClick={() => {
                  setIsExpanded(false)
                  if (item.name === 'documentation' || item.name === 'explorer') {
                    window.open(item.navigateTo, '_blank')
                  } else if (!(item.name === 'faucet' && selectedNetworkType === 'Mainnet')) {
                    navigate(item.navigateTo)
                  }
                }}
                key={item.name}
              >
                <div className={parentStyles.navBeginning}>
                  {item.icon}
                  {item.name}
                </div>
                <div style={{ display: 'flex' }}>
                  {item.name === 'documentation' || item.name === 'explorer' ? (
                    <IconExternalLink className={styles.icon} />
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            ))}
            <div className={styles.spacer} />
            {isMetaMask && connectedAccount ? (
              <div className={styles.web3AddressContainer}>
                <div className={parentStyles.web3address}>
                  {`${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`}
                </div>
                {isMetaMask && <IconLogoutLarge onClick={disconnectWallet} className={parentStyles.iconButton} />}
              </div>
            ) : (
              <div className={parentStyles.connectWalletButton} onClick={connectWallet}>
                {isConnecting ? (
                  <div className={parentStyles.connectingWalletText}>{'Connecting Wallet...'}</div>
                ) : (
                  <div className={parentStyles.connectWalletText}>{'Connect Wallet'}</div>
                )}
              </div>
            )}
          </div>
          <div className={styles.backdrop} onClick={() => setIsExpanded(false)} />
        </div>
      )}
    </>
  )
}

export default MobileSidebar
