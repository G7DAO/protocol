import React, { useState } from 'react'
import { L3_NATIVE_TOKEN_SYMBOL } from '../../../../constants'
import styles from './DepositMobile.module.css'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import parentStyles from '@/components/bridge/history/WithdrawTransactions.module.css'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'
import { L2ToL1MessageStatus } from '@arbitrum/sdk'

interface WithdrawalMobileProps {
  withdrawal: TransactionRecord
  execute: any
  status: any
}
const WithdrawalMobile: React.FC<WithdrawalMobileProps> = ({ withdrawal, execute, status }) => {
  const [isCollapsed, setIsCollapsed] = useState(true)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Withdraw</div>
        <div className={styles.amount}>{`${withdrawal.amount} ${L3_NATIVE_TOKEN_SYMBOL}`}</div>
      </div>
      {!isCollapsed && (
        <>
          <div className={styles.dataRow}>
            <div className={styles.dataText}>Transaction</div>
            {status.data?.status === L2ToL1MessageStatus.EXECUTED && (
              <a
                href={`${getBlockExplorerUrl(withdrawal.lowNetworkChainId)}/tx/${withdrawal.lowNetworkHash}`}
                target={'_blank'}
                className={parentStyles.explorerLink}
              >
                <div className={parentStyles.settled}>
                  Completed
                  <IconLinkExternal02 stroke={'#fff'} />
                </div>
              </a>
            )}
            {status.data?.status === L2ToL1MessageStatus.CONFIRMED && (
              <a
                href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
                target={'_blank'}
                className={parentStyles.explorerLink}
              >
                <div className={parentStyles.claimable}>
                  Claimable
                  <IconLinkExternal02 stroke={'#fff'} />
                </div>
              </a>
            )}
            {status.data?.status === L2ToL1MessageStatus.UNCONFIRMED && (
              <a
                href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
                target={'_blank'}
                className={parentStyles.explorerLink}
              >
                <div className={parentStyles.pending}>
                  Pending
                  <IconLinkExternal02 stroke={'#fff'} />
                </div>
              </a>
            )}
          </div>
          <div className={styles.dataRow}>
            <div className={styles.dataText}>From</div>
            <div className={styles.dataText}>{status.data?.from ?? ''}</div>
          </div>
          <div className={styles.dataRow}>
            <div className={styles.dataText}>To</div>
            <div className={styles.dataText}>{status.data?.to ?? ''}</div>
          </div>
        </>
      )}
      <div className={styles.dataRow}>
        <div className={styles.dataText}> Status</div>
        {status.data?.status === L2ToL1MessageStatus.CONFIRMED && (
          <button className={parentStyles.claimButton} onClick={() => execute.mutate(status.data.highNetworkHash)}>
            {execute.isLoading ? 'Claiming...' : 'Claim now'}
          </button>
        )}

        {status.data?.status === L2ToL1MessageStatus.EXECUTED && (
          <div className={styles.dataTextBold}>{timeAgo(status.data.lowNetworkTimeStamp)}</div>
        )}
        {status.data?.status === L2ToL1MessageStatus.UNCONFIRMED && (
          <div className={styles.dataTextBold}>{ETA(status.data?.timestamp, withdrawal.challengePeriod)}</div>
        )}
      </div>
      <div className={styles.button} onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? 'View more' : 'View less'}
      </div>
    </div>
  )
}

export default WithdrawalMobile
