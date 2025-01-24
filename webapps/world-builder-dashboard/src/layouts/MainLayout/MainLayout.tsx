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
import IconRelay from '@/assets/IconRelay'

interface MainLayoutProps { }

const MainLayout: React.FC<MainLayoutProps> = ({ }) => {
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
      navigateTo: selectedNetworkType === 'Testnet' ? `https://testnet.game7.io/` : `https://mainnet.game7.io`,
      icon: <IconExplorer stroke={'#B9B9B9'} />
    },
    {
      name: 'documentation',
      navigateTo: 'https://docs.game7.io/',
      icon: <IconDocumentation stroke={'#B9B9B9'} />
    }
  ]

  const MAINNET_NAVIGATION_ITEMS = [
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
      name: 'relay bridge',
      navigateTo: '/relay',
      icon: (
        <IconRelay
          className={styles.icomButton}
          stroke={location.pathname.startsWith('/relay') ? '#fff' : '#B9B9B9'}
        />
      )
    },
    {
      name: 'explorer',
      navigateTo: selectedNetworkType === 'Testnet' ? `https://testnet.game7.io/` : `https://mainnet.game7.io`,
      icon: <IconExplorer stroke={'#B9B9B9'} />
    },
    {
      name: 'documentation',
      navigateTo: 'https://docs.game7.io/',
      icon: <IconDocumentation stroke={'#B9B9B9'} />
    }
  ]
  const NAVIGATION_ITEMS = selectedNetworkType === 'Testnet' ? TESTNET_NAVIGATION_ITEMS : MAINNET_NAVIGATION_ITEMS

  const smallView = useMediaQuery('(max-width: 1199px)')
  return (
    <div className={styles.container}>
      {smallView ? (
        <MobileSidebar navigationItems={NAVIGATION_ITEMS} />
      ) : (
        <DesktopSidebar navigationItems={NAVIGATION_ITEMS} />
      )}
      <Outlet />
      {smallView && (
        <div className={styles.links}>
          <div className={styles.linkTextMobile}>
            Terms
          </div>
          <div className={styles.linkTextMobile}>
            Privacy
          </div>
        </div>
      )}
    </div>
  )
}

export default MainLayout
