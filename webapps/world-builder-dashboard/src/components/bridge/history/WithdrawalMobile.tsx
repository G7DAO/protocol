import React, { useState } from 'react'
import styles from './DepositMobile.module.css'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import IconWithdrawalNodeCompletedMobile from '@/assets/IconWithdrawalNodeCompletedMobile'
import parentStyles from '@/components/bridge/history/WithdrawTransactions.module.css'
import { NetworkType } from '@/contexts/BlockchainContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'
import { ChildToParentMessageStatus } from '@arbitrum/sdk'
import IconArrowNarrowUp from '@/assets/IconArrowNarrowUp'

interface WithdrawalMobileProps {
  withdrawal: TransactionRecord
  claim: any
  status: any
  transferStatus: any
  selectedNetworkType: NetworkType
  transactionInputs: any
}
const WithdrawalMobile: React.FC<WithdrawalMobileProps> = ({
  withdrawal,
  claim,
  status,
  transferStatus,
  selectedNetworkType,
  transactionInputs
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={parentStyles.typeWithdrawal}>
          <IconArrowNarrowUp className={parentStyles.arrowUp} />
          Withdraw
        </div>
        <div className={styles.amount}>{`${withdrawal.amount} ${transactionInputs?.tokenSymbol}`}</div>
      </div>
      {!isCollapsed && (
        <>
          <div className={styles.dataRow}>
            <div className={styles.dataText}>Transaction</div>
            {transferStatus && transferStatus?.status === ChildToParentMessageStatus.EXECUTED && (
              <a
                href={`${getBlockExplorerUrl(withdrawal.lowNetworkChainId, selectedNetworkType)}/tx/${withdrawal.lowNetworkHash}`}
                target={'_blank'}
                className={parentStyles.explorerLink}
              >
                <div className={parentStyles.settled}>
                  Completed
                  <IconLinkExternal02 stroke={'#fff'} />
                </div>
              </a>
            )}
            {transferStatus && transferStatus?.status === ChildToParentMessageStatus.CONFIRMED && (
              <a
                href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId, selectedNetworkType)}/tx/${withdrawal.highNetworkHash}`}
                target={'_blank'}
                className={parentStyles.explorerLink}
              >
                <div className={parentStyles.claimable}>
                  Claimable
                  <IconLinkExternal02 stroke={'#fff'} />
                </div>
              </a>
            )}
            {transferStatus && transferStatus?.status === ChildToParentMessageStatus.UNCONFIRMED && (
              <a
                href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId, selectedNetworkType)}/tx/${withdrawal.highNetworkHash}`}
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
          {transferStatus && transferStatus?.status === ChildToParentMessageStatus.EXECUTED && (
            <>
              <IconWithdrawalNodeCompletedMobile className={styles.nodeCompleted} />
              <div className={styles.dataRowCompleted}>
                <div className={styles.dataText}>Initiate</div>
                <a
                  href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId, selectedNetworkType)}/tx/${withdrawal.highNetworkHash}`}
                  target={'_blank'}
                  className={parentStyles.explorerLink}
                >
                  <div className={parentStyles.settled}>
                    Completed
                    <IconLinkExternal02 stroke={'#fff'} />
                  </div>
                </a>
              </div>
              <div className={styles.dataRowCompleted}>
                <div className={styles.dataText}>Finalize</div>
                <a
                  href={`${getBlockExplorerUrl(withdrawal.lowNetworkChainId, selectedNetworkType)}/tx/${withdrawal.lowNetworkHash}`}
                  target={'_blank'}
                  className={parentStyles.explorerLink}
                >
                  <div className={parentStyles.settled}>
                    Completed
                    <IconLinkExternal02 stroke={'#fff'} />
                  </div>
                </a>
              </div>
            </>
          )}
          <div className={styles.dataRow}>
            <div className={styles.dataText}>From</div>
            <div className={styles.dataText}>{status?.data?.from ?? ''}</div>
          </div>
          <div className={styles.dataRow}>
            <div className={styles.dataText}>To</div>
            <div className={styles.dataText}>{status?.data?.to ?? ''}</div>
          </div>
        </>
      )}
      <div className={styles.dataRow}>
        <div className={styles.dataText}>Status</div>
        {transferStatus && transferStatus?.status === ChildToParentMessageStatus.CONFIRMED && (
          <button className={parentStyles.claimButton} onClick={() => claim.mutate(withdrawal)}>
            {claim.isLoading && !claim.isSuccess ? 'Claiming...' : 'Claim Now'}
          </button>
        )}
        {transferStatus && transferStatus?.status === ChildToParentMessageStatus.EXECUTED && (
          <div className={styles.dataTextBold}>{timeAgo(status?.data?.lowNetworkTimeStamp)}</div>
        )}
        {transferStatus && transferStatus?.status === ChildToParentMessageStatus.UNCONFIRMED && (
          <div className={styles.dataTextBold}>{ETA(status?.data?.timestamp, withdrawal.challengePeriod)}</div>
        )}
      </div>
      <div className={styles.button} onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? 'View more' : 'View less'}
      </div>
    </div>
  )
}

export default WithdrawalMobile
