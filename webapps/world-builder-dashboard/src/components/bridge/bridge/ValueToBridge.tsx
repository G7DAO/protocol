import React, { useEffect, useState } from 'react'
import styles from './ValueToBridge.module.css'
import TokenSelector from '@/components/commonComponents/tokenSelector/TokenSelector'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { getTokensForNetwork, Token } from '@/utils/tokens'
import { formatCurrency } from '@/utils/web3utils'


interface ValueToBridgeProps {
  symbol: string
  value: string
  setValue: (value: string) => void
  balance: string | undefined
  rate: number
  isFetchingBalance?: boolean
  errorMessage: string
  setErrorMessage: (arg0: string) => void
  selectedChainId: number
  gasFee?: string | undefined
}
const ValueToBridge: React.FC<ValueToBridgeProps> = ({
  setValue,
  value,
  balance,
  rate,
  symbol,
  isFetchingBalance,
  errorMessage,
  setErrorMessage,
  selectedChainId,
  gasFee,
}) => {
  const [tokens, setTokens] = useState<Token[]>([])
  const { connectedAccount, selectedBridgeToken, selectedHighNetwork, selectedLowNetwork, setSelectedBridgeToken } = useBlockchainContext()

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

    setSelectedBridgeToken(selectedToken)
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

  const preventNumberChange = (e: any) => {
    // Prevent number change
    e.target.blur()

    // Prevent scroll
    e.stopPropagation()

    // Refocus on element after scroll
    setTimeout(() => {
      e.target.focus()
    }, 0)
  }

  const sanitize = (input: string): string => {
    let result = input.replace(/[^\d.]/g, '');
    result = result.replace(/\.(?=.*\.)/g, '');
    if (!result) {
      return '';
    }
    const hasDot = result.includes('.');
    const [intPartRaw, fractionPartRaw = ''] = result.split('.');
    let intPart = intPartRaw.replace(/^0+/, '');
    if (intPart === '') {
      intPart = '0';
    }
    if (hasDot) {
      return intPart + '.' + fractionPartRaw;
    }
    return intPart;
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
          disabled={!connectedAccount}
          placeholder={'0'}
          type="text"
          onChange={(e) => {
            setValue(sanitize(e.target.value));
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text');
            setValue(sanitize(pasted));
          }}
          inputMode="decimal"
          pattern="^(0(\.\d*)?|[1-9]\d*(\.\d*)?)$"
          onWheel={preventNumberChange}
        />
        <button
          className={styles.maxButton}
          onClick={() => setValue(String(Number(balance) - Number(gasFee)))}
          disabled={!connectedAccount}
        >
          MAX
        </button>
        {tokens.length > 0 && selectedBridgeToken && (
          <TokenSelector
            tokens={tokens}
            selectedToken={selectedBridgeToken}
            onChange={(token: Token) => setSelectedBridgeToken(token)}
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
