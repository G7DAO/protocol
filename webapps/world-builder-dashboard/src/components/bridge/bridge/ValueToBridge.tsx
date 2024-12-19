import React, { useEffect, useState } from 'react'
import styles from './ValueToBridge.module.css'
import TokenSelector from '@/components/commonComponents/tokenSelector/TokenSelector'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { getTokensForNetwork, Token } from '@/utils/tokens'

const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return formatter.format(value)
}

interface ValueToBridgeProps {
  symbol: string
  value: string
  setValue: (value: string) => void
  balance: string | undefined
  rate: number
  isFetchingBalance?: boolean
  errorMessage: string
  setErrorMessage: (arg0: string) => void
  onTokenChange: (token: Token) => void
  selectedChainId: number
  gasFee?: string | undefined
}
const ValueToBridge: React.FC<ValueToBridgeProps> = ({
  setValue,
  value,
  balance,
  symbol,
  rate,
  isFetchingBalance,
  errorMessage,
  setErrorMessage,
  onTokenChange,
  selectedChainId,
  gasFee,
}) => {
  const [tokens, setTokens] = useState<Token[]>([])
  const { connectedAccount, selectedBridgeToken, selectedHighNetwork, selectedLowNetwork } = useBlockchainContext()

  const getTokens = () => {
    const highNetworkChainId = String(selectedHighNetwork.chainId)
    const lowNetworkChainId = String(selectedLowNetwork.chainId)
    const _tokens = getTokensForNetwork(selectedChainId, connectedAccount)

    const n = _tokens.find((token) => token.name === selectedBridgeToken.name) || _tokens[0]

    const chainIds = Object.keys(n.tokenAddressMap ?? {})

    const isChainIdValid =
      n.tokenAddressMap && chainIds.includes(String(highNetworkChainId)) && chainIds.includes(String(lowNetworkChainId))

    const selectedToken =
      isChainIdValid && _tokens.some((token) => token.name === selectedBridgeToken.name)
        ? _tokens.find((token) => token.name === selectedBridgeToken.name) || _tokens[0]
        : _tokens[0]

    handleTokenChange(selectedToken)
    setTokens(_tokens)
  }

  useEffect(() => {
    getTokens()
  }, [selectedChainId, connectedAccount])

  useEffect(() => {
    const num = Number(value)
    if (isNaN(num) || num < 0) {
      setErrorMessage('Invalid number')
      return
    }
    if (num + Number(gasFee) > Number(balance)) {
      setErrorMessage('Insufficient funds')
      return
    }
    setErrorMessage('')
  }, [value, balance])

  useEffect(() => {
    if (!connectedAccount) {
      setValue('')
    }
  }, [connectedAccount])


  const handleTokenChange = (token: Token) => {
    onTokenChange(token)
    const _tokens = getTokensForNetwork(selectedChainId, connectedAccount)
    setTokens(_tokens)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.label}>Amount</div>
        <div className={styles.errorMessage}>{errorMessage}</div>
      </div>
      <div className={errorMessage ? styles.inputWithError : styles.inputGroup}>
        <input
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!connectedAccount}
          placeholder={'0'}
          type='number'
        />
        <button
          className={styles.maxButton}
          onClick={() => setValue(String(Number(balance) - 0.0025))}
          disabled={!connectedAccount}
        >
          MAX
        </button>
        {tokens.length > 0 && selectedBridgeToken && (
          <TokenSelector
            tokens={tokens}
            selectedToken={selectedBridgeToken}
            onChange={(token: Token) => handleTokenChange(token)}
            onTokenAdded={getTokens}
            selectedChainId={selectedChainId}
          />
        )}
      </div>
      <div className={styles.header}>
        <div className={styles.label}>{rate > 0 ? formatCurrency(Number(value) * rate) : ' '}</div>
        <div className={styles.available}>
          <div className={`${styles.label} ${isFetchingBalance ? styles.blink : ''}`}>{balance ?? '0'}</div>{' '}
          <div className={styles.label}>{`${symbol} Available`}</div>
        </div>
      </div>
    </div>
  )
}

export default ValueToBridge
