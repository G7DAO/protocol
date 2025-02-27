import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './MainLayout.module.css'
import IconExternalLink from '@/assets/IconExternalLink'
import IconLogout from '@/assets/IconLogout'
import NetworkToggle from '@/components/commonComponents/networkToggle/NetworkToggle'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Game7Logo from '@/layouts/MainLayout/Game7Logo'
import { NavigationItem } from './MainLayout'
import { ConnectButton, darkTheme } from 'thirdweb/react'
import { useThirdWeb } from '@/hooks/useThirdWeb'

interface DesktopSidebarProps {
  navigationItems: NavigationItem[]
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ navigationItems }) => {
  const [isHoveredElement, setIsHovereredElement] = useState('');
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount, disconnectWallet, selectedNetworkType, setConnectedAccount, setWallet, wallet} =
    useBlockchainContext()
  const { client, wallets } = useThirdWeb()

  return (
    <div className={styles.sideBar}>
      <div className={styles.sideBarTop}>
        <Game7Logo />
        <NetworkToggle />
        <div className={styles.navigation}>
          {navigationItems.map(({ Icon, ...item }) => (
            <div
              onMouseEnter={() => setIsHovereredElement(item.name)}
              onMouseLeave={() => setIsHovereredElement('')}
              aria-disabled={item.name === 'faucet' && selectedNetworkType === 'Mainnet'}
              className={location.pathname.startsWith(item.navigateTo) ? styles.selectedNavButton : styles.navButton}
              onClick={() => {
                if (item.name === 'documentation' || item.name === 'explorer' || item.name === 'camelot' || item.name === 'safe') {
                  window.open(item.navigateTo, '_blank')
                } else if (!(item.name === 'faucet' && selectedNetworkType === 'Mainnet')) {
                  navigate(item.navigateTo)
                }
              }}
              key={item.name}
            >
              <div className={styles.navBeginning}>
                <Icon isHovered={isHoveredElement === item.name} />
                {item.name}
              </div>
              <div style={{ display: 'flex' }}>
                {item.name === 'documentation' || item.name === 'explorer' || item.name === 'camelot' || item.name === 'safe' ? (
                  <IconExternalLink className={styles.iconButton} />
                ) : (
                  <></>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          {connectedAccount && wallet ? (
            <div className={styles.web3AddressContainer}>
              <div className={styles.web3address}>
                {`${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`}
              </div>
              {<IconLogout onClick={disconnectWallet} className={styles.iconButton} />}
            </div>
          ) :
            <ConnectButton
              client={client}
              wallets={wallets}
              connectModal={{ size: "compact" }}
              theme={darkTheme({
                colors: {
                  danger: "hsl(358, 76%, 47%)",
                  success: "hsl(151, 55%, 42%)",
                  tooltipBg: "hsl(240, 6%, 94%)",
                  modalBg: "hsl(228, 12%, 8%)",
                  separatorLine: "hsl(228, 12%, 17%)",
                  borderColor: "hsl(228, 12%, 17%)",
                  primaryButtonBg: "hsl(4, 86%, 58%)",
                  primaryButtonText: "hsl(0, 0%, 100%)"
                },
              })}
              connectButton={{ label: "Connect Wallet", style: { height: '40px', width: '100%' } }}
              onConnect={(wallet) => { setConnectedAccount(wallet.getAccount()?.address ?? ''); setWallet(wallet) }}
            />}
          <div className={styles.linkContainer}>
            <a href="https://game7.io/terms" target="_blank" className={styles.linkText} rel="noreferrer">
              Terms of Service
            </a>
            <a href="https://game7.io/privacy" target="_blank" className={styles.linkText} rel="noreferrer">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DesktopSidebar
