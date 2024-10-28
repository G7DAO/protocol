import React, { useEffect, useRef, useState } from 'react'
import { HIGH_NETWORKS, LOW_NETWORKS } from '../../../../constants'
import styles from './WithdrawTransactions.module.css'
import { BridgeTransfer, BridgeTransferStatus } from 'game7-bridge-sdk'
import { Skeleton, useMediaQuery } from 'summon-ui/mantine'
import IconArrowNarrowDown from '@/assets/IconArrowNarrowDown'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useDepositStatus } from '@/hooks/useL2ToL1MessageStatus'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
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
  const [transferStatus, setTransferStatus] = useState<any>(deposit?.status)
  const smallView = useMediaQuery('(max-width: 1199px)')
  const { connectedAccount } = useBlockchainContext()

  useEffect(() => {
    if (!deposit) return
    const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
    let transactions: TransactionRecord[] = []
    if (transactionsString) {
      transactions = JSON.parse(transactionsString)
    }
    const savedTransaction = transactions.find((t) => t.highNetworkHash === deposit.highNetworkHash)
    if (savedTransaction && savedTransaction.status !== undefined) {
      setTransferStatus(savedTransaction.status)
    } else {
      const _bridgeTransfer = new BridgeTransfer({
        txHash: deposit.lowNetworkHash || '',
        destinationNetworkChainId: deposit.highNetworkChainId ?? 0,
        originNetworkChainId: deposit.lowNetworkChainId ?? 0
      })

      const getStatus = async () => {
        const _status = await _bridgeTransfer.getStatus()
        setTransferStatus(_status)
        const updatedTransactions = transactions.map((t) =>
          t.highNetworkHash === deposit.highNetworkHash ? { ...t, status: _status } : t
        )
        localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(updatedTransactions))
      }
      getStatus()
    }
  }, [deposit, connectedAccount])

  return (
    <>
      {!transferStatus?.status ? (
        !smallView ? (
          Array.from(Array(7)).map((_, idx) => (
            <div className={styles.gridItem} key={idx}>
              <Skeleton key={idx} h='12px' w='100%' color='#373737' animate />
            </div>
          ))
        ) : (
          <div className={styles.gridItem}>
            <Skeleton h='12px' w='100%' color='#373737' animate />
          </div>
        )
      ) : (
        <>
          <div className={styles.gridItem}>
            <div className={styles.typeDeposit}>
              Deposit
              <IconArrowNarrowDown className={styles.arrowUp} />
            </div>
          </div>
          <div className={styles.gridItem}>{timeAgo(deposit.lowNetworkTimestamp)}</div>
          <div className={styles.gridItem}>{`${deposit.amount} ${deposit.symbol}`}</div>
          <div className={styles.gridItem}>{depositInfo.from}</div>
          <div className={styles.gridItem}>{depositInfo.to}</div>
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
        </>
      )}
    </>
  )
}

export default Deposit
