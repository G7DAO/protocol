import React, { useState } from 'react'
import { getHighNetworks, getLowNetworks, HIGH_NETWORKS, LOW_NETWORKS } from '../../../../constants'
import styles from './WithdrawTransactions.module.css'
import IconArrowNarrowUp from '@/assets/IconArrowNarrowUp'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import IconWithdrawalNodeCompleted from '@/assets/IconWithdrawalNodeCompleted'
import WithdrawalMobile from '@/components/bridge/history/WithdrawalMobile'
import { NetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeTransfer } from '@/hooks/useBridgeTransfer'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getTokensForNetwork } from '@/utils/tokens'
import { getBlockExplorerUrl } from '@/utils/web3utils'
import { ChildToParentMessageStatus } from '@arbitrum/sdk'
import { useMediaQuery } from '@mantine/hooks'

interface WithdrawalProps {
  withdrawal: TransactionRecord
}

export const getStatus = (
  withdrawal: TransactionRecord,
  lowNetworks: NetworkInterface[],
  highNetworks: NetworkInterface[]
) => {
  const {
    completionTimestamp,
    claimableTimestamp,
    highNetworkChainId,
    lowNetworkChainId,
    highNetworkTimestamp,
    amount,
    highNetworkHash
  } = withdrawal
  const status = completionTimestamp
    ? ChildToParentMessageStatus.EXECUTED
    : claimableTimestamp
      ? ChildToParentMessageStatus.CONFIRMED
      : ChildToParentMessageStatus.UNCONFIRMED
  const lowNetwork = lowNetworks.find((n) => n.chainId === lowNetworkChainId)
  const highNetwork = highNetworks.find((n) => n.chainId === highNetworkChainId)
  if (lowNetwork && highNetwork) {
    const data = {
      status,
      from: highNetwork.displayName,
      to: lowNetwork.displayName,
      timestamp: highNetworkTimestamp,
      lowNetworkTimeStamp: completionTimestamp,
      amount,
      highNetworkHash
    }
    return { isLoading: false, data }
  }
}
const Withdrawal: React.FC<WithdrawalProps> = ({ withdrawal }) => {
  const { connectedAccount, selectedNetworkType } = useBlockchainContext()
  const smallView = useMediaQuery('(max-width: 1199px)')
  const { claim, returnTransferData } = useBridgeTransfer()
  const [collapseExecuted, setCollapseExecuted] = useState(false)
  const [hovered, setHovered] = useState(false)
  const lowNetworks = getLowNetworks(selectedNetworkType) || LOW_NETWORKS
  const highNetworks = getHighNetworks(selectedNetworkType) || HIGH_NETWORKS
  const status = getStatus(withdrawal, lowNetworks, highNetworks)
  const { data: transferStatus, isLoading } = returnTransferData({ txRecord: withdrawal })
  const tokenInformation = getTokensForNetwork(withdrawal?.highNetworkChainId, connectedAccount).find(
    (token) => token.address === withdrawal?.tokenAddress
  )
  // const { data: transactionInputs } = getTransactionInputs({ txRecord: withdrawal })
  
  return (
    <>
      {status?.isLoading && smallView ? (
        <div className={styles.gridItem}>
          <div className={styles.loading}>Loading</div>
        </div>
      ) : (
        <>
          {smallView ? (
            <WithdrawalMobile
              withdrawal={withdrawal}
              claim={claim}
              status={status}
              selectedNetworkType={selectedNetworkType}
            />
          ) : (
            <>
              {status?.isLoading && isLoading ? (
                <>
                  <div className={styles.gridItem} title={withdrawal.highNetworkHash}>
                    <div className={styles.typeWithdrawal}>
                      <IconArrowNarrowUp className={styles.arrowUp} />
                      Withdraw
                    </div>
                  </div>
                  <div className={styles.gridItem}>{timeAgo(withdrawal.highNetworkTimestamp)}</div>
                  <div
                    className={styles.gridItem}
                  >{`${tokenInformation?.decimals ? Number(withdrawal.amount) / tokenInformation?.decimals : withdrawal.amount} ${tokenInformation?.symbol}`}</div>
                  <div className={styles.gridItem}>{status?.data?.from ?? ''}</div>
                  <div className={styles.gridItem}>{status?.data?.to ?? ''}</div>
                  <div className={styles.gridItem}>
                    <div className={styles.loading}>Loading</div>
                  </div>
                  <div className={styles.gridItem}>
                    <div className={styles.loading}>Loading</div>
                  </div>
                </>
              ) : (
                <>
                  {transferStatus && transferStatus?.status === ChildToParentMessageStatus.EXECUTED && (
                    <>
                      <div
                        className={styles.gridItem}
                        title={withdrawal.highNetworkHash}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        {collapseExecuted && <IconWithdrawalNodeCompleted className={styles.gridNodeCompleted} />}
                        <div className={styles.typeWithdrawal} onClick={() => setCollapseExecuted(!collapseExecuted)}>
                          <IconArrowNarrowUp className={styles.arrowUp} />
                          Withdraw
                        </div>
                      </div>
                      <div
                        className={styles.gridItem}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        {timeAgo(withdrawal?.highNetworkTimestamp)}
                      </div>
                      <div
                        className={styles.gridItem}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >{`${tokenInformation?.decimals ? Number(withdrawal.amount) / tokenInformation?.decimals : withdrawal.amount} ${tokenInformation?.symbol}`}</div>
                      <div
                        className={styles.gridItem}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        {status?.data?.from ?? ''}
                      </div>
                      <div
                        className={styles.gridItem}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        {status?.data?.to ?? ''}
                      </div>
                      <div
                        className={styles.gridItem}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        <a
                          href={`${getBlockExplorerUrl(withdrawal.lowNetworkChainId, selectedNetworkType)}/tx/${withdrawal.lowNetworkHash}`}
                          target={'_blank'}
                          className={styles.explorerLink}
                        >
                          <div className={styles.settled} onClick={() => setCollapseExecuted(!collapseExecuted)}>
                            Completed
                            <IconLinkExternal02 stroke={'#fff'} />
                          </div>
                        </a>
                      </div>
                      <div
                        className={styles.gridItemImportant}
                        onClick={() => setCollapseExecuted(!collapseExecuted)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: hovered ? '#393939' : 'initial'
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        <div>{timeAgo(withdrawal?.completionTimestamp)}</div>
                      </div>
                      {collapseExecuted && (
                        <>
                          <div className={styles.gridItemChild} title={withdrawal.highNetworkHash}>
                            <div className={styles.typeCompleted}>Initiate</div>
                          </div>
                          <div className={styles.gridItemInitiate}>{timeAgo(withdrawal?.highNetworkTimestamp)}</div>
                          <div
                            className={styles.gridItemInitiate}
                          >{`${tokenInformation?.decimals ? Number(withdrawal.amount) / tokenInformation?.decimals : withdrawal.amount} ${tokenInformation?.symbol}`}</div>
                          <div className={styles.gridItemInitiate}>{status?.data?.from ?? ''}</div>
                          <div className={styles.gridItemInitiate}>{status?.data?.to ?? ''}</div>
                          <div className={styles.gridItemInitiate}>
                            <a
                              href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId, selectedNetworkType)}/tx/${withdrawal.highNetworkHash}`}
                              target={'_blank'}
                              className={styles.explorerLink}
                            >
                              <div className={styles.settled}>
                                Completed
                                <IconLinkExternal02 stroke={'#fff'} />
                              </div>
                            </a>
                          </div>
                          <div className={styles.gridItemInitiate}>
                            <div className={styles.timeCenter}>{timeAgo(withdrawal?.completionTimestamp)}</div>
                          </div>
                          <div className={styles.gridItemChild} title={withdrawal.highNetworkHash}>
                            <div className={styles.typeCompleted}>Finalize</div>
                          </div>
                          <div className={styles.gridItemInitiate}>{timeAgo(withdrawal?.completionTimestamp)}</div>
                          <div
                            className={styles.gridItemInitiate}
                          >{`${tokenInformation?.decimals ? Number(withdrawal.amount) / tokenInformation?.decimals : withdrawal.amount} ${tokenInformation?.symbol}`}</div>
                          <div className={styles.gridItemInitiate}>{status?.data?.from ?? ''}</div>
                          <div className={styles.gridItemInitiate}>{status?.data?.to ?? ''}</div>
                          <div className={styles.gridItemInitiate}>
                            <a
                              href={`${getBlockExplorerUrl(withdrawal.lowNetworkChainId, selectedNetworkType)}/tx/${withdrawal.lowNetworkHash}`}
                              target={'_blank'}
                              className={styles.explorerLink}
                            >
                              <div className={styles.settled}>
                                Completed
                                <IconLinkExternal02 stroke={'#fff'} />
                              </div>
                            </a>
                          </div>
                          <div className={styles.gridItemInitiate}>
                            <div className={styles.timeCenter}>{timeAgo(withdrawal?.completionTimestamp)}</div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {transferStatus && transferStatus?.status !== ChildToParentMessageStatus.EXECUTED && (
                    <>
                      <div className={styles.gridItem} title={withdrawal.highNetworkHash}>
                        <div className={styles.typeWithdrawal}>
                          <IconArrowNarrowUp className={styles.arrowUp} />
                          Withdraw
                        </div>
                      </div>
                      <div className={styles.gridItem}>{timeAgo(status?.data?.timestamp)}</div>
                      <div
                        className={styles.gridItem}
                      >{`${tokenInformation?.decimals ? Number(withdrawal.amount) / tokenInformation?.decimals : withdrawal.amount} ${tokenInformation?.symbol}`}</div>
                      <div className={styles.gridItem}>{status?.data?.from ?? ''}</div>
                      <div className={styles.gridItem}>{status?.data?.to ?? ''}</div>
                      {transferStatus && transferStatus?.status === ChildToParentMessageStatus.CONFIRMED && (
                        <>
                          <div className={styles.gridItem}>
                            <a
                              href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId, selectedNetworkType)}/tx/${withdrawal.highNetworkHash}`}
                              target={'_blank'}
                              className={styles.explorerLink}
                            >
                              <div className={styles.claimable}>
                                Claimable
                                <IconLinkExternal02 className={styles.arrowUp} />
                              </div>
                            </a>
                          </div>
                          <div className={styles.gridItem}>
                            <button className={styles.claimButton} onClick={() => claim.mutate(withdrawal)}>
                              {claim.isLoading && !claim.isSuccess ? 'Claiming...' : 'Claim Now'}
                            </button>
                          </div>
                        </>
                      )}
                      {transferStatus && transferStatus?.status === ChildToParentMessageStatus.UNCONFIRMED && (
                        <>
                          <div className={styles.gridItem}>
                            <a
                              href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId, selectedNetworkType)}/tx/${withdrawal.highNetworkHash}`}
                              target={'_blank'}
                              className={styles.explorerLink}
                            >
                              <div className={styles.pending}>
                                Pending
                                <IconLinkExternal02 className={styles.arrowUp} />
                              </div>
                            </a>
                          </div>

                          <div className={styles.gridItemImportant}>
                            <div>{ETA(withdrawal?.highNetworkTimestamp, withdrawal.challengePeriod)} left</div>
                          </div>
                        </>
                      )}
                    </>
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

export default Withdrawal
