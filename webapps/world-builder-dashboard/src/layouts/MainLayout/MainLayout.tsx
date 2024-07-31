// React and related libraries
import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
// Styles
import styles from './MainLayout.module.css'
import IconDroplets02 from '@/assets/IconDroplets02'
import IconGame7 from '@/assets/IconGame7'
import IconGame7Logo from '@/assets/IconGame7Logo'
import IconLogout from '@/assets/IconLogout'
import IconWallet04 from '@/assets/IconWallet04'
// Local components and assets
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'

interface MainLayoutProps {}

const NAVIGATION_ITEMS = [
  { name: 'bridge', navigateTo: '/bridge', icon: <IconWallet04 /> },
  { name: 'faucet', navigateTo: '/faucet', icon: <IconDroplets02 /> }
]
const MainLayout: React.FC<MainLayoutProps> = ({}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount, isMetaMask, disconnectWallet } = useBlockchainContext()

  return (
    <div className={styles.container}>
      <div className={styles.sideBar}>
        <div className={styles.sideBarTop}>
          <div className={styles.logoContainer}>
            <div className={styles.logoWrapper}>
              <IconGame7Logo />
              <IconGame7 />
            </div>
          </div>
          <div className={styles.navigation}>
            {NAVIGATION_ITEMS.map((item) => (
              <div
                className={location.pathname.startsWith(item.navigateTo) ? styles.selectedNavButton : styles.navButton}
                onClick={() => navigate(item.navigateTo)}
              >
                {item.icon}
                {item.name}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.footer}>
          {connectedAccount && (
            <div className={styles.web3AddressContainer}>
              <div
                className={styles.web3address}
              >{`${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`}</div>
              {isMetaMask && <IconLogout onClick={disconnectWallet} className={styles.disconnectButton} />}
            </div>
          )}
        </div>
      </div>
      <Outlet />
    </div>
  )
}

export default MainLayout
