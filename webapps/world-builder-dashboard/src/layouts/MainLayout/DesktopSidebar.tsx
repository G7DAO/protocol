import React, { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './MainLayout.module.css'
import IconExternalLink from '@/assets/IconExternalLink'
import IconLogout from '@/assets/IconLogout'
import NetworkToggle from '@/components/commonComponents/networkToggle/NetworkToggle'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Game7Logo from '@/layouts/MainLayout/Game7Logo'
import { createThirdwebClient } from "thirdweb"
import { ConnectButton, darkTheme } from "thirdweb/react"
import { createWallet } from "thirdweb/wallets"
interface DesktopSidebarProps {
  navigationItems: { name: string; navigateTo: string; icon: ReactNode }[]
}
const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ navigationItems }) => {

  const client = createThirdwebClient({
    clientId: "....",
  });

  const wallets = [
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("io.rabby"),
    createWallet("io.zerion.wallet"),
    createWallet("com.trustwallet.app"),
    createWallet("com.bitget.web3"),
    createWallet("org.uniswap"),
    createWallet("com.okex.wallet"),
    createWallet("com.binance"),
  ]

  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount, isMetaMask, disconnectWallet, selectedNetworkType, setConnectedAccount, setWallet, wallet } =
    useBlockchainContext()
  console.log(connectedAccount)

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
              {isMetaMask && <IconLogout onClick={() => disconnectWallet()} className={styles.iconButton} />}
            </div>
          ) : <ConnectButton
            client={client}
            wallets={wallets}
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
            connectModal={{ size: "compact" }}
          />}
          <div className={styles.linkContainer}>
            <div className={styles.linkText} onClick={() => navigate('/terms')}>
              Terms of Service
            </div>
            <div className={styles.linkText} onClick={() => navigate('/privacy')}>
              Privacy Policy
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DesktopSidebar
