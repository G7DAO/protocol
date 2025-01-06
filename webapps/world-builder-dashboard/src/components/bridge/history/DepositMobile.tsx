import React, { useState } from 'react'
import { getHighNetworks, getLowNetworks } from '../../../../constants'
import styles from './DepositMobile.module.css'
import parentStyles from './WithdrawTransactions.module.css'
import { BridgeTransferStatus } from 'game7-bridge-sdk'
import { Skeleton, useMediaQuery } from 'summon-ui/mantine'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { NetworkType } from '@/contexts/BlockchainContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'
import IconWithdrawalNodeCompletedMobile from '@/assets/IconWithdrawalNodeCompletedMobile'

interface DepositMobileProps {
  deposit: TransactionRecord
  isLoading: boolean
  selectedNetworkType: NetworkType
  transactionInputs: any
  highNetworkTimestamp: number
  transferStatus: any
  claim: any
}
const DepositMobile: React.FC<DepositMobileProps> = ({
  deposit,
  isLoading,
  selectedNetworkType,
  transactionInputs,
  highNetworkTimestamp,
  transferStatus,
  claim
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const depositInfo = {
    from: getLowNetworks(selectedNetworkType)?.find((n) => n.chainId === deposit.lowNetworkChainId)?.displayName ?? '',
    to: getHighNetworks(selectedNetworkType)?.find((n) => n.chainId === deposit.highNetworkChainId)?.displayName ?? ''
  }
  console.log(deposit.highNetworkTimestamp)
  const smallView = useMediaQuery('(max-width: 1199px)')
  return (
    <>
      {isLoading ? (
        !smallView ? (
          Array.from(Array(7)).map((_, idx) => (
            <div className={parentStyles.gridItem}>
              <Skeleton key={idx} h='12px' w='100%' color='#373737' animate />
            </div>
          ))
        ) : (
          <div className={parentStyles.gridItem}>
            <Skeleton h='12px' w='100%' color='#373737' animate />
          </div>
        )
      ) : (
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.title}>Deposit</div>
            <div className={styles.amount}>{`${deposit.amount} ${transactionInputs?.tokenSymbol}`}</div>
          </div>
          {!isCollapsed && (
            <>
              <div className={styles.dataRow}>
                <div className={styles.dataText}>Transaction</div>
                {transferStatus && (transferStatus?.status === BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED ||
                  transferStatus?.status === BridgeTransferStatus.DEPOSIT_GAS_DEPOSITED) && (
                    <a
                      href={`${getBlockExplorerUrl(deposit.highNetworkChainId, selectedNetworkType)}/tx/${deposit.highNetworkHash}`}
                      target={'_blank'}
                      className={parentStyles.explorerLink}
                    >
                      <div className={parentStyles.settled}>
                        Completed
                        <IconLinkExternal02 stroke={'#fff'} />
                      </div>
                    </a>
                  )}
                {transferStatus && (transferStatus?.status === BridgeTransferStatus.DEPOSIT_ERC20_FUNDS_DEPOSITED_ON_CHILD || transferStatus?.status === BridgeTransferStatus.CCTP_COMPLETE) && (
                  <a
                    href={`${getBlockExplorerUrl(deposit.lowNetworkChainId, selectedNetworkType)}/tx/${deposit.lowNetworkHash}`}
                    target={'_blank'}
                    className={parentStyles.explorerLink}
                  >
                    <div className={parentStyles.claimable}>
                      Claimable
                      <IconLinkExternal02 stroke={'#fff'} />
                    </div>
                  </a>
                )}
                {transferStatus && (
                  transferStatus?.status === BridgeTransferStatus.CCTP_PENDING
                  || transferStatus?.status === BridgeTransferStatus.DEPOSIT_GAS_PENDING
                  || transferStatus?.status === BridgeTransferStatus.DEPOSIT_ERC20_NOT_YET_CREATED) && (
                    <a
                      href={`${getBlockExplorerUrl(deposit.lowNetworkChainId, selectedNetworkType)}/tx/${deposit.lowNetworkHash}`}
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
              {transferStatus && (transferStatus?.status === BridgeTransferStatus.CCTP_REDEEMED) && (
                <>
                  <IconWithdrawalNodeCompletedMobile className={styles.nodeCompleted} />
                  <div className={styles.dataRowCompleted}>
                    <div className={styles.dataText}>Initiate</div>
                    <a
                      href={`${getBlockExplorerUrl(deposit.lowNetworkChainId, selectedNetworkType)}/tx/${deposit.lowNetworkHash}`}
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
                      href={`${getBlockExplorerUrl(deposit.highNetworkChainId, selectedNetworkType)}/tx/${deposit.highNetworkHash}`}
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
                <div className={styles.dataText}>{depositInfo.from}</div>
              </div>
              <div className={styles.dataRow}>
                <div className={styles.dataText}>To</div>
                <div className={styles.dataText}>{depositInfo.to}</div>
              </div>
            </>
          )}
          <div className={styles.dataRow}>
            <div className={styles.dataText}>Status</div>
            {transferStatus && transferStatus?.status === BridgeTransferStatus.CCTP_COMPLETE ? (
              <button className={parentStyles.claimButton} onClick={() => claim.mutate(deposit)}>
                {claim.isLoading && !claim.isSuccess ? 'Claiming...' : 'Claim Now'}
              </button>
            ) : (
              <>
                <div className={styles.dataTextBold}>
                  {transferStatus?.status === BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED ||
                    transferStatus?.status === BridgeTransferStatus.DEPOSIT_GAS_DEPOSITED ||
                    transferStatus?.status === BridgeTransferStatus.DEPOSIT_ERC20_FUNDS_DEPOSITED_ON_CHILD || 
                    transferStatus?.status === BridgeTransferStatus.CCTP_REDEEMED ? (
                    <>{timeAgo(deposit?.completionTimestamp)}</>
                  ) : (
                    <>{ETA(deposit.lowNetworkTimestamp, deposit.retryableCreationTimeout ?? 15 * 60)}</>
                  )}
                </div>
              </>
            )}
          </div>
          <div className={styles.button} onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? 'View more' : 'View less'}
          </div>
        </div>
      )}
    </>
  )
}

export default DepositMobile
