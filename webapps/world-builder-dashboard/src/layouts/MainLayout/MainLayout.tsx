// React and related libraries
import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
// Styles
import styles from './MainLayout.module.css'
import IconDocumentation from '@/assets/IconDocumentation'
import IconDroplets02 from '@/assets/IconDroplets02'
import IconExplorer from '@/assets/IconExplorer'
import IconWallet04 from '@/assets/IconWallet04'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
// Local components and assets
import DesktopSidebar from '@/layouts/MainLayout/DesktopSidebar'
import MobileSidebar from '@/layouts/MainLayout/MobileSidebar'
import { useMediaQuery } from '@mantine/hooks'

interface MainLayoutProps {}

const MainLayout: React.FC<MainLayoutProps> = ({}) => {
  const location = useLocation()
  const { selectedNetworkType } = useBlockchainContext()

  const TESTNET_NAVIGATION_ITEMS = [
    {
      name: 'faucet',
      navigateTo: '/faucet',
      icon: <IconDroplets02 stroke={location.pathname.startsWith('/faucet') ? '#fff' : '#B9B9B9'} />
    },
    {
      name: 'bridge',
      navigateTo: '/bridge',
      icon: (
        <IconWallet04
          className={styles.icomButton}
          stroke={location.pathname.startsWith('/bridge') ? '#fff' : '#B9B9B9'}
        />
      )
    },
    {
      name: 'explorer',
      navigateTo: selectedNetworkType === 'testnet' ? `https://testnet.game7.io/` : `https://mainnet.game7.io`,
      icon: <IconExplorer stroke={'#B9B9B9'} />
    },
    {
      name: 'documentation',
      navigateTo: 'https://docs.game7.io',
      icon: <IconDocumentation stroke={'#B9B9B9'} />
    }
  ]

  const MAINNET_NAVIGATION_ITEMS = TESTNET_NAVIGATION_ITEMS.slice(1, TESTNET_NAVIGATION_ITEMS.length)
  const NAVIGATION_ITEMS = selectedNetworkType === 'testnet' ? TESTNET_NAVIGATION_ITEMS : MAINNET_NAVIGATION_ITEMS

  const smallView = useMediaQuery('(max-width: 1199px)')
  return (
    <div className={styles.container}>
      {smallView ? (
        <MobileSidebar navigationItems={NAVIGATION_ITEMS} />
      ) : (
        <DesktopSidebar navigationItems={NAVIGATION_ITEMS} />
      )}
      <Outlet />
    </div>
  )
}

export default MainLayout
