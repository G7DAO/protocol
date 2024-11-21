import React, { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './MainLayout.module.css'
import { Tooltip } from 'summon-ui/mantine'
import IconExternalLink from '@/assets/IconExternalLink'
import IconInfoCircle from '@/assets/IconInfoCircle'
import IconLock from '@/assets/IconLock'
import IconLogout from '@/assets/IconLogout'
import NetworkToggle from '@/components/commonComponents/networkToggle/NetworkToggle'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Game7Logo from '@/layouts/MainLayout/Game7Logo'

interface DesktopSidebarProps {
  navigationItems: { name: string; navigateTo: string; icon: ReactNode }[]
}
const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ navigationItems }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount, isMetaMask, connectWallet, disconnectWallet, isConnecting, selectedNetworkType } =
    useBlockchainContext()

  return (
    <div className={styles.sideBar}>
      <div className={styles.sideBarTop}>
        <Game7Logo />
        <NetworkToggle />
        <div className={styles.navigation}>
          {navigationItems.map((item) => (
            <div
              aria-disabled={item.name === 'faucet' && selectedNetworkType === 'Mainnet'}
              className={location.pathname.startsWith(item.navigateTo) ? styles.selectedNavButton : styles.navButton}
              onClick={() => {
                if (item.name === 'documentation' || item.name === 'explorer') {
                  window.open(item.navigateTo, '_blank')
                } else if (!(item.name === 'faucet' && selectedNetworkType === 'Mainnet')) {
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
                  <IconExternalLink className={styles.icon} />
                ) : item.name === 'faucet' && selectedNetworkType === 'Testnet' ? (
                  <Tooltip arrowSize={8} radius={'8px'} label={'Only available on Testnet'} withArrow>
                    <IconInfoCircle stroke='#fff' />
                  </Tooltip>
                ) : item.name === 'faucet' && selectedNetworkType === 'Mainnet' ? (
                  <Tooltip arrowSize={8} radius={'8px'} label={'Only available on Testnet'} withArrow>
                    <IconLock stroke='#fff' />
                  </Tooltip>
                ) : (
                  <></>
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
