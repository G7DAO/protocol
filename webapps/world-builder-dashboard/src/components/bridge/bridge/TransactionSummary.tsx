import React from 'react'
import styles from './TransactionSummary.module.css'
import { Tooltip, useClipboard } from 'summon-ui/mantine'

const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return formatter.format(value)
}

interface TransactionSummaryProps {
  address: string | undefined
  transferTime: string
  fee: number
  isEstimatingFee: boolean
  value: number
  gasBalance: number
  ethRate: number
  tokenSymbol: string
  gasTokenSymbol: string
  tokenRate: number
  direction: 'DEPOSIT' | 'WITHDRAW'
}
const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  direction,
  gasBalance,
  address,
  transferTime,
  fee,
  isEstimatingFee,
  ethRate,
  tokenRate,
  tokenSymbol,
  gasTokenSymbol,
  value
}) => {
  const clipboard = useClipboard({ timeout: 700 })

  const getAddress = (address: string | undefined, showFullAddress: boolean) => {
    if (!address) {
      return '...'
    }
    if (showFullAddress) {
      return address
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Transaction Summary</div>
      <div className={styles.divider} />
      <div className={styles.dataRow}>
        <div className={styles.itemName}>To address</div>
        <Tooltip
          arrowSize={8}
          radius={'8px'}
          label={clipboard.copied ? 'copied' : address}
          withArrow
          disabled={!address}
        >
          <div className={styles.address} onClick={() => address && clipboard.copy(address)}>
            {getAddress(address, false)}
          </div>
        </Tooltip>
      </div>
      <div className={styles.dataRow}>
        <div className={styles.itemName}>Transfer time</div>
        <div className={styles.value}>{transferTime}</div>
      </div>
      <div className={styles.dataRow}>
        <div className={styles.itemName}>Estimated gas fee</div>
        {!!fee ? (
          <div className={styles.valueContainer}>
            <div className={styles.value} title={`balance: ${String(gasBalance)}`}>{`${fee} ${gasTokenSymbol}`}</div>
            {!!(fee * (direction === 'DEPOSIT' ? ethRate : tokenRate)) && (
              <div className={styles.valueNote}>
                {formatCurrency(fee * (direction === 'DEPOSIT' ? ethRate : tokenRate))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.valueNote}>{isEstimatingFee ? 'estimating...' : `can't estimate fee`}</div>
        )}
      </div>
      <div className={styles.dataRow}>
        <div className={styles.itemName}>You will receive</div>
        <div className={styles.valueContainer}>
          <div className={styles.value}>{`${value} ${tokenSymbol}`}</div>
          {tokenRate > 0 && <div className={styles.valueNote}>{formatCurrency(value * tokenRate)}</div>}
        </div>
      </div>
    </div>
  )
}

export default TransactionSummary
