import React, { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './MainLayout.module.css'
import IconLogout from '@/assets/IconLogout'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Game7Logo from '@/layouts/MainLayout/Game7Logo'
import IconWallet04 from '@/assets/IconWallet04'
import IconFullScreen from '@/assets/IconFullScreen'

interface DesktopSidebarProps {
  navigationItems: { name: string; navigateTo: string; icon: ReactNode }[]
}
const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ navigationItems }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount, isMetaMask, disconnectWallet } = useBlockchainContext()

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
        <div className={styles.walletButtonContainer}>
          <div className={styles.iconWalletBalance}>
            <IconWallet04 />
            <div className={styles.balance}>Balance: </div>
          </div>
          <div className={styles.iconContainer}><IconFullScreen /></div>
        </div>
        {connectedAccount && (
          <div className={styles.web3AddressContainer}>
            <div
              className={styles.web3address}
            >{`${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`}</div>
            {isMetaMask && <IconLogout onClick={disconnectWallet} className={styles.iconButton} />}
          </div>
        )}
      </div>
    </div>
  )
}

export default DesktopSidebar
