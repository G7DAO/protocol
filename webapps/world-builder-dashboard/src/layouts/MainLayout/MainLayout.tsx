// React and related libraries
import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
// Styles
import styles from './MainLayout.module.css'
import IconDocumentation from '@/assets/IconDocumentation'
import IconDroplets02 from '@/assets/IconDroplets02'
import IconExplorer from '@/assets/IconExplorer'
import IconWallet04 from '@/assets/IconWallet04'
// Local components and assets
import DesktopSidebar from '@/layouts/MainLayout/DesktopSidebar'
import MobileSidebar from '@/layouts/MainLayout/MobileSidebar'
import { useMediaQuery } from '@mantine/hooks'

interface MainLayoutProps {}

const MainLayout: React.FC<MainLayoutProps> = ({}) => {
  const location = useLocation()

  const NAVIGATION_ITEMS = [
    {
      name: 'faucet',
      navigateTo: '/faucet',
      icon: <IconDroplets02 stroke={location.pathname === '/faucet' ? '#fff' : '#B9B9B9'} />
    },
    {
      name: 'bridge',
      navigateTo: '/bridge',
      icon: <IconWallet04 stroke={location.pathname === '/bridge' ? '#fff' : '#B9B9B9'} />
    },
    {
      name: 'explorer',
      navigateTo: 'https://testnet.game7.io/',
      icon: <IconExplorer stroke={'#B9B9B9'} />
    },
    {
      name: 'documentation',
      navigateTo: 'https://wiki.game7.io/g7-developer-resource/bWmdEUXVjGpgIbH3H5XT/',
      icon: <IconDocumentation stroke={'#B9B9B9'} />
    }
  ]

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
