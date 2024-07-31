import React from 'react'
import { HIGH_NETWORKS, L3_NATIVE_TOKEN_SYMBOL, LOW_NETWORKS } from '../../../constants'
import styles from './WithdrawTransactions.module.css'
import { Skeleton } from 'summon-ui/mantine'
import IconArrowNarrowDown from '@/assets/IconArrowNarrowDown'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { TransactionRecord } from '@/components/bridge/depositERC20ArbitrumSDK'
import { useDepositStatus } from '@/hooks/useL2ToL1MessageStatus'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'

interface DepositProps {
  deposit: TransactionRecord
}
const Deposit: React.FC<DepositProps> = ({ deposit }) => {
  const depositInfo = {
    from: LOW_NETWORKS.find((n) => n.chainId === deposit.lowNetworkChainId)?.displayName ?? '',
    to: HIGH_NETWORKS.find((n) => n.chainId === deposit.highNetworkChainId)?.displayName ?? ''
  }

  const status = useDepositStatus(deposit)

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
          <div className={styles.gridItem}>{timeAgo(deposit.lowNetworkTimestamp)}</div>
          <div className={styles.gridItem}>{`${deposit.amount} ${L3_NATIVE_TOKEN_SYMBOL}`}</div>
          <div className={styles.gridItem}>{depositInfo.from}</div>
          <div className={styles.gridItem}>{depositInfo.to}</div>
          <>
            <a
              href={`${getBlockExplorerUrl(deposit.lowNetworkChainId)}/tx/${deposit.lowNetworkHash}`}
              target={'_blank'}
              className={styles.explorerLink}
            >
              <div className={styles.gridItem}>
                {status.data && status.data.l2Result?.complete ? (
                  <div className={styles.settled}>
                    Settled
                    <IconLinkExternal02 stroke={'#027A48'} />
                  </div>
                ) : (
                  <div className={styles.pending}>
                    Pending
                    <IconLinkExternal02 stroke={'#175CD3'} />
                  </div>
                )}
              </div>
            </a>
            <div className={styles.gridItem}>
              {status.data && status.data.highNetworkTimestamp ? (
                <div>{timeAgo(status.data.highNetworkTimestamp)}</div>
              ) : (
                <div>{ETA(deposit.lowNetworkTimestamp, deposit.retryableCreationTimeout ?? 15 * 60)}</div>
              )}
            </div>
          </>
        </>
      )}
    </>
  )
}

export default Deposit
