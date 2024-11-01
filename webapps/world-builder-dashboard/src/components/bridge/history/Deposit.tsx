import React from 'react'
import { HIGH_NETWORKS, LOW_NETWORKS } from '../../../../constants'
import DepositMobile from './DepositMobile'
import styles from './WithdrawTransactions.module.css'
import { BridgeTransferStatus } from 'game7-bridge-sdk'
import { useMediaQuery } from 'summon-ui/mantine'
import IconArrowNarrowDown from '@/assets/IconArrowNarrowDown'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { useDepositStatus } from '@/hooks/useL2ToL1MessageStatus'
import useTransferData from '@/hooks/useTransferData'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'
import { useBlockchainContext } from '@/contexts/BlockchainContext'

interface DepositProps {
  deposit: TransactionRecord
}
const Deposit: React.FC<DepositProps> = ({ deposit }) => {
  const depositInfo = {
    from: LOW_NETWORKS.find((n) => n.chainId === deposit.lowNetworkChainId)?.displayName ?? '',
    to: HIGH_NETWORKS.find((n) => n.chainId === deposit.highNetworkChainId)?.displayName ?? ''
  }
  const status = useDepositStatus(deposit)
  const smallView = useMediaQuery('(max-width: 1199px)')
  const { data: transferStatus, isLoading } = useTransferData({ txRecord: deposit })
  const {connectedAccount} = useBlockchainContext()

  const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
  let transactions = transactionsString ? JSON.parse(transactionsString) : []
  const localStorageTransaction = transactions.find(
    (t: any) => t.type === 'DEPOSIT' && t.lowNetworkHash === deposit.lowNetworkHash
  )
  console.log(localStorageTransaction)

  return (
    <>
      {isLoading && smallView ? (
        <div className={styles.gridItem}>
          <div className={styles.loading}>Loading</div>
        </div>
      ) : (
        <>
          {smallView ? (
            <DepositMobile deposit={deposit} transferStatus={transferStatus} isLoading={isLoading} />
          ) : (
            <>
              <div className={styles.gridItem}>
                <div className={styles.typeDeposit}>
                  Deposit
                  <IconArrowNarrowDown className={styles.arrowUp} />
                </div>
              </div>
              <div className={styles.gridItem}>{timeAgo(deposit.lowNetworkTimestamp)}</div>
              <div className={styles.gridItem}>{`${deposit.amount} ${localStorageTransaction?.symbol}`}</div>
              <div className={styles.gridItem}>{depositInfo.from}</div>
              <div className={styles.gridItem}>{depositInfo.to}</div>
              {isLoading ? (
                <>
                  <div className={styles.gridItem}>
                    <div className={styles.loading}>Loading</div>
                  </div>{' '}
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
                      {transferStatus?.status === BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED ||
                      transferStatus?.status === BridgeTransferStatus.DEPOSIT_GAS_DEPOSITED ? (
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
                  <div className={styles.gridItemImportant}>
                    {status.data && status.data.highNetworkTimestamp ? (
                      <div>{timeAgo(status.data.highNetworkTimestamp)}</div>
                    ) : (
                      <div>{ETA(deposit.lowNetworkTimestamp, deposit.retryableCreationTimeout ?? 15 * 60)}</div>
                    )}
                  </div>
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
