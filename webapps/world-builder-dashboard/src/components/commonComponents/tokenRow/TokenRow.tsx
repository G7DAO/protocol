import React from 'react'
import styles from './TokenRow.module.css'

interface TokenRowProps {
    name: string,
    symbol: string,
    balance: string
    Icon: React.FC<React.SVGProps<SVGSVGElement>>
}

const TokenRow: React.FC<TokenRowProps> = ({ name, symbol, balance, Icon }) => {
    return (
        <div className={styles.tokenRow}>
            <div className={styles.tokenInformation}>
                <div className={styles.tokenIconContainer}>
                    <Icon className={styles.token}/>
                </div>
                <div className={styles.tokenTextContainer}>
                    <div className={styles.tokenTitle}>
                        {name}
                    </div>
                    <div className={styles.tokenSymbol}>
                        {symbol}
                    </div>
                </div>
            </div>
            <div className={styles.balanceText}>
                {balance}
            </div>
        </div>
    )
}

export default TokenRow