import React, { useState } from 'react'
import { HIGH_NETWORKS, L3_NATIVE_TOKEN_SYMBOL, LOW_NETWORKS } from '../../../../constants'
import styles from './DepositMobile.module.css'
import parentStyles from './WithdrawTransactions.module.css'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { useDepositStatus } from '@/hooks/useL2ToL1MessageStatus'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'

interface DepositMobileProps {
  deposit: TransactionRecord
}
const DepositMobile: React.FC<DepositMobileProps> = ({ deposit }) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const status = useDepositStatus(deposit)
  const depositInfo = {
    from: LOW_NETWORKS.find((n) => n.chainId === deposit.lowNetworkChainId)?.displayName ?? '',
    to: HIGH_NETWORKS.find((n) => n.chainId === deposit.highNetworkChainId)?.displayName ?? ''
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Deposit</div>
        <div className={styles.amount}>{`${deposit.amount} ${L3_NATIVE_TOKEN_SYMBOL}`}</div>
      </div>
      {!isCollapsed && (
        <>
          <div className={styles.dataRow}>
            <div className={styles.dataText}> Transaction</div>
            <a
              href={`${getBlockExplorerUrl(deposit.lowNetworkChainId)}/tx/${deposit.lowNetworkHash}`}
              target={'_blank'}
              className={styles.explorerLink}
            >
              {status.data && status.data.l2Result?.complete ? (
                <div className={parentStyles.settled}>
                  Completed
                  <IconLinkExternal02 stroke={'#027A48'} />
                </div>
              ) : (
                <div className={parentStyles.pending}>
                  Pending
                  <IconLinkExternal02 stroke={'#175CD3'} />
                </div>
              )}
            </a>
          </div>
          <div className={styles.dataRow}>
            <div className={styles.dataText}>From</div>
            <div className={styles.dataText}>{depositInfo.from}</div>
          </div>
          <div className={styles.dataRow}>
            <div className={styles.dataText}>To</div>
            <div className={styles.dataText}>{depositInfo.to}</div>
          </div>
        </>
      )}
      <div className={styles.dataRow}>
        <div className={styles.dataText}> Status</div>
        <div className={styles.dataTextBold}>
          {status.data && status.data.highNetworkTimestamp ? (
            <div>{timeAgo(status.data.highNetworkTimestamp)}</div>
          ) : (
            <div>{ETA(deposit.lowNetworkTimestamp, deposit.retryableCreationTimeout ?? 15 * 60)}</div>
          )}
        </div>
      </div>
      <div className={styles.button} onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? 'View more' : 'View less'}
      </div>
    </div>
  )
}

export default DepositMobile
