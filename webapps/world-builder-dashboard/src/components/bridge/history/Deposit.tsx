import React from 'react'
import { HIGH_NETWORKS, LOW_NETWORKS } from '../../../../constants'
import DepositMobile from './DepositMobile'
import styles from './WithdrawTransactions.module.css'
import { useMediaQuery } from 'summon-ui/mantine'
import IconArrowNarrowDown from '@/assets/IconArrowNarrowDown'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useDepositStatus } from '@/hooks/useL2ToL1MessageStatus'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getTokensForNetwork } from '@/utils/tokens'
import { getBlockExplorerUrl } from '@/utils/web3utils'

interface DepositProps {
  deposit: TransactionRecord
}
const Deposit: React.FC<DepositProps> = ({ deposit }) => {
  const depositInfo = {
    from: LOW_NETWORKS.find((n) => n.chainId === deposit.lowNetworkChainId)?.displayName ?? '',
    to: HIGH_NETWORKS.find((n) => n.chainId === deposit.highNetworkChainId)?.displayName ?? ''
  }
  const smallView = useMediaQuery('(max-width: 1199px)')
  const { connectedAccount } = useBlockchainContext()
  const tokenInformation = getTokensForNetwork(deposit?.lowNetworkChainId, connectedAccount).find(
    (token) => token.address === deposit?.tokenAddress
  )
  const { data: status, isLoading: isLoadingStatus } = useDepositStatus(deposit)
  return (
    <>
      {isLoadingStatus && smallView ? (
        <div className={styles.gridItem}>
          <div className={styles.loading}>Loading</div>
        </div>
      ) : (
        <>
          {smallView ? (
            <DepositMobile deposit={deposit} isLoading={isLoadingStatus} />
          ) : (
            <>
              <div className={styles.gridItem}>
                <div className={styles.typeDeposit}>
                  Deposit
                  <IconArrowNarrowDown className={styles.arrowUp} />
                </div>
              </div>
              <div className={styles.gridItem}>{timeAgo(deposit.lowNetworkTimestamp)}</div>
              <div
                className={styles.gridItem}
              >{`${tokenInformation?.decimals ? Number(deposit.amount) / tokenInformation?.decimals : deposit.amount} ${tokenInformation?.symbol}`}</div>
              <div className={styles.gridItem}>{depositInfo.from}</div>
              <div className={styles.gridItem}>{depositInfo.to}</div>
              {isLoadingStatus ? (
                <>
                  <div className={styles.gridItem}>
                    <div className={styles.loading}>Loading</div>
                  </div>
                  <div className={styles.gridItem}>
                    <div className={styles.loading}>Loading</div>
                  </div>
                </>
              ) : (
                <>
                  <a
                    href={`${getBlockExplorerUrl(deposit.lowNetworkChainId)}/tx/${deposit.lowNetworkHash}`}
                    target={'_blank'}
                    className={styles.explorerLink}
                  >
                    <div className={styles.gridItem}>
                      {status?.l2Result?.complete ? (
                        <div className={styles.settled}>
                          Completed
                          <IconLinkExternal02 stroke='#fff' />
                        </div>
                      ) : (
                        <div className={styles.pending}>
                          Pending
                          <IconLinkExternal02 className={styles.arrowUp} />
                        </div>
                      )}
                    </div>
                  </a>
                  {isLoadingStatus ? (
                    <div className={styles.gridItem}>
                      <div className={styles.loading}>Loading</div>
                    </div>
                  ) : (
                    <div className={styles.gridItemImportant}>
                      {status?.highNetworkTimestamp ? (
                        <>
                          {status?.highNetworkTimestamp === undefined
                            ? 'No status found'
                            : timeAgo(status?.highNetworkTimestamp)}
                        </>
                      ) : (
                        <>{ETA(deposit.lowNetworkTimestamp, deposit.retryableCreationTimeout ?? 15 * 60)}</>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

export default Deposit
