import React, { useEffect } from 'react'
import styles from './ValueToBridge.module.css'
import IconG7TSmall from '@/assets/IconG7TSmall'

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
}
const ValueToBridge: React.FC<ValueToBridgeProps> = ({
  setValue,
  value,
  balance,
  symbol,
  rate,
  isFetchingBalance,
  errorMessage,
  setErrorMessage
}) => {
  useEffect(() => {
    const num = Number(value)
    if (isNaN(num) || num < 0) {
      setErrorMessage('Invalid number')
      return
    }
    if (num > Number(balance)) {
      setErrorMessage('Insufficient funds')
      return
    }
    setErrorMessage('')
  }, [value, balance])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.label}>Amount</div>
        <div className={styles.errorMessage}>{errorMessage}</div>
      </div>
      <div className={errorMessage ? styles.inputWithError : styles.inputGroup}>
        <input className={styles.input} value={value} onChange={(e) => setValue(e.target.value)} />
        <button className={styles.maxButton} onClick={() => setValue(String(balance))}>
          MAX
        </button>
        <div className={styles.tokenGroup}>
          <IconG7TSmall />
          <div className={styles.tokenSymbol}>G7T</div>
        </div>
      </div>
      <div className={styles.header}>
        <div className={styles.label}>{formatCurrency(Number(value) * rate)}</div>
        <div className={styles.available}>
          <div className={`${styles.label} ${isFetchingBalance ? styles.blink : ''}`}>{balance ?? '0'}</div>{' '}
          {/*TODO how to display undefined balance */}
          <div className={styles.label}>{`${symbol} Available`}</div>
        </div>
      </div>
    </div>
  )
}

export default ValueToBridge
