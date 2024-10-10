import React, { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './MainLayout.module.css'
import IconDark from '@/assets/IconDark'
import IconExternalLink from '@/assets/IconExternalLink'
import IconLight from '@/assets/IconLight.tsx'
import IconLogout from '@/assets/IconLogout'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Game7Logo from '@/layouts/MainLayout/Game7Logo'
import { useUISettings } from '@/contexts/UISettingsContext'

interface DesktopSidebarProps {
  navigationItems: { name: string; navigateTo: string; icon: ReactNode }[]
}
const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ navigationItems }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount, isMetaMask, connectWallet, disconnectWallet, isConnecting } = useBlockchainContext()
  const {theme, toggleTheme} = useUISettings()

  return (
    <div className={styles.sideBar}>
      <div className={styles.sideBarTop}>
        <Game7Logo />
        <div className={styles.navigation}>
          {navigationItems.map((item) => (
            <div
              className={location.pathname.startsWith(item.navigateTo) ? styles.selectedNavButton : styles.navButton}
              onClick={() => navigate(item.navigateTo)}
              key={item.name}
            >
              {item.icon}
              {item.name}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.footer}>
        <div className={styles.themesContainer}>
          <div className={theme === 'dark' ? styles.selectedThemeButton : styles.themeButton} onClick={toggleTheme}>
            <IconDark className={styles.themeIcon} /> Dark
          </div>
          <div className={theme === 'light' ? styles.selectedThemeButton : styles.themeButton} onClick={toggleTheme}>
            <IconLight className={styles.themeIcon} /> Light
          </div>
        </div>
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
