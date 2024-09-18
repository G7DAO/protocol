import React, { useEffect, useState } from 'react'
import styles from './WalletButton.module.css'
import IconWallet04 from '@/assets/IconWallet04'
import IconFullScreen from '@/assets/IconFullScreen'
import { Modal } from 'summon-ui/mantine'
import useNativeBalance from '@/hooks/useNativeBalance'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { L3_NETWORK } from '../../../../constants'
import { roundToDecimalPlaces } from '@/utils/web3utils'

interface WalletButtonProps { }

const WalletButton: React.FC<WalletButtonProps> = () => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const { connectedAccount } = useBlockchainContext()
    const handleModalClose = () => {
        setIsModalOpen(false)
    }

    const { data: l3NativeBalance, isFetching: isFetchingL3NativeBalance } = useNativeBalance({
        account: connectedAccount,
        rpc: L3_NETWORK.rpcs[0]
    })

    useEffect(() => {
        console.log(isFetchingL3NativeBalance)
        console.log(l3NativeBalance)
    }, [isFetchingL3NativeBalance])


    return (
        <>
            <div className={styles.walletButtonContainer} onClick={() => { setIsModalOpen(true) }}>
                <div className={styles.iconWalletBalance}>
                    <IconWallet04 />
                    <div className={styles.balance}>Balance: {isFetchingL3NativeBalance ? '' : roundToDecimalPlaces(Number(l3NativeBalance), 2) + ' ' + L3_NETWORK.nativeCurrency?.symbol}</div>
                </div>
                <div className={styles.iconContainer}><IconFullScreen /></div>
            </div>
            <Modal opened={isModalOpen} onClose={handleModalClose}
                radius={'12px'}
                size={'678px'}
                title={'Wallet Balance'}
            />
        </>
    )
}

export default WalletButton