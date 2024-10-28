import React, { useEffect, useRef, useState } from 'react'
import { HIGH_NETWORKS, LOW_NETWORKS } from '../../../../constants'
import styles from './WithdrawTransactions.module.css'
import { BridgeTransfer, BridgeTransferStatus } from 'game7-bridge-sdk'
import { Skeleton } from 'summon-ui/mantine'
import IconArrowNarrowDown from '@/assets/IconArrowNarrowDown'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { useDepositStatus } from '@/hooks/useL2ToL1MessageStatus'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'

interface DepositProps {
  deposit: TransactionRecord
}
const Deposit: React.FC<DepositProps> = ({ deposit }) => {
  const depositDrilled = useRef(false)
  const depositInfo = {
    from: LOW_NETWORKS.find((n) => n.chainId === deposit.lowNetworkChainId)?.displayName ?? '',
    to: HIGH_NETWORKS.find((n) => n.chainId === deposit.highNetworkChainId)?.displayName ?? ''
  }
  const status = useDepositStatus(deposit)
  const [bridgeTransfer, setBridgeTransfer] = useState<BridgeTransfer>()
  const [transferStatus, setTransferStatus] = useState<any>(undefined)
  const [transactionInputs, setTransactionInputs] = useState<any>(undefined)

  useEffect(() => {
    if (!deposit || depositDrilled.current) return
    const _bridgeTransfer = new BridgeTransfer({
      txHash: deposit.lowNetworkHash || '',
      destinationNetworkChainId: deposit.highNetworkChainId ?? 0,
      originNetworkChainId: deposit.lowNetworkChainId ?? 0
    })
    setBridgeTransfer(_bridgeTransfer)
    const getTransferData = async () => {
      const _status = await _bridgeTransfer.getStatus()
      // console.log(_status)
      setTransferStatus(_status.status)
      const _transactionInputs = await _bridgeTransfer.getTransactionInputs()
      console.log(_transactionInputs)
      setTransactionInputs(_transactionInputs)
    }
    getTransferData()
    depositDrilled.current = true
  }, [deposit])

  return (
    <>
      {!transferStatus ? (
        Array.from(Array(7)).map((_, idx) => (
          <div className={styles.gridItem} key={idx}>
            <Skeleton key={idx} h='12px' w='100%' />
          </div>
        ))
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
                {transferStatus === BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED ||
                transferStatus === BridgeTransferStatus.DEPOSIT_GAS_DEPOSITED ? (
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
