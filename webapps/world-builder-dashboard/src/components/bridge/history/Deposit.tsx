import React, { useEffect, useState } from 'react'
import { getHighNetworks, getLowNetworks, getNetworks } from '../../../../constants'
import DepositMobile from './DepositMobile'
import styles from './WithdrawTransactions.module.css'
import { BridgeTransferStatus } from 'game7-bridge-sdk'
import { useMediaQuery } from 'summon-ui/mantine'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeTransfer } from '@/hooks/useBridgeTransfer'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getAmount, getBlockExplorerUrl, getTokenSymbol } from '@/utils/web3utils'
import IconChevronDown from '@/assets/IconChevronDown'
import IconChevronUp from '@/assets/IconChevronUp'
import IconWithdrawalNodeCompleted from '@/assets/IconWithdrawalNodeCompleted'

interface DepositProps {
  deposit: TransactionRecord
}

const Deposit: React.FC<DepositProps> = ({ deposit }) => {
  const { selectedNetworkType, connectedAccount } = useBlockchainContext()
  const smallView = useMediaQuery('(max-width: 1199px)')
  const depositInfo = {
    from: getLowNetworks(selectedNetworkType)?.find((n) => n.chainId === deposit.lowNetworkChainId)?.displayName ?? '',
    to: getHighNetworks(selectedNetworkType)?.find((n) => n.chainId === deposit.highNetworkChainId)?.displayName ?? ''
  }
  const { returnTransferData, getHighNetworkTimestamp, claim } = useBridgeTransfer()
  const { data: transferStatus, isLoading } = returnTransferData({ txRecord: deposit })
  const { data: highNetworkTimestamp } = getHighNetworkTimestamp({ txRecord: deposit, transferStatus: transferStatus })
  const [collapseExecuted, setCollapseExecuted] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [amountValue, setAmountValue] = useState<string>('')
  const rpc = getNetworks(selectedNetworkType)?.find(n => n.chainId === deposit.highNetworkChainId)?.rpcs[0]

  const fetchAmount = async () => {
    const value = await getAmount(deposit.highNetworkHash ?? '', rpc ?? '')
    setAmountValue(value ?? '')
  }

  useEffect(() => {
    if (deposit.symbol === 'ETH') {
      fetchAmount()
    }
  }, [deposit.lowNetworkHash, rpc])

  const displayAmount = deposit.amount ?? amountValue



  const symbol = getTokenSymbol(deposit, connectedAccount ?? '')

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
              highNetworkTimestamp={highNetworkTimestamp}
              transferStatus={transferStatus}
              symbol={symbol}
              claim={claim}
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
                  <div className={styles.gridItem} onClick={() => setCollapseExecuted(!collapseExecuted)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hovered ? '#393939' : 'initial'
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}>
                    {displayAmount} {deposit.symbol ?? symbol}
                  </div>
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
                      <div className={styles.gridItemInitiate}>
                        {displayAmount} {deposit.symbol ?? symbol}
                      </div>
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
                      <div className={styles.gridItemInitiate}>
                        {displayAmount} {deposit.symbol ?? symbol}
                      </div>
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
                  <div className={styles.gridItem}>
                    {displayAmount} {deposit.symbol ?? symbol}
                  </div>
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
                                claim.mutate({ txRecord: deposit })
                              }}
                            >
                              {claim.isPending && !claim.isSuccess ? 'Claiming...' : 'Claim Now'}
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
