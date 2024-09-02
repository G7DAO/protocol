import React from 'react'
import styles from './TransactionSummary.module.css'
import { Tooltip, useClipboard } from 'summon-ui/mantine'
import { mantineBreakpoints } from '@/styles/breakpoints'
import { useMediaQuery } from '@mantine/hooks'

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

  const getAddress = (address: string | undefined, showFullAddress: boolean, divide: boolean) => {
    if (!address) {
      return '...'
    }
    if (showFullAddress) {
      return divide ? `${address.slice(0, 21)} ${address.slice(21)}` : address
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const isXsScreen = useMediaQuery(`(max-width: ${mantineBreakpoints.xs})`)

  return (
    <div className={styles.container}>
      <div className={styles.header}>Transaction Summary</div>
      <div className={styles.divider} />
      <div className={styles.dataRow}>
        <div className={styles.itemName}>To address</div>
        <Tooltip
          multiline
          radius={'8px'}
          label={clipboard.copied ? 'copied' : getAddress(address, true, isXsScreen ?? false)}
          arrowSize={8}
          withArrow
          arrowOffset={14}
          disabled={!address}
          events={{ hover: true, focus: true, touch: true }}
          w={isXsScreen ? 200 : 'auto'}
          position={isXsScreen ? 'top-end' : 'top'}
        >
          <div className={styles.address} onClick={() => address && clipboard.copy(address)}>
            {getAddress(address, false, false)}
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
            <div
              className={styles.value}
              title={`balance: ${String(gasBalance)}`}
            >{`${fee.toFixed(18).replace(/\.?0+$/, '')} ${gasTokenSymbol}`}</div>
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
