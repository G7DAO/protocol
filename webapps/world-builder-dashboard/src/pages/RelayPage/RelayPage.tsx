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
import { G7_ARB, G7_G7, TOKENS } from '@/utils/relayConfig'
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
    const { connectedAccount, connectWallet } = useBlockchainContext()
    const navigate = useNavigate()
    const pendingTransacions = usePendingTransactions(connectedAccount)
    const [notificationsOffset] = useState(0)
    const [notificationsLimit] = useState(10)
    const [key, setKey] = useState(0) // Add this line

    useEffect(() => {
        setKey(prev => prev + 1)
    }, [connectedAccount])
    

    const notifications = useNotifications(connectedAccount, notificationsOffset, notificationsLimit)
    const { newNotifications, refetchNewNotifications } = useBridgeNotificationsContext()

    const queryClient = useQueryClient()
    
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
                        key={key}
                        defaultFromToken={G7_G7}
                        defaultToToken={G7_ARB}
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