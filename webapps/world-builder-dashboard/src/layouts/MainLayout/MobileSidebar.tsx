import React, { ReactNode, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import parentStyles from './MainLayout.module.css'
import styles from './MobileSidebar.module.css'
import IconExternalLink from '@/assets/IconExternalLink'
import IconHamburgerLanding from '@/assets/IconHamburgerLanding'
import IconLogoutLarge from '@/assets/IconLogoutLarge'
import NetworkToggle from '@/components/commonComponents/networkToggle/NetworkToggle'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Game7Logo from '@/layouts/MainLayout/Game7Logo'
import { createThirdwebClient } from 'thirdweb'
import { ConnectButton, darkTheme } from 'thirdweb/react'
import { createWallet } from 'thirdweb/wallets'

interface MobileSidebarProps {
  navigationItems: { name: string; navigateTo: string; icon: ReactNode }[]
}
const MobileSidebar: React.FC<MobileSidebarProps> = ({ navigationItems }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { connectedAccount, isMetaMask, disconnectWallet, wallet, selectedNetworkType, setConnectedAccount, setWallet } =
    useBlockchainContext()
  const [isExpanded, setIsExpanded] = useState(false)
  const client = createThirdwebClient({
    clientId: '6410e98bc50f9521823ca83e255e279d'
  })

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
    createWallet("global.safe"),
  ]


  return (
    <>
      <div className={styles.container}>
        <Game7Logo />
        <div className={styles.networkAndIconContainer} onClick={() => setIsExpanded(!isExpanded)}>
          {!isExpanded && (
            <div
              className={`${styles.networkBadge} ${selectedNetworkType === 'Testnet' ? styles.networkTestnet : styles.networkMainnet}`}
            >
              {selectedNetworkType}
            </div>
          )}
          <div className={styles.iconContainer}>
            <IconHamburgerLanding className={parentStyles.iconButton} />
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className={styles.expanded}>
          <div className={styles.spacer} />
          <NetworkToggle />
          <div className={styles.navigation}>
            {navigationItems.map((item) => (
              <div
                className={
                  location.pathname.startsWith(item.navigateTo)
                    ? parentStyles.selectedNavButton
                    : parentStyles.navButton
                }
                onClick={() => {
                  setIsExpanded(false)
                  if (item.name === 'documentation' || item.name === 'explorer') {
                    window.open(item.navigateTo, '_blank')
                  } else if (!(item.name === 'faucet' && selectedNetworkType === 'Mainnet')) {
                    navigate(item.navigateTo)
                  }
                }}
                key={item.name}
              >
                <div className={parentStyles.navBeginning}>
                  {item.icon}
                  {item.name}
                </div>
                <div style={{ display: 'flex' }}>
                  {item.name === 'documentation' || item.name === 'explorer' ? (
                    <IconExternalLink className={styles.icon} />
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            ))}
            <div className={styles.spacer} />
            {connectedAccount && wallet ? (
              <div className={styles.web3AddressContainer}>
                <div className={parentStyles.web3address}>
                  {`${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`}
                </div>
                {isMetaMask && <IconLogoutLarge onClick={() => disconnectWallet()} className={parentStyles.iconButton} />}
              </div>
            ) :
              <ConnectButton
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
                connectModal={{
                  size: "compact",
                  showThirdwebBranding: false,
                }}
              />}
          </div>
          <div className={styles.backdrop} onClick={() => setIsExpanded(false)} />
        </div>
      )}
    </>
  )
}

export default MobileSidebar
