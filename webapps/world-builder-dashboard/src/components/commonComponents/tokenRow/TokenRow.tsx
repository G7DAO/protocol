import React from 'react'
import styles from './TokenRow.module.css'
import { ZERO_ADDRESS } from '@/utils/web3utils'
import useNativeBalance from '@/hooks/useNativeBalance'
import useERC20Balance from '@/hooks/useERC20Balance'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import useTokenBalance from '@/hooks/useTokenBalance'

interface TokenRowProps {
    name: string
    address: string
    symbol: string
    rpc: string
    Icon: React.FC<React.SVGProps<SVGSVGElement>>
}

const useTokenBalance = (address: string, rpc: string, connectedAccount: string | undefined) => {
    if (address === ZERO_ADDRESS) {
        const { data: balance, isFetching } = useNativeBalance({
            account: connectedAccount,
            rpc,
        });
        return { balance, isFetching };
    } else {
        const { data: balance, isFetching } = useERC20Balance({
            tokenAddress: address,
            account: connectedAccount,
            rpc,
        });
        const formattedBalance = balance?.formatted
        return { balance: formattedBalance, isFetching };
    }
};


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
                {balance ? `${Number(balance).toFixed(4)}` : '0'}
            </div>
        </div>
    )
}

export default TokenRow
