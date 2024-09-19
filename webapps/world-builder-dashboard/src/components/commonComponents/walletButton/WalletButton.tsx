import React, { useEffect, useState } from 'react'
import { ETH_USD_CONTRACT_ADDRESS, L3_NETWORK } from '../../../../constants'
import TokenRow from '../tokenRow/TokenRow'
import styles from './WalletButton.module.css'
import { ethers } from 'ethers'
import { Modal } from 'summon-ui/mantine'
import IconEthereum from '@/assets/IconEthereum'
import IconFullScreen from '@/assets/IconFullScreen'
import IconG7T from '@/assets/IconG7T'
import IconUSDC from '@/assets/IconUSDC'
import IconWallet04 from '@/assets/IconWallet04'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import useNativeBalance from '@/hooks/useNativeBalance'
import { getTokensForNetwork } from '@/utils/tokens'
import { roundToDecimalPlaces, ZERO_ADDRESS } from '@/utils/web3utils'

interface WalletButtonProps {}

const WalletButton: React.FC<WalletButtonProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [tokens, setTokens] = useState<any[]>([])
  const { walletProvider } = useBlockchainContext()
  const { connectedAccount } = useBlockchainContext()
  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const { data: l3NativeBalance, isFetching: isFetchingL3NativeBalance } = useNativeBalance({
    account: connectedAccount,
    rpc: L3_NETWORK.rpcs[0]
  })

  useEffect(() => {
    const tokens_ = getTokensForNetwork(walletProvider?.network?.chainId)
    setTokens(tokens_)
  }, [walletProvider])

  return (
    <>
      <div
        className={styles.walletButtonContainer}
        onClick={() => {
          setIsModalOpen(true)
        }}
      >
        <div className={styles.iconWalletBalance}>
          <IconWallet04 />
          <div className={styles.balance}>
            Balance:{' '}
            {isFetchingL3NativeBalance
              ? ''
              : roundToDecimalPlaces(Number(l3NativeBalance), 2) + ' ' + L3_NETWORK.nativeCurrency?.symbol}
          </div>
        </div>
        <div className={styles.iconContainer}>
          <IconFullScreen />
        </div>
      </div>
      <Modal
        opened={isModalOpen}
        onClose={handleModalClose}
        radius={'12px'}
        padding={'24px'}
        size={'678px'} 
        title={'Wallet Balance'}
        classNames={{ title: styles.modalTitle, header: styles.modalHeader }}
        shadow='box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03);'
      >
        <div className={styles.modalContent}>
          <div className={styles.tokensContainer}>
            {tokens.map((token, index) => (
              <React.Fragment key={token.symbol}>
                <TokenRow name={token.name} symbol={token.symbol} balance={''} Icon={token.Icon} address={token.address} />
                {index !== tokens.length - 1 && <div className={styles.gap} />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className={styles.border} />
        <div className={styles.footerContainer}>
          <div className={styles.closeButton} onClick={handleModalClose}>
            Close
          </div>
        </div>
      </Modal>
    </>
  )
}

export default WalletButton
