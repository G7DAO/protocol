import React, { useEffect, useState } from 'react'
import styles from './WalletButton.module.css'
import IconWallet04 from '@/assets/IconWallet04'
import IconFullScreen from '@/assets/IconFullScreen'
import { Modal } from 'summon-ui/mantine'
import useNativeBalance from '@/hooks/useNativeBalance'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { L3_NETWORK } from '../../../../constants'
import { roundToDecimalPlaces } from '@/utils/web3utils'
import IconUSDC from '@/assets/IconUSDC'
import IconG7T from '@/assets/IconG7T'

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
                padding={'24px'}
                size={'678px'}
                title={'Wallet Balance'}
                classNames={{ header: styles.header, title: styles.title }}
                shadow='box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03);'
            >
                <div className={styles.modalContent}>
                    <div className={styles.tokensContainer}>
                        <div className={styles.tokenRow}>
                            <div className={styles.tokenInformation}>
                                <div className={styles.tokenIconContainer}>
                                    <IconUSDC className={styles.token} />
                                </div>
                                <div className={styles.tokenTextContainer}>
                                    <div className={styles.tokenTitle}>
                                        USDC
                                    </div>
                                    <div className={styles.tokenSymbol}>
                                        USDC
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.tokenRow}>
                            <div className={styles.tokenInformation}>
                                <div className={styles.tokenIconContainer}>
                                    <IconG7T className={styles.token} />
                                </div>
                                <div className={styles.tokenTextContainer}>
                                    <div className={styles.tokenTitle}>
                                        G7DAO
                                    </div>
                                    <div className={styles.tokenSymbol}>
                                        G7T
                                    </div>
                                </div>
                            </div>
                            <div className={styles.balanceText}>
                                1.2
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default WalletButton