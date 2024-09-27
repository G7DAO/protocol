import React from 'react'
import styles from './TokenRow.module.css'
import { roundToDecimalPlaces } from '@/utils/web3utils'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import useTokenBalance from '@/hooks/useTokenBalance'

interface TokenRowProps {
    name: string
    address: string
    symbol: string
    rpc: string
    Icon: React.FC<React.SVGProps<SVGSVGElement>>
}

const TokenRow: React.FC<TokenRowProps> = ({ name, address, symbol, rpc, Icon }) => {
    const { connectedAccount } = useBlockchainContext()
    const { balance } = useTokenBalance(address, rpc, connectedAccount);

    return (
        <div className={styles.tokenRow}>
            <div className={styles.tokenInformation}>
                <div className={styles.tokenIconContainer}>
                    <Icon className={styles.token} />
                </div>
                <div className={styles.tokenTextContainer}>
                    <div className={styles.tokenTitle}>{name}</div>
                    <div className={styles.tokenSymbol}>{symbol}</div>
                </div>
            </div>
            <div className={styles.balanceText}>
                {balance ? `${roundToDecimalPlaces(Number(balance), 4)}` : '0'}
            </div>
        </div>
    )
}

export default TokenRow
