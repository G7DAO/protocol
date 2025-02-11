import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './MainLayout.module.css'
import IconExternalLink from '@/assets/IconExternalLink'
import IconLogout from '@/assets/IconLogout'
import NetworkToggle from '@/components/commonComponents/networkToggle/NetworkToggle'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Game7Logo from '@/layouts/MainLayout/Game7Logo'
import { NavigationItem } from './MainLayout'

interface DesktopSidebarProps {
  navigationItems: NavigationItem[]
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ navigationItems }) => {
  const [isHoveredElement, setIsHovereredElement] = useState('');
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount, isMetaMask, connectWallet, disconnectWallet, isConnecting, selectedNetworkType } =
    useBlockchainContext()

  return (
    <div className={styles.sideBar}>
      <div className={styles.sideBarTop}>
        <Game7Logo />
        <NetworkToggle />
        <div className={styles.navigation}>
          {navigationItems.map(({Icon, ...item}) => (
            <div
              onMouseEnter={() => setIsHovereredElement(item.name)}
              onMouseLeave={() => setIsHovereredElement('')}
              aria-disabled={item.name === 'faucet' && selectedNetworkType === 'Mainnet'}
              className={location.pathname.startsWith(item.navigateTo) ? styles.selectedNavButton : styles.navButton}
              onClick={() => {
                if (item.name === 'documentation' || item.name === 'explorer' || item.name === 'camelot' || item.name === 'safe') {
                  window.open(item.navigateTo, '_blank')
                } else if (!(item.name === 'faucet' && selectedNetworkType === 'Mainnet')) {
                  navigate(item.navigateTo)
                }
              }}
              key={item.name}
            >
              <div className={styles.navBeginning}>
                <Icon isHovered={isHoveredElement === item.name}/>
                {item.name}
              </div>
              <div style={{ display: 'flex' }}>
                {item.name === 'documentation' || item.name === 'explorer' || item.name === 'camelot' || item.name === 'safe' ? (
                  <IconExternalLink className={styles.iconButton} />
                ) : (
                  <></>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          {connectedAccount ? (
            <div className={styles.web3AddressContainer}>
              <div className={styles.web3address}>
                {`${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`}
              </div>
              {isMetaMask && <IconLogout onClick={disconnectWallet} className={styles.iconButton} />}
            </div>
          ) : (
            <div className={styles.connectWalletButton} onClick={connectWallet}>
              {isConnecting ? (
                <div className={styles.connectingWalletText}>{'Connecting Wallet...'}</div>
              ) : (
                <div className={styles.connectWalletText}>{'Connect Wallet'}</div>
              )}
            </div>
          )}
          <div className={styles.linkContainer}>
            <a href="https://game7.io/terms" target="_blank" className={styles.linkText} rel="noreferrer">
              Terms of Service
            </a>
            <a href="https://game7.io/privacy" target="_blank" className={styles.linkText} rel="noreferrer">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DesktopSidebar
