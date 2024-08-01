import React, { useEffect } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import {
  HIGH_NETWORKS,
  L1_NETWORK,
  L2_NETWORK,
  L3_NATIVE_TOKEN_SYMBOL,
  L3_NETWORK,
  LOW_NETWORKS
} from '../../../../constants'
import styles from './WithdrawTransactions.module.css'
import { ethers } from 'ethers'
import { Skeleton } from 'summon-ui/mantine'
import IconArrowNarrowUp from '@/assets/IconArrowNarrowUp'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { getBlockExplorerUrl } from '@/utils/web3utils'
import { L2ToL1MessageStatus, L2ToL1MessageWriter, L2TransactionReceipt } from '@arbitrum/sdk'

const networkRPC = (chainId: number | undefined) => {
  const network = [L3_NETWORK, L2_NETWORK].find((n) => n.chainId === chainId)
  return network?.rpcs[0]
}

interface WithdrawalProps {
  withdrawal: TransactionRecord
}

const getStatus = (withdrawal: TransactionRecord) => {
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
    ? L2ToL1MessageStatus.EXECUTED
    : claimableTimestamp
      ? L2ToL1MessageStatus.CONFIRMED
      : L2ToL1MessageStatus.UNCONFIRMED
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
    // console.log(data)
  }
}
const Withdrawal: React.FC<WithdrawalProps> = ({ withdrawal }) => {
  // const targetRPC = withdrawal.highNetworkChainId === L2_NETWORK.chainId ? L1_NETWORK.rpcs[0] : L2_NETWORK.rpcs[0]
  const targetChain = withdrawal.highNetworkChainId === L2_NETWORK.chainId ? L1_NETWORK : L2_NETWORK

  // const status = useL2ToL1MessageStatus(withdrawal)
  const status = getStatus(withdrawal)
  const { switchChain, connectedAccount } = useBlockchainContext()
  const queryClient = useQueryClient()
  const { refetchNewNotifications } = useBridgeNotificationsContext()

  useEffect(() => {
    // console.log(withdrawal)
  }, [withdrawal])

  const execute = useMutation(
    async (highNetworkHash: string | undefined) => {
      if (!highNetworkHash) {
        throw new Error('transaction hash is undefined')
      }
      const highNetworkRPC = networkRPC(withdrawal.highNetworkChainId)
      const highNetworkProvider = new ethers.providers.JsonRpcProvider(highNetworkRPC)
      const receipt = await highNetworkProvider.getTransactionReceipt(highNetworkHash)
      const l2Receipt = new L2TransactionReceipt(receipt)

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
      const messages: L2ToL1MessageWriter[] = (await l2Receipt.getL2ToL1Messages(signer)) as L2ToL1MessageWriter[]
      const message = messages[0]
      console.log(messages)
      const res = await message.execute(highNetworkProvider)
      const rec = await res.wait()
      console.log('Done! Your transaction is executed', rec)
      return rec
    },
    {
      onSuccess: (data, highNetworkHash) => {
        console.log(data)
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)

          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          const newTransactions: TransactionRecord[] = transactions.map((t: any) => {
            if (t.highNetworkHash === highNetworkHash) {
              return {
                ...t,
                completionTimestamp: Date.now() / 1000,
                lowNetworkTimestamp: Date.now() / 1000,
                newTransaction: true,
                lowNetworkHash: data.transactionHash
              }
            }
            return { ...t }
          })
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(newTransactions))
        } catch (e) {
          console.log(e)
        }
        refetchNewNotifications(connectedAccount ?? '')
        queryClient.refetchQueries(['incomingMessages'])
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.setQueryData(['withdrawalStatus', withdrawal], (oldData: any) => {
          return { ...oldData, status: L2ToL1MessageStatus.EXECUTED }
        })

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
      {status.isLoading && !status.data ? (
        Array.from(Array(7)).map((_, idx) => (
          <div className={styles.gridItem} key={idx}>
            <Skeleton key={idx} h='12px' w='100%' />
          </div>
        ))
      ) : (
        <>
          <div className={styles.gridItem} title={withdrawal.highNetworkHash}>
            <div className={styles.typeWithdrawal}>
              <IconArrowNarrowUp stroke={'#026AA2'} />
              Withdraw
            </div>
          </div>
          <div className={styles.gridItem}>{timeAgo(status.data?.timestamp)}</div>
          <div className={styles.gridItem}>{`${status.data?.amount} ${L3_NATIVE_TOKEN_SYMBOL}`}</div>
          <div className={styles.gridItem}>{status.data?.from ?? ''}</div>
          <div className={styles.gridItem}>{status.data?.to ?? ''}</div>
          {status.data?.status === L2ToL1MessageStatus.EXECUTED && (
            <>
              <div className={styles.gridItem}>
                <a
                  href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
                  target={'_blank'}
                  className={styles.explorerLink}
                >
                  <div className={styles.settled}>
                    Settled
                    <IconLinkExternal02 stroke={'#027A48'} />
                  </div>
                </a>
              </div>
              <div className={styles.gridItem}>
                <div>{timeAgo(status.data.lowNetworkTimeStamp)}</div>
              </div>
            </>
          )}
          {status.data?.status === L2ToL1MessageStatus.CONFIRMED && (
            <>
              <div className={styles.gridItem}>
                <a
                  href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
                  target={'_blank'}
                  className={styles.explorerLink}
                >
                  <div className={styles.claimable}>
                    Claimable
                    <IconLinkExternal02 stroke={'#B54708'} />
                  </div>
                </a>
              </div>
              <div className={styles.gridItem}>
                <button className={styles.claimButton} onClick={() => execute.mutate(status.data.highNetworkHash)}>
                  {execute.isLoading ? 'Claiming...' : 'Claim now'}
                </button>
              </div>
            </>
          )}
          {status.data?.status === L2ToL1MessageStatus.UNCONFIRMED && (
            <>
              <div className={styles.gridItem}>
                <a
                  href={`${getBlockExplorerUrl(withdrawal.highNetworkChainId)}/tx/${withdrawal.highNetworkHash}`}
                  target={'_blank'}
                  className={styles.explorerLink}
                >
                  <div className={styles.pending}>
                    Pending
                    <IconLinkExternal02 stroke={'#175CD3'} />
                  </div>
                </a>
              </div>

              <div className={styles.gridItem}>
                <div>{ETA(status.data?.timestamp, withdrawal.challengePeriod)}</div>
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}

export default Withdrawal
