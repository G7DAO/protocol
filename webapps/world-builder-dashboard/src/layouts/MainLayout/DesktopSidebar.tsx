import React, { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './MainLayout.module.css'
import IconLogout from '@/assets/IconLogout'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Game7Logo from '@/layouts/MainLayout/Game7Logo'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'

interface DesktopSidebarProps {
  navigationItems: { name: string; navigateTo: string; icon: ReactNode }[]
}
const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ navigationItems }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount, isMetaMask, connectWallet, disconnectWallet, isConnecting } = useBlockchainContext()

  return (
    <div className={styles.sideBar}>
      <div className={styles.sideBarTop}>
        <Game7Logo />
        <div className={styles.navigation}>
          {navigationItems.map((item) => (
            <div
              className={location.pathname.startsWith(item.navigateTo) ? styles.selectedNavButton : styles.navButton}
              onClick={() => {
                if (item.name === 'documentation' || item.name === 'explorer') {
                  window.open(item.navigateTo, '_blank')
                } else {
                  navigate(item.navigateTo)
                }
              }}
              key={item.name}
            >
              <div className={styles.navBeginning}>
                {item.icon}
                {item.name}
              </div>
              <div style={{ display: 'flex' }}>
                {item.name === 'documentation' || item.name === 'explorer' ? (
                  <IconLinkExternal02 className={styles.icon} />
                ) : (
                  ''
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.footer}>
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
      </div>
    </div>
  )
}

export default DesktopSidebar
