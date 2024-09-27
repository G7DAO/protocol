// React and related libraries
import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Outlet } from 'react-router-dom'
// Styles
import styles from './MainLayout.module.css'
import IconDroplets02 from '@/assets/IconDroplets02'
import IconWallet04 from '@/assets/IconWallet04'
// Local components and assets
import DesktopSidebar from '@/layouts/MainLayout/DesktopSidebar'
import MobileSidebar from '@/layouts/MainLayout/MobileSidebar'
import { useMediaQuery } from '@mantine/hooks'

interface MainLayoutProps {}

const NAVIGATION_ITEMS = [
  { name: 'bridge', navigateTo: '/bridge', icon: <IconWallet04 /> },
  { name: 'faucet', navigateTo: '/faucet', icon: <IconDroplets02 /> }
]
const MainLayout: React.FC<MainLayoutProps> = ({}) => {
  const smallView = useMediaQuery('(max-width: 1199px)')
  return (
    <div className={styles.container}>
      <Helmet>
        <meta name='title' content='G7 Network Developer Hub' />
        <meta
          name='description'
          content='Launch your game on G7 network and gain access to the growing Game7 community of players and tools'
        />
        <meta name='robots' content='index, follow' />
      </Helmet>
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
