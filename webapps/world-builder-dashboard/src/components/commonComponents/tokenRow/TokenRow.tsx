import React, { useEffect, useState } from 'react'
import styles from './TokenRow.module.css'
import { ethers } from 'ethers'
import { useBlockchainContext } from '@/contexts/BlockchainContext'

interface TokenRowProps {
  name: string
  address: string
  symbol: string
  balance: string
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
}

const TokenRow: React.FC<TokenRowProps> = ({ name, address, symbol, Icon }) => {
  const { walletProvider } = useBlockchainContext()
  const [balance, setBalance] = useState<string>()

  useEffect(() => {
    const getBalance = async () => {
      const balance = ethers.utils.formatEther(await walletProvider?.getBalance(address)!)
      setBalance(balance)
    }
    getBalance()
  }, [walletProvider])

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
      <div className={styles.balanceText}>{balance}</div>
    </div>
  )
}

export default TokenRow
