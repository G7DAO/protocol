// React and hooks
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
// Styles
import bridgeStyles from '../BridgePage/BridgePage.module.css'
import styles from './RelayPage.module.css'
// Components
import NotificationsButton from '@/components/notifications/NotificationsButton'
import { FloatingNotification } from '@/components/notifications/NotificationsDropModal'
// Contexts
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
// Hooks
import { useNotifications, usePendingTransactions } from '@/hooks/useL2ToL1MessageStatus'
import { SwapWidget } from '@reservoir0x/relay-kit-ui'
import { Address } from "viem"
import { useNavigate } from 'react-router-dom'
import { G7_G7, TOKENS, USDC_ARB } from '@/utils/relayConfig'
import { createThirdwebClient } from 'thirdweb'
import { useConnectModal } from 'thirdweb/react'
export interface SwapWidgetToken {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    verified?: boolean;
}



const RelayPage = () => {
    const { connectedAccount, selectedNetworkType, setConnectedAccount, setWallet } = useBlockchainContext()
    const {connect} = useConnectModal()
    const navigate = useNavigate()
    const pendingTransacions = usePendingTransactions(connectedAccount)
    const [notificationsOffset] = useState(0)
    const [notificationsLimit] = useState(10)

    const notifications = useNotifications(connectedAccount, notificationsOffset, notificationsLimit)
    const { newNotifications, refetchNewNotifications } = useBridgeNotificationsContext()

    const queryClient = useQueryClient()

    if (selectedNetworkType === 'Testnet') {
        navigate('/faucet')
    }

    const connectWallet = async () => {
        const client = createThirdwebClient({
            clientId: '6410e98bc50f9521823ca83e255e279d'
        })
        const wallet = await connect({ client })
        setConnectedAccount(wallet.getAccount()?.address ?? ''); setWallet(wallet)
    }


    useEffect(() => {
        if (pendingTransacions.data && connectedAccount) {
            queryClient.refetchQueries({ queryKey: ['incomingMessages'] })
            refetchNewNotifications(connectedAccount)
        }
    }, [pendingTransacions.data, connectedAccount])

    return (
        <div className={bridgeStyles.container}>
            <div className={bridgeStyles.top}>
                <div className={bridgeStyles.headerContainer}>
                    {notifications.data && <FloatingNotification notifications={newNotifications} />}
                    <div className={styles.title}>Relay</div>
                    <NotificationsButton notifications={notifications.data ?? []} />
                </div>
            </div>
            <div className={styles.viewContainer}>
                <div className={styles.mainContainer}>
                    <SwapWidget
                        key={connectedAccount}
                        defaultFromToken={USDC_ARB}
                        defaultToToken={G7_G7}
                        defaultToAddress={connectedAccount as Address}
                        supportedWalletVMs={['evm']}
                        onConnectWallet={connectWallet}
                        onAnalyticEvent={(eventName, data) => {
                            console.log('Analytic Event', eventName, data)
                        }}
                        tokens={TOKENS}
                    />
                    <div className={styles.canonicalLink} onClick={() => navigate('/bridge')}>
                        Bridge with Canonical
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RelayPage