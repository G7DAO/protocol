import React from 'react'
import { L2_CHAIN, L3_NATIVE_TOKEN_SYMBOL } from '../../../constants'
import styles from './WithdrawTransactions.module.css'
import { Skeleton } from 'summon-ui/mantine'
import IconArrowNarrowDown from '@/assets/IconArrowNarrowDown'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { L3_NETWORKS } from '@/components/bridge/l3Networks'
import { useDepositStatus } from '@/hooks/useL2ToL1MessageStatus'

const timeAgo = (timestamp: number) => {
  const now = new Date().getTime()
  const date = new Date(Number(timestamp) * 1000).getTime()
  const timeDifference = Math.floor((now - date) / 1000)

  const units = [
    { name: 'year', inSeconds: 60 * 60 * 24 * 365 },
    { name: 'month', inSeconds: 60 * 60 * 24 * 30 },
    { name: 'day', inSeconds: 60 * 60 * 24 },
    { name: 'hour', inSeconds: 60 * 60 },
    { name: 'minute', inSeconds: 60 },
    { name: 'second', inSeconds: 1 }
  ]

  for (const unit of units) {
    const value = Math.floor(timeDifference / unit.inSeconds)
    if (value >= 1) {
      return `${value} ${unit.name}${value > 1 ? 's' : ''} ago`
    }
  }
  return 'just now'
}

const networkName = (chainId: number) => {
  const network = L3_NETWORKS.find((n) => n.chainInfo.chainId === chainId)
  return network?.chainInfo.chainName
}

const networkExplorer = (): string | undefined => {
  const network = L2_CHAIN
  if (network?.blockExplorerUrls) {
    return network?.blockExplorerUrls[0] ?? undefined
  }
  return
}

interface DepositProps {
  txHash: string
  chainId: number
  transaction: any
}
const Deposit: React.FC<DepositProps> = ({ txHash, chainId, transaction }) => {
  const l2BlockExplorer = networkExplorer()
  const l3ExplorerLink = `${l2BlockExplorer}/tx/${txHash}`
  const handleStatusClick = () => {
    if (!l3ExplorerLink) {
      return
    }
    window.open(l3ExplorerLink, '_blank')
  }

  const status = useDepositStatus(transaction)

  if (!status.isLoading && !status.data) {
    return <></>
  }

  return (
    <>
      {status.isLoading ? (
        Array.from(Array(7)).map((_, idx) => (
          <div className={styles.gridItem} key={idx}>
            <Skeleton key={idx} h='12px' w='100%' />
          </div>
        ))
      ) : (
        <>
          <div className={styles.gridItem}>
            <div className={styles.typeDeposit}>
              Deposit
              <IconArrowNarrowDown stroke={'#3538CD'} />
            </div>
          </div>
          <div className={styles.gridItem}>{timeAgo(status.data?.timestamp)}</div>
          <div className={styles.gridItem}>{`${status.data?.value} ${L3_NATIVE_TOKEN_SYMBOL}`}</div>
          <div className={styles.gridItem}>{L2_CHAIN.displayName}</div>
          <div className={styles.gridItem}>{networkName(chainId) ?? ''}</div>
          <>
            <div className={styles.gridItem}>
              <div className={styles.settled} onClick={handleStatusClick}>
                Settled
                {!!l3ExplorerLink && <IconLinkExternal02 stroke={'#027A48'} />}
              </div>
            </div>
            <div className={styles.gridItem}>
              <div></div>
            </div>
          </>
        </>
      )}
    </>
  )
}

export default Deposit
