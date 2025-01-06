import React from 'react'
import styles from './TransactionSummary.module.css'
import { Tooltip, useClipboard } from 'summon-ui/mantine'
import { mantineBreakpoints } from '@/styles/breakpoints'
import { useMediaQuery } from '@mantine/hooks'
import { NetworkInterface } from '@/contexts/BlockchainContext'

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
  nativeBalance: number
  ethRate: number
  tokenRate: number
  tokenSymbol: string
  gasNativeTokenSymbol: string
  gasChildNativeTokenSymbol: string
  direction: 'DEPOSIT' | 'WITHDRAW'
  selectedLowChain: NetworkInterface
  selectedHighChain: NetworkInterface
  childFee: number
}
const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  direction,
  nativeBalance,
  address,
  transferTime,
  fee,
  isEstimatingFee,
  ethRate,
  tokenRate,
  tokenSymbol,
  gasNativeTokenSymbol,
  gasChildNativeTokenSymbol,
  value,
  selectedHighChain,
  selectedLowChain,
  childFee
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
      <div className={styles.dataRowContainer}>

        <div className={styles.dataRow}>
          <div className={styles.itemName}>To address</div>
          <Tooltip
            multiline
            radius={'8px'}
            label={clipboard.copied ? 'Copied!' : getAddress(address, true, isXsScreen ?? false)}
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
        <div className={styles.divider} />
        {direction === 'DEPOSIT' ? (
          <>
            <div className={styles.dataRow}>
              <div className={styles.itemName}>Estimated gas fee on {selectedLowChain.displayName}</div>
              {!!fee ? (
                <div className={styles.valueContainer}>
                  <div
                    className={styles.value}
                    title={`Balance: ${String(nativeBalance)} ${gasNativeTokenSymbol}`}
                  >{`${fee.toFixed(8).replace(/\.?0+$/, '')} ${gasNativeTokenSymbol}`}</div>
                  {!!(fee * ethRate) && (
                    <div className={styles.valueNote}>
                      {formatCurrency(fee * ethRate)}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.valueNote}>{isEstimatingFee ? 'Estimating...' : `Can't estimate fee`}</div>
              )}
            </div>
            <div className={styles.dataRow}>
              <div className={styles.itemName}>Estimated gas fee on {selectedHighChain.displayName}</div>
              {!!childFee ? (
                <div className={styles.valueContainer}>
                  <div
                    className={styles.value}
                    title={`Balance: ${String(nativeBalance)} ${gasChildNativeTokenSymbol}`}
                  >{`${childFee.toFixed(8).replace(/\.?0+$/, '')} ${gasChildNativeTokenSymbol}`}</div>
                  {!!(childFee * ethRate) && (
                    <div className={styles.valueNote}>
                      {formatCurrency(childFee * ethRate)}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.valueNote}>{isEstimatingFee ? 'Estimating...' : `Can't estimate fee`}</div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={styles.dataRow}>
              <div className={styles.itemName}>Estimated gas fee on {selectedHighChain.displayName}</div>
              {!!childFee ? (
                <div className={styles.valueContainer}>
                  <div
                    className={styles.value}
                    title={`Balance: ${String(nativeBalance)} ${gasChildNativeTokenSymbol}`}
                  >{`${childFee.toFixed(18).replace(/\.?0+$/, '')} ${gasChildNativeTokenSymbol}`}</div>
                  {!!(childFee * ethRate) && (
                    <div className={styles.valueNote}>
                      {formatCurrency(childFee * ethRate)}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.valueNote}>{isEstimatingFee ? 'Estimating...' : `Can't estimate fee`}</div>
              )}
            </div>
            <div className={styles.dataRow}>
              <div className={styles.itemName}>Estimated gas fee on {selectedLowChain.displayName}</div>
              {!!fee ? (
                <div className={styles.valueContainer}>
                  <div
                    className={styles.value}
                    title={`Balance: ${String(nativeBalance)} ${gasNativeTokenSymbol}`}
                  >{`${fee.toFixed(18).replace(/\.?0+$/, '')} ${gasNativeTokenSymbol}`}</div>
                  {!!(fee * ethRate) && (
                    <div className={styles.valueNote}>
                      {formatCurrency(fee * ethRate)}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.valueNote}>{isEstimatingFee ? 'Estimating...' : `Can't estimate fee`}</div>
              )}
            </div>
          </>
        )}
        <div className={styles.divider} />
        <div className={styles.dataRow}>
          <div className={styles.itemName}>You will receive</div>
          <div className={styles.valueContainer}>
            <div className={styles.value}>{`${value} ${tokenSymbol}`}</div>
            {tokenRate > 0 && <div className={styles.valueNote}>{formatCurrency(value * (tokenSymbol === 'ETH' || tokenSymbol === 'G7' || tokenSymbol === 'TG7T' ? ethRate : tokenRate))}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionSummary
