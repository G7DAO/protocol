// React and related libraries
import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
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
import IconCamelot from '@/assets/IconCamelot'
import IconSafe from '@/assets/IconSafe'

interface MainLayoutProps { }

export interface NavigationItem {
  name: string;
  navigateTo: string;
  Icon: React.FC<{ isHovered?: boolean }>;
}

const MainLayout: React.FC<MainLayoutProps> = ({ }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedNetworkType } = useBlockchainContext()

  const TESTNET_NAVIGATION_ITEMS: NavigationItem[] = [
    {
      name: 'faucet',
      navigateTo: '/faucet',
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconDroplets02
          className={styles.simpleIcon}
          stroke={location.pathname.startsWith('/faucet') ? '#fff' : '#B9B9B9'}
          isHovered={isHovered}
        />
      )
    },
    {
      name: 'bridge',
      navigateTo: '/bridge',
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconWallet04
          className={styles.simpleIcon}
          stroke={location.pathname.startsWith('/bridge') ? '#fff' : '#B9B9B9'} isHovered={isHovered}
        />
      )
    },
    {
      name: 'explorer',
      navigateTo: selectedNetworkType === 'Testnet' ? `https://testnet.game7.io/` : `https://mainnet.game7.io`,
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconExplorer className={styles.simpleIcon} stroke={'#B9B9B9'} isHovered={isHovered} />
      )
    },
    {
      name: 'documentation',
      navigateTo: 'https://docs.game7.io/',
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconDocumentation className={styles.simpleIcon} stroke={'#B9B9B9'} isHovered={isHovered} />
      )
    },
    {
      name: 'safe',
      navigateTo: 'https://safe.game7.io/welcome/accounts',
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconSafe stroke={'#B9B9B9'} isHovered={isHovered} />
      )
    },
    {
      name: 'camelot',
      navigateTo: 'https://app.camelot.exchange/',
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconCamelot stroke={'#B9B9B9'} isHovered={isHovered} />
      )
    }
  ]

  const MAINNET_NAVIGATION_ITEMS: NavigationItem[] = [
    {
      name: 'bridge',
      navigateTo: '/bridge',
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconWallet04
          className={styles.simpleIcon}
          stroke={location.pathname.startsWith('/bridge') ? '#fff' : '#B9B9B9'} isHovered={isHovered}
        />
      )
    },
    {
      name: 'relay bridge',
      navigateTo: '/relay',
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconRelay
          className={styles.icomButton}
          stroke={location.pathname.startsWith('/relay') ? '#fff' : '#B9B9B9'}
          isHovered={isHovered}
        />
      )
    },
    {
      name: 'explorer',
      navigateTo: selectedNetworkType === 'Testnet' ? `https://testnet.game7.io/` : `https://mainnet.game7.io`,
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconExplorer className={styles.simpleIcon} stroke={'#B9B9B9'} isHovered={isHovered} />
      )
    },
    {
      name: 'documentation',
      navigateTo: 'https://docs.game7.io/',
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconDocumentation className={styles.simpleIcon} stroke={'#B9B9B9'} isHovered={isHovered} />
      )
    },
    {
      name: 'safe',
      navigateTo: 'https://safe.game7.io/welcome/accounts',
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconSafe stroke={'#B9B9B9'} isHovered={isHovered} />
      )
    },
    {
      name: 'camelot',
      navigateTo: 'https://app.camelot.exchange/',
      Icon: ({ isHovered }: { isHovered?: boolean }) => (
        <IconCamelot stroke={'#B9B9B9'} isHovered={isHovered} />
      )
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
          <div className={styles.linkTextMobile} onClick={() => navigate('/terms')}>
            Terms
          </div>
          <div className={styles.linkTextMobile} onClick={() => navigate('/privacy')}>
            Privacy
          </div>
        </div>
      )}
    </div>
  )
}

export default MainLayout
