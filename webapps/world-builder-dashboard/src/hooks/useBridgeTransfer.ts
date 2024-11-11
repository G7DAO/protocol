import { useMutation, useQueryClient } from 'react-query'
import { useQuery } from 'react-query'
import { ErrorResponse, useNavigate } from 'react-router-dom'
import { ALL_NETWORKS, L1_NETWORK, L2_NETWORK } from '../../constants'
import { ethers } from 'ethers'
import { BridgeTransfer, BridgeTransferStatus } from 'game7-bridge-sdk'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'

interface UseTransferDataProps {
  txRecord: TransactionRecord
}

export const useBridgeTransfer = () => {
  const returnTransferData = ({ txRecord }: UseTransferDataProps) => {
    const { connectedAccount } = useBlockchainContext()
    // Pre-compute properties for cleaner instantiation
    const isDeposit = txRecord.type === 'DEPOSIT'
    const txHash = isDeposit ? txRecord.lowNetworkHash : txRecord.highNetworkHash
    const destinationChainId = isDeposit ? txRecord.highNetworkChainId : txRecord.lowNetworkChainId
    const originChainId = isDeposit ? txRecord.lowNetworkChainId : txRecord.highNetworkChainId
    const destinationRpc = ALL_NETWORKS.find((n) => n.chainId === destinationChainId)?.rpcs[0]
    const originRpc = ALL_NETWORKS.find((n) => n.chainId === originChainId)?.rpcs[0]

    const getCachedTransactions = () => {
      const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
      return transactionsString ? JSON.parse(transactionsString) : []
    }

    let status: any
    return useQuery(
      ['transferData', txRecord],
      async () => {
        const _bridgeTransfer = new BridgeTransfer({
          txHash: txHash ?? '',
          destinationNetworkChainId: destinationChainId ?? 0,
          originNetworkChainId: originChainId ?? 0,
          destinationSignerOrProviderOrRpc: destinationRpc,
          originSignerOrProviderOrRpc: originRpc
        })
        try {
          status = await _bridgeTransfer.getStatus()
          const transactions = getCachedTransactions()

          const newTransactions: TransactionRecord[] = transactions.map((t: TransactionRecord) => {
            const isSameHash = isDeposit
              ? t.lowNetworkHash === txRecord.lowNetworkHash
              : t.highNetworkHash === txRecord.highNetworkHash
            return isSameHash ? { ...t, status: status?.status === undefined ? 0 : status?.status } : t
          })

          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(newTransactions))

          return status
        } catch (error: any) {
          const transactions = getCachedTransactions()
          const cachedTransaction = transactions.find((t: TransactionRecord) =>
            isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
          )

          if (cachedTransaction && cachedTransaction.status !== undefined) {
            status = cachedTransaction.status
            return { status }
          }
        }
      },
      {
        placeholderData: () => {
          const transactions = getCachedTransactions()
          const cachedTransaction = transactions.find((t: TransactionRecord) =>
            isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
          )

          if (cachedTransaction && cachedTransaction.status !== undefined) {
            status = cachedTransaction.status
            return { status }
          }
        },
        // if status is completed, no need to refetch again. if pending, refetch every 1-2 minutes
        refetchInterval: [2, 6, 9].includes(status?.status) ? false : 60 * 5 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!txRecord && ![2, 6, 9].includes(status?.status),
        retry: (error) => {
          return (error as { status?: number }).status === 429
        },
        retryDelay: (failureCount) => {
          return Math.min(2 ** failureCount * 2000, 30000)
        }
      }
    )
  }

  // Mutate function
  const navigate = useNavigate()
  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const queryClient = useQueryClient()
  const { switchChain, connectedAccount } = useBlockchainContext()

  const claim = useMutation(
    async (withdrawal: TransactionRecord | undefined) => {
      if (!withdrawal) {
        throw new Error('transaction hash is undefined')
      }
      const targetChain = withdrawal.highNetworkChainId === L2_NETWORK.chainId ? L1_NETWORK : L2_NETWORK

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
        originNetworkChainId: withdrawal.highNetworkChainId ?? 0,
        destinationSignerOrProviderOrRpc: ALL_NETWORKS.find((n) => n.chainId === withdrawal.lowNetworkChainId)?.rpcs[0],
        originSignerOrProviderOrRpc: ALL_NETWORKS.find((n) => n.chainId === withdrawal.highNetworkChainId)?.rpcs[0]
      })
      const res = await _bridgeTransfer?.execute(signer)
      return { res, withdrawal }
    },
    {
      onSuccess: ({ res, withdrawal }) => {
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
          let transactions = transactionsString ? JSON.parse(transactionsString) : []
          const newTransactions: TransactionRecord[] = transactions.map((t: TransactionRecord) => {
            if (t.highNetworkHash === withdrawal.highNetworkHash) {
              return {
                ...t,
                completionTimestamp: Date.now() / 1000,
                lowNetworkTimestamp: Date.now() / 1000,
                newTransaction: true,
                lowNetworkHash: res?.transactionHash,
                status: BridgeTransferStatus.WITHDRAW_EXECUTED
              }
            }
            return { ...t }
          })
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(newTransactions))
        } catch (e) {
          console.log(e)
        }
        refetchNewNotifications(connectedAccount ?? '')
        queryClient.refetchQueries(['transferData', withdrawal])
        queryClient.refetchQueries(['incomingMessages'])
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        navigate('/bridge/transactions')
      },
      onError: (error: Error) => {
        console.log(error)
      }
    }
  )
  return {
    returnTransferData,
    claim
  }
}
