// External Libraries
import React, { Fragment } from 'react'
// Styles
import styles from './WithdrawTransactions.module.css'
import { ethers } from 'ethers'
// Absolute Imports
import Deposit from '@/components/bridge/history/Deposit'
import Withdrawal from '@/components/bridge/history/Withdrawal'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeAPI } from '@/hooks/useBridgeAPI'
import { useMessages } from '@/hooks/useL2ToL1MessageStatus'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'

interface WithdrawTransactionsProps {}
const HistoryDesktop: React.FC<WithdrawTransactionsProps> = () => {
  const { connectedAccount } = useBlockchainContext()
  const messages = useMessages(connectedAccount)
  const headers = ['Type', 'Submitted', 'Token', 'From', 'To', 'Transaction', 'Status']

  const { useHistoryTransactions } = useBridgeAPI()
  const { data: apiTransactions } = useHistoryTransactions(connectedAccount)
  const mapAPIDataToTransactionRecord = (apiData: any): TransactionRecord => {
    const amountFormatted = apiData?.amount ? ethers.utils.formatEther(apiData.amount) : '0.0'
    return {
      type: apiData.type,
      amount: amountFormatted,
      lowNetworkChainId: apiData.parentNetworkChainId,
      highNetworkChainId: apiData.childNetworkChainId,
      lowNetworkHash: apiData.parentNetworkHash,
      highNetworkHash: apiData.childNetworkHash,
      lowNetworkTimestamp: apiData.parentNetworkTimestamp,
      highNetworkTimestamp: apiData.childNetworkTimestamp,
      completionTimestamp: apiData.completionTimestamp,
      claimableTimestamp: apiData.claimableTimestamp,
      challengePeriod: apiData.challengePeriod
    }
  }

  // Transform API transactions into TransactionRecord format
  const transactions = apiTransactions?.map((apiTx: any) => mapAPIDataToTransactionRecord(apiTx)) || []
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {messages.data && (
          <div className={styles.transactions}>
            <div className={styles.withdrawsGrid}>
              {headers.map((h) => (
                <div className={styles.transactionsHeader} key={h}>
                  {h}
                </div>
              ))}
              {transactions ? (
                transactions
                  .filter((tx: any) => tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL')
                  .map((tx: TransactionRecord, idx: number) =>
                    tx.type === 'WITHDRAWAL' ? (
                      <Withdrawal withdrawal={tx} key={idx} />
                    ) : (
                      <Fragment key={idx}>{tx.lowNetworkHash && <Deposit deposit={tx} />}</Fragment>
                    )
                  )
              ) : (
                <></>
              )}
              {messages.data.filter((tx) => tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL').length === 0 && (
                <div className={styles.noTransactions}> No transactions yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryDesktop
