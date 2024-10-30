import React from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { HIGH_NETWORKS, L1_NETWORK, L2_NETWORK, L3_NETWORK, LOW_NETWORKS } from '../../../../constants'
import styles from './WithdrawTransactions.module.css'
import { ethers } from 'ethers'
import { BridgeTransfer } from 'game7-bridge-sdk'
import IconArrowNarrowUp from '@/assets/IconArrowNarrowUp'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import IconWithdrawalNodeCompleted from '@/assets/IconWithdrawalNodeCompleted'
import WithdrawalMobile from '@/components/bridge/history/WithdrawalMobile'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import useTransferData from '@/hooks/useTransferData'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'
import { ChildToParentMessageStatus } from '@arbitrum/sdk'
import { useMediaQuery } from '@mantine/hooks'

export const networkRPC = (chainId: number | undefined) => {
  const network = [L3_NETWORK, L2_NETWORK].find((n) => n.chainId === chainId)
  return network?.rpcs[0]
}

interface WithdrawalProps {
  withdrawal: TransactionRecord
}

export const getStatus = (withdrawal: TransactionRecord) => {
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
  const lowNetwork = LOW_NETWORKS.find((n) => n.chainId === lowNetworkChainId)
  const highNetwork = HIGH_NETWORKS.find((n) => n.chainId === highNetworkChainId)
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
  const targetChain = withdrawal.highNetworkChainId === L2_NETWORK.chainId ? L1_NETWORK : L2_NETWORK
  const status = getStatus(withdrawal)
  const { switchChain, connectedAccount } = useBlockchainContext()
  const queryClient = useQueryClient()
  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const smallView = useMediaQuery('(max-width: 1199px)')
  const { data: transferStatus, isLoading } = useTransferData({ txRecord: withdrawal })
  // Mutate function
  const execute = useMutation(
    async (highNetworkHash: string | undefined) => {
      if (!highNetworkHash) {
        throw new Error('transaction hash is undefined')
      }

      let provider
      if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum)
        const currentChain = await provider.getNetwork()
        if (currentChain.chainId !== targetChain.chainId) {
          await switchChain(targetChain)
          provider = new ethers.providers.Web3Provider(window.ethereum) //refresh provider
        }
      } else {
        throw new Error('Wallet is not installed!')
      }
      const signer = provider.getSigner()

      // Bridge Transfer execute
      const _bridgeTransfer = new BridgeTransfer({
        txHash: withdrawal.highNetworkHash || '',
        destinationNetworkChainId: withdrawal.lowNetworkChainId ?? 0,
        originNetworkChainId: withdrawal.highNetworkChainId ?? 0
      })
      const res = await _bridgeTransfer?.execute(signer)
      return res
    },
    {
      onSuccess: (data, highNetworkHash) => {
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)

          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          const newTransactions: TransactionRecord[] = transactions.map((t: TransactionRecord) => {
            if (t.highNetworkHash === highNetworkHash) {
              return {
                ...t,
                completionTimestamp: Date.now() / 1000,
                lowNetworkTimestamp: Date.now() / 1000,
                newTransaction: true,
                lowNetworkHash: data?.transactionHash
              }
            }
            return { ...t }
          })
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(newTransactions))
        } catch (e) {
          console.log(e)
        }
        refetchNewNotifications(connectedAccount ?? '')
        queryClient.refetchQueries(['transferData'])
        queryClient.refetchQueries(['incomingMessages'])
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])

        // status.refetch()
        queryClient.refetchQueries(['pendingTransactions'])
      },
      onError: (error: Error) => {
        console.log(error)
      }
    }
  )

  if (!status) {
    return <></>
  }

  return (
    <>
      {isLoading && smallView ? (
        <div className={styles.gridItem}>
          <div className={styles.loading}>Loading</div>
        </div>
      ) : (
        <>
          {smallView ? (
            <WithdrawalMobile
              withdrawal={withdrawal}
              execute={execute}
              status={status}
              transferStatus={transferStatus}
            />
          ) : (
            <>
              {isLoading ? (
                <>
                  <div className={styles.gridItem} title={withdrawal.highNetworkHash}>
                    <div className={styles.typeWithdrawal}>
                      <IconArrowNarrowUp className={styles.arrowUp} />
                      Withdraw
                    </div>
                  </div>
                  <div className={styles.gridItem}>{timeAgo(status.data?.timestamp)}</div>
                  <div className={styles.gridItem}>{`${status.data?.amount} ${withdrawal.symbol}`}</div>
                  <div className={styles.gridItem}>{status.data?.from ?? ''}</div>
                  <div className={styles.gridItem}>{status.data?.to ?? ''}</div>
                  <div className={styles.gridItem}>
                    <div className={styles.loading}>Loading</div>
                  </div>
                  <div className={styles.gridItem}>
                    <div className={styles.loading}>Loading</div>
                  </div>
                </>
              ) : (
                <>
                  {' '}
                  {transferStatus && transferStatus?.status === ChildToParentMessageStatus.EXECUTED && (
                    <>
                      <div className={styles.gridItem} title={withdrawal.highNetworkHash}>
                        <IconWithdrawalNodeCompleted className={styles.gridNodeCompleted} />
                        <div className={styles.typeWithdrawal}>
                          <IconArrowNarrowUp className={styles.arrowUp} />
                          Withdraw
                        </div>
                      </div>
                      <div className={styles.gridItem}>{timeAgo(status.data?.timestamp)}</div>
                      <div className={styles.gridItem}>{`${status.data?.amount} ${withdrawal.symbol}`}</div>
                      <div className={styles.gridItem}>{status.data?.from ?? ''}</div>
                      <div className={styles.gridItem}>{status.data?.to ?? ''}</div>
                      <div className={styles.gridItem}>
                        <a
                          href={`${getBlockExplorerUrl(withdrawal.lowNetworkChainId)}/tx/${withdrawal.lowNetworkHash}`}
                          target={'_blank'}
                          className={styles.explorerLink}
                        >
                          <div className={styles.settled}>
                            Completed
                            <IconLinkExternal02 stroke={'#fff'} />
                          </div>
                        </a>
                      </div>
                      <div className={styles.gridItemImportant}>
                        <div>{timeAgo(status.data.lowNetworkTimeStamp)}</div>
                      </div>
                      <div className={styles.gridItemChild} title={withdrawal.highNetworkHash}>
                        <div className={styles.typeCompleted}>Initiate</div>
                      </div>
                      <div className={styles.gridItemInitiate}>{timeAgo(status.data?.timestamp)}</div>
                      <div className={styles.gridItemInitiate}>{`${status.data?.amount} ${withdrawal.symbol}`}</div>
                      <div className={styles.gridItemInitiate}>{status.data?.from ?? ''}</div>
                      <div className={styles.gridItemInitiate}>{status.data?.to ?? ''}</div>
                      <div className={styles.gridItemInitiate}>
                        <a
                          href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
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
                        <div className={styles.timeCenter}>{timeAgo(status.data.lowNetworkTimeStamp)}</div>
                      </div>
                      <div className={styles.gridItemChild} title={withdrawal.highNetworkHash}>
                        <div className={styles.typeCompleted}>Finalize</div>
                      </div>
                      <div className={styles.gridItemInitiate}>{timeAgo(withdrawal?.completionTimestamp)}</div>
                      <div className={styles.gridItemInitiate}>{`${status.data?.amount} ${withdrawal.symbol}`}</div>
                      <div className={styles.gridItemInitiate}>{status.data?.from ?? ''}</div>
                      <div className={styles.gridItemInitiate}>{status.data?.to ?? ''}</div>
                      <div className={styles.gridItemInitiate}>
                        <a
                          href={`${getBlockExplorerUrl(withdrawal.lowNetworkChainId)}/tx/${withdrawal.lowNetworkHash}`}
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
                        <div className={styles.timeCenter}>{timeAgo(status.data.lowNetworkTimeStamp)}</div>
                      </div>
                    </>
                  )}
                  {transferStatus && transferStatus.status != ChildToParentMessageStatus.EXECUTED && (
                    <>
                      <div className={styles.gridItem} title={withdrawal.highNetworkHash}>
                        <div className={styles.typeWithdrawal}>
                          <IconArrowNarrowUp className={styles.arrowUp} />
                          Withdraw
                        </div>
                      </div>
                      <div className={styles.gridItem}>{timeAgo(status.data?.timestamp)}</div>
                      <div className={styles.gridItem}>{`${status.data?.amount} ${withdrawal.symbol}`}</div>
                      <div className={styles.gridItem}>{status.data?.from ?? ''}</div>
                      <div className={styles.gridItem}>{status.data?.to ?? ''}</div>
                      {transferStatus && transferStatus.status === ChildToParentMessageStatus.CONFIRMED && (
                        <>
                          <div className={styles.gridItem}>
                            <a
                              href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
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
                            <button
                              className={styles.claimButton}
                              onClick={() => execute.mutate(status.data.highNetworkHash)}
                            >
                              {execute.isLoading && !execute.isSuccess ? 'Claiming...' : 'Claim Now'}
                            </button>
                          </div>
                        </>
                      )}
                      {transferStatus && transferStatus.status === ChildToParentMessageStatus.UNCONFIRMED && (
                        <>
                          <div className={styles.gridItem}>
                            <a
                              href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
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
                            <div>{ETA(status.data?.timestamp, withdrawal.challengePeriod)} left</div>
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
