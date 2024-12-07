import React, { useEffect, useState } from 'react'
import { getNetworks, L3_NETWORK } from '../../../../constants'
import TokenRow from '../tokenRow/TokenRow'
import styles from './WalletButton.module.css'
import { Modal } from 'summon-ui/mantine'
import IconFullScreen from '@/assets/IconFullScreen'
import IconWallet04 from '@/assets/IconWallet04'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import useNativeBalance from '@/hooks/useNativeBalance'
import { getTokensForNetwork, Token } from '@/utils/tokens'

interface WalletButtonProps { }

const WalletButton: React.FC<WalletButtonProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const { connectedAccount, chainId, selectedNetworkType } = useBlockchainContext()
  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const { data: nativeBalance } = useNativeBalance({
    account: connectedAccount,
    rpc: getNetworks(selectedNetworkType)?.find((network) => network.chainId === chainId)?.rpcs[0] || L3_NETWORK.rpcs[0]
  })

  const getTokens = async () => {
    const _tokens = getTokensForNetwork(chainId, connectedAccount)
    setTokens(_tokens)
  }

  useEffect(() => {
    getTokens()
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
              ? `${Number(nativeBalance).toFixed(4)} ${getNetworks(selectedNetworkType)?.find((network) => network.chainId === chainId)?.nativeCurrency?.symbol}`
              : 'Fetching...'}
          </div>
        </div>
        <div className={styles.iconContainer}>
          <IconFullScreen className={styles.iconButton}/>
        </div>
      </div>
      <Modal
        opened={isModalOpen}
        onClose={handleModalClose}
        radius={'12px'}
        padding={'24px'}
        size={'678px'}
        title={'Wallet Balance'}
        classNames={{ title: styles.modalTitle, header: styles.modalHeader, close: styles.modalClose }}
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
