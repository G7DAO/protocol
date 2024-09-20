import React, { useEffect, useState } from 'react'
import { ALL_NETWORKS, ETH_USD_CONTRACT_ADDRESS, L3_NETWORK } from '../../../../constants'
import TokenRow from '../tokenRow/TokenRow'
import styles from './WalletButton.module.css'
import { Modal } from 'summon-ui/mantine'
import IconFullScreen from '@/assets/IconFullScreen'
import IconWallet04 from '@/assets/IconWallet04'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import useNativeBalance from '@/hooks/useNativeBalance'
import { getTokensForNetwork } from '@/utils/tokens'
import { roundToDecimalPlaces } from '@/utils/web3utils'

interface WalletButtonProps {}

const WalletButton: React.FC<WalletButtonProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [tokens, setTokens] = useState<any[]>([])
  const { walletProvider, connectedAccount, chainId } = useBlockchainContext()
  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const { data: nativeBalance } = useNativeBalance({
    account: connectedAccount,
    rpc: ALL_NETWORKS.find((network) => network.chainId === chainId)?.rpcs[0]!
  })

  const fetchTokens = async () => {
    const _tokens = getTokensForNetwork(chainId)
    setTokens(_tokens)
  }

  useEffect(() => {
    fetchTokens()
  }, [chainId])

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
            {nativeBalance
              ? roundToDecimalPlaces(Number(nativeBalance), 4) +
                ' ' +
                ALL_NETWORKS.find((network) => network.chainId === chainId)?.nativeCurrency?.symbol
              : ''} 
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
            {tokens.map((token, index) => {
              return (
                <React.Fragment key={token.symbol}>
                  <TokenRow
                    name={token.name}
                    symbol={token.symbol}
                    Icon={token.Icon}
                    address={token.address}
                    rpc={token.rpc}
                  />
                  {index !== tokens.length - 1 && <div className={styles.gap} />}
                </React.Fragment>
              )
            })}
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