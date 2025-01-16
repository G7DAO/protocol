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
    const { connectedAccount } = useBlockchainContext()
    const pendingTransacions = usePendingTransactions(connectedAccount)
    const [notificationsOffset] = useState(0)
    const [notificationsLimit] = useState(10)
    const [selectedToken, setSelectedToken] = useState<SwapWidgetToken | undefined>(XAI)
    const [amount] = useState('0.1')
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
                        defaultFromToken={XAI}
                        defaultToToken={XAI}
                        defaultAmount={amount}
                        lockFromToken={true}
                        lockToToken={true}
                        lockChainId={XAI.chainId}
                        defaultToAddress={'0x0' as Address}
                        supportedWalletVMs={['evm']}
                        onConnectWallet={open}
                        onAnalyticEvent={(eventName, data) => {
                            console.log('Analytic Event', eventName, data)
                        }}
                    />
                    <div className={styles.canonicalLink}>
                        Bridge with Canonical
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RelayPage


export const XAI: SwapWidgetToken = {
    chainId: 660279,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    name: 'XAI',
    symbol: 'XAI',
    logoURI: 'https://2248955668-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhE4weeNpCJSNUXnecN1R%2Ficon%2FgJEa5WUcw0RjBfGqTNof%2Fxai%20symbol%20red%20svg.svg?alt=media&token=9131a0bf-a73d-4052-a957-fd69884aee62'
}
