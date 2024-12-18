import React, { useState } from 'react'
import { getHighNetworks, getLowNetworks } from '../../../../constants'
import DepositMobile from './DepositMobile'
import styles from './WithdrawTransactions.module.css'
import { ethers } from 'ethers'
import { BridgeTransferStatus } from 'game7-bridge-sdk'
import { useMediaQuery } from 'summon-ui/mantine'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeTransfer } from '@/hooks/useBridgeTransfer'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'
import IconChevronDown from '@/assets/IconChevronDown'
import IconChevronUp from '@/assets/IconChevronUp'
import IconWithdrawalNodeCompleted from '@/assets/IconWithdrawalNodeCompleted'

interface DepositProps {
  deposit: TransactionRecord
}

const Deposit: React.FC<DepositProps> = ({ deposit }) => {
  const { selectedNetworkType } = useBlockchainContext()
  const smallView = useMediaQuery('(max-width: 1199px)')
  const depositInfo = {
    from: getLowNetworks(selectedNetworkType)?.find((n) => n.chainId === deposit.lowNetworkChainId)?.displayName ?? '',
    to: getHighNetworks(selectedNetworkType)?.find((n) => n.chainId === deposit.highNetworkChainId)?.displayName ?? ''
  }
  const { returnTransferData, getTransactionInputs, getHighNetworkTimestamp, claim } = useBridgeTransfer()
  const { data: transferStatus, isLoading } = returnTransferData({ txRecord: deposit })
  const { data: highNetworkTimestamp } = getHighNetworkTimestamp({ txRecord: deposit, transferStatus: transferStatus })
  const { data: transactionInputs, isLoading: isLoadingInputs } = getTransactionInputs({ txRecord: deposit })
  const finalTransactionInputs = transactionInputs || deposit.transactionInputs
  const [collapseExecuted, setCollapseExecuted] = useState(false)
  const [hovered, setHovered] = useState(false)
  return (
    <>
      {isLoading && smallView ? (
        <div className={styles.gridItem}>
          <div className={styles.loading}>Loading</div>
        </div>
      ) : (
        <>
          {smallView ? (
            <DepositMobile
              deposit={deposit}
              isLoading={isLoading}
              selectedNetworkType={selectedNetworkType}
              transactionInputs={transactionInputs}
              highNetworkTimestamp={highNetworkTimestamp}
              transferStatus={transferStatus}
            />
          ) : (
            <>
              {transferStatus?.status === BridgeTransferStatus.CCTP_REDEEMED ? (
                <>
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

                    {collapseExecuted && <IconWithdrawalNodeCompleted className={styles.gridNodeCompleted} />}
                    <div className={styles.typeDeposit}>
                      Deposit
                    </div>
                  </div>
                  <div className={styles.gridItem}
                    onClick={() => setCollapseExecuted(!collapseExecuted)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hovered ? '#393939' : 'initial'
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}>{timeAgo(deposit.lowNetworkTimestamp)}</div>
                  {!isLoadingInputs && finalTransactionInputs?.tokenSymbol ? (
                    <div className={styles.gridItem} onClick={() => setCollapseExecuted(!collapseExecuted)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: hovered ? '#393939' : 'initial'
                      }}
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => setHovered(false)}>
                      {`${finalTransactionInputs.tokenSymbol === 'USDC'
                        ? ethers.utils.formatUnits(finalTransactionInputs.amount, 6)
                        : deposit.amount} ${finalTransactionInputs.tokenSymbol}`}
                    </div>
                  ) : (
                    <div className={styles.gridItem}
                      onClick={() => setCollapseExecuted(!collapseExecuted)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: hovered ? '#393939' : 'initial'
                      }}
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => setHovered(false)}>
                      <div className={styles.loading}>
                        Loading
                      </div>
                    </div>
                  )}
                  <div
                    className={styles.gridItem}
                    onClick={() => setCollapseExecuted(!collapseExecuted)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hovered ? '#393939' : 'initial'
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}>{depositInfo.from}</div>
                  <div
                    onClick={() => setCollapseExecuted(!collapseExecuted)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hovered ? '#393939' : 'initial'
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    className={styles.gridItem}>{depositInfo.to}</div>
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
                      href={`${getBlockExplorerUrl(deposit.highNetworkChainId, selectedNetworkType)}/tx/${deposit.highNetworkHash}`}
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
                    <div>{timeAgo(deposit?.completionTimestamp)}</div>
                  </div>
                  <div className={styles.emptyCell}
                    onClick={() => setCollapseExecuted(!collapseExecuted)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hovered ? '#393939' : 'initial'
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                  >
                    {!collapseExecuted ? <IconChevronDown stroke={'#fff'} /> : <IconChevronUp stroke="#fff" />}
                  </div>
                  {collapseExecuted && (
                    <>
                      {/* INITIATE */}
                      <div className={styles.gridItemChild} title={deposit.lowNetworkHash}>
                        <div className={styles.typeCompleted}>Initiate</div>
                      </div>
                      <div className={styles.gridItemInitiate}>{timeAgo(deposit?.lowNetworkTimestamp)}</div>
                      {transactionInputs?.tokenSymbol ? (
                        <div className={styles.gridItemInitiate}>
                          {`${transactionInputs.tokenSymbol === 'USDC' ? ethers.utils.formatUnits(transactionInputs.amount, 6) : deposit.amount} ${transactionInputs.tokenSymbol}`}
                        </div>
                      ) : (
                        <div className={styles.gridItemInitiate}>
                          <div className={styles.loading}>Loading</div>
                        </div>
                      )}
                      <div className={styles.gridItemInitiate}>{depositInfo.from ?? ''}</div>
                      <div className={styles.gridItemInitiate}>{depositInfo.to ?? ''}</div>
                      <div className={styles.gridItemInitiate}>
                        <a
                          href={`${getBlockExplorerUrl(deposit.lowNetworkChainId, selectedNetworkType)}/tx/${deposit.lowNetworkHash}`}
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
                        <div className={styles.timeCenter}>{timeAgo(deposit?.completionTimestamp)}</div>
                      </div>
                      <div className={styles.emptyCellInitiate} />
                      {/* FINALIZE */}
                      <div className={styles.gridItemChild} title={deposit.lowNetworkHash}>
                        <div className={styles.typeCompleted}>Finalize</div>
                      </div>
                      <div className={styles.gridItemInitiate}>{timeAgo(deposit?.lowNetworkTimestamp)}</div>
                      {transactionInputs?.tokenSymbol ? (
                        <div className={styles.gridItemInitiate}>
                          {`${transactionInputs.tokenSymbol === 'USDC' ? ethers.utils.formatUnits(transactionInputs.amount, 6) : deposit.amount} ${transactionInputs.tokenSymbol}`}
                        </div>
                      ) : (
                        <div className={styles.gridItemInitiate}>
                          <div className={styles.loading}>Loading</div>
                        </div>
                      )}
                      <div className={styles.gridItemInitiate}>{depositInfo.from ?? ''}</div>
                      <div className={styles.gridItemInitiate}>{depositInfo.to ?? ''}</div>
                      <div className={styles.gridItemInitiate}>
                        <a
                          href={`${getBlockExplorerUrl(deposit.highNetworkChainId, selectedNetworkType)}/tx/${deposit.highNetworkHash}`}
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
                        <div className={styles.timeCenter}>{timeAgo(deposit?.completionTimestamp)}</div>
                      </div>
                      <div className={styles.emptyCellInitiate} />
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.gridItem}>
                    <div className={styles.typeDeposit}>
                      Deposit
                    </div>
                  </div>
                  <div className={styles.gridItem}>
                    {timeAgo(deposit.lowNetworkTimestamp)}
                  </div>
                  {!isLoadingInputs && finalTransactionInputs?.tokenSymbol ? (
                    <div className={styles.gridItem}>
                      {`${finalTransactionInputs.tokenSymbol === 'USDC'
                        ? ethers.utils.formatUnits(finalTransactionInputs.amount, 6)
                        : deposit.amount} ${finalTransactionInputs.tokenSymbol}`}
                    </div>
                  ) : (
                    <div className={styles.gridItem}>
                      <div className={styles.loading}>
                        Loading
                      </div>
                    </div>
                  )}
                  <div className={styles.gridItem}>{depositInfo.from}</div>
                  <div className={styles.gridItem}>{depositInfo.to}</div>
                  <>
                    {isLoading || transferStatus?.status === undefined ? (
                      <div className={styles.gridItem}>
                        <div className={styles.loading}>Loading</div>
                      </div>
                    ) : (
                      <a
                        href={`${getBlockExplorerUrl(deposit.lowNetworkChainId, selectedNetworkType)}/tx/${deposit.lowNetworkHash}`}
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
                          ) : transferStatus?.status === BridgeTransferStatus.DEPOSIT_ERC20_FUNDS_DEPOSITED_ON_CHILD || transferStatus?.status === BridgeTransferStatus.CCTP_COMPLETE ? (
                            <div className={styles.claimable}>
                              Claimable
                              <IconLinkExternal02 className={styles.arrowUp} />
                            </div>
                          ) : (
                            <div className={styles.pending}>
                              Pending
                              <IconLinkExternal02 className={styles.arrowUp} />
                            </div>
                          )}
                        </div>
                      </a>
                    )}
                    {isLoading || transferStatus?.status === undefined && !highNetworkTimestamp ? (
                      <div className={styles.gridItem}>
                        <div className={styles.loading}>Loading</div>
                      </div>
                    ) : (
                      <div className={styles.gridItemImportant}>
                        {transferStatus?.status === BridgeTransferStatus.CCTP_COMPLETE ? (
                          <>
                            <button
                              className={styles.claimButton}
                              onClick={() => {
                                claim.mutate(deposit)
                              }}
                            >
                              {claim.isLoading && !claim.isSuccess ? 'Claiming...' : 'Claim Now'}
                            </button>
                          </>
                        ) : (
                          transferStatus?.status === BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED ||
                            transferStatus?.status === BridgeTransferStatus.DEPOSIT_GAS_DEPOSITED ||
                            transferStatus?.status === BridgeTransferStatus.DEPOSIT_ERC20_FUNDS_DEPOSITED_ON_CHILD ? (
                            <>{timeAgo(highNetworkTimestamp)}</>
                          ) : (
                            <>{ETA(deposit.lowNetworkTimestamp, deposit.retryableCreationTimeout ?? 15 * 60)}</>
                          )
                        )}
                      </div>
                    )}
                  </>
                  <div className={styles.emptyCell} />
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
