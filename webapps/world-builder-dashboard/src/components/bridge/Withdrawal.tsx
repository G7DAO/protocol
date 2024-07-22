import React from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { L1_NETWORK, L2_NETWORK, L3_NATIVE_TOKEN_SYMBOL, L3_NETWORK } from '../../../constants'
import styles from './WithdrawTransactions.module.css'
import { ethers } from 'ethers'
import { Skeleton } from 'summon-ui/mantine'
import IconArrowNarrowUp from '@/assets/IconArrowNarrowUp'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import IconLoading01 from '@/assets/IconLoading01'
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { L3_NETWORKS } from '@/components/bridge/l3Networks'
import useL2ToL1MessageStatus from '@/hooks/useL2ToL1MessageStatus'
import { ETA, timeAgo } from '@/utils/timeFormat'
import { L2ToL1MessageStatus, L2ToL1MessageWriter, L2TransactionReceipt } from '@arbitrum/sdk'

const networkName = (chainId: number) => {
  const network = L3_NETWORKS.find((n) => n.chainInfo.chainId === chainId)
  return network?.chainInfo.chainName
}

const networkRPC = (chainId: number) => {
  const network = [L3_NETWORK, L2_NETWORK].find((n) => n.chainId === chainId)
  return network?.rpcs[0]
}

const networkExplorer = (chainId: number): string | undefined => {
  const network = [L3_NETWORK, L2_NETWORK].find((n) => n.chainId === chainId)
  if (network?.blockExplorerUrls) {
    return network?.blockExplorerUrls[0] ?? undefined
  }
  return
}

interface WithdrawalProps {
  txHash: string
  chainId: number
  delay: number
}
const Withdrawal: React.FC<WithdrawalProps> = ({ txHash, chainId, delay }) => {
  const l3RPC = networkRPC(chainId)
  const l3BlockExplorer = networkExplorer(chainId)
  const l3ExplorerLink = `${l3BlockExplorer}/tx/${txHash}`
  const handleStatusClick = () => {
    if (!l3ExplorerLink) {
      return
    }
    window.open(l3ExplorerLink, '_blank')
  }

  if (!l3RPC) {
    console.log('L3 RPC undefined')
    return <></>
  }
  const targetRPC = chainId === L2_NETWORK.chainId ? L1_NETWORK.rpcs[0] : L2_NETWORK.rpcs[0]
  const targetChain = chainId === L2_NETWORK.chainId ? L1_NETWORK : L2_NETWORK
  const status = useL2ToL1MessageStatus(txHash, targetRPC, l3RPC)
  const { switchChain } = useBlockchainContext()
  const queryClient = useQueryClient()

  const execute = useMutation(
    async (l2Receipt: L2TransactionReceipt | undefined) => {
      if (!l2Receipt) {
        throw new Error('receipt undefined')
      }
      const l3Provider = new ethers.providers.JsonRpcProvider(l3RPC)
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
      const res = await message.execute(l3Provider)
      const rec = await res.wait()
      console.log('Done! Your transaction is executed', rec)
      return rec
    },
    {
      onSuccess: (data) => {
        console.log(data)
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.setQueryData(['withdrawalStatus', txHash, L2_NETWORK.rpcs[0], l3RPC], (oldData: any) => {
          return { ...oldData, status: L2ToL1MessageStatus.EXECUTED }
        })
        status.refetch()
      },
      onError: (error: Error) => {
        console.log(error)
      }
    }
  )
  if (!status.isLoading && !status.data) {
    return <></>
  }

  return (
    <>
      {status.isLoading ? (
        Array.from(Array(7)).map((_, idx) => (
          <div className={styles.gridItem} key={idx}>
            <Skeleton key={idx} h='12px' w='100%' />
          </div>
        ))
      ) : (
        <>
          <div className={styles.gridItem} title={txHash}>
            <div className={styles.typeWithdrawal}>
              <IconArrowNarrowUp stroke={'#026AA2'} />
              Withdraw
            </div>
          </div>
          <div className={styles.gridItem}>{timeAgo(status.data?.timestamp)}</div>
          <div className={styles.gridItem}>{`${status.data?.value} ${L3_NATIVE_TOKEN_SYMBOL}`}</div>
          <div className={styles.gridItem}>{networkName(chainId) ?? ''}</div>
          <div className={styles.gridItem}>{L2_NETWORK.displayName}</div>
          {status.data?.status === L2ToL1MessageStatus.EXECUTED && (
            <>
              <div className={styles.gridItem}>
                <div className={styles.settled} onClick={handleStatusClick}>
                  Settled
                  {!!l3ExplorerLink && <IconLinkExternal02 stroke={'#027A48'} />}
                </div>
              </div>
              <div className={styles.gridItem}>
                <div>{`${status.data.confirmations} confirmations`}</div>
              </div>
            </>
          )}
          {status.data?.status === L2ToL1MessageStatus.CONFIRMED && (
            <>
              <div className={styles.gridItem}>
                <div className={styles.claimable} onClick={handleStatusClick}>
                  Claimable
                  {!!l3ExplorerLink && <IconLinkExternal02 stroke={'#B54708'} />}
                </div>
              </div>
              <div className={styles.gridItem}>
                <button className={styles.claimButton} onClick={() => execute.mutate(status.data?.l2Receipt)}>
                  {execute.isLoading ? <IconLoading01 color={'white'} className={styles.rotatable} /> : 'Claim now'}
                </button>
              </div>
            </>
          )}
          {status.data?.status === L2ToL1MessageStatus.UNCONFIRMED && (
            <>
              <div className={styles.gridItem}>
                <div className={styles.pending} onClick={handleStatusClick}>
                  Pending
                  {!!l3ExplorerLink && <IconLinkExternal02 stroke={'#175CD3'} />}
                </div>
              </div>
              <div className={styles.gridItem}>
                <div>{ETA(status.data?.timestamp, delay)}</div>
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}

export default Withdrawal
