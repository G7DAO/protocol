// React and related libraries
import React from 'react'
import { Outlet } from 'react-router-dom'
// Styles
import styles from './MainLayout.module.css'
import IconDroplets02 from '@/assets/IconDroplets02'
// import IconG7T from '@/assets/IconG7T'
import IconWallet04 from '@/assets/IconWallet04'
// Local components and assets
import DesktopSidebar from '@/layouts/MainLayout/DesktopSidebar'
import MobileSidebar from '@/layouts/MainLayout/MobileSidebar'
import { useMediaQuery } from '@mantine/hooks'

interface MainLayoutProps {}

const NAVIGATION_ITEMS = [
  { name: 'bridge', navigateTo: '/bridge', icon: <IconWallet04 /> },
  { name: 'faucet', navigateTo: '/faucet', icon: <IconDroplets02 /> },
  // { name: 'stake', navigateTo: '/stake', icon: <IconG7T /> }
]
const MainLayout: React.FC<MainLayoutProps> = ({}) => {
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
