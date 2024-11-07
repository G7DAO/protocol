import { useMutation, useQueryClient } from 'react-query'
import { useQuery } from 'react-query'
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
    return useQuery(
      ['transferData', txRecord],
      async () => {
        const _bridgeTransfer = new BridgeTransfer({
          txHash: (txRecord.type === 'DEPOSIT' ? txRecord.lowNetworkHash : txRecord.highNetworkHash) ?? '',
          destinationNetworkChainId:
            (txRecord.type === 'DEPOSIT' ? txRecord.highNetworkChainId : txRecord.lowNetworkChainId) ?? 0,
          originNetworkChainId:
            (txRecord.type === 'DEPOSIT' ? txRecord.lowNetworkChainId : txRecord.highNetworkChainId) ?? 0,
          destinationSignerOrProviderOrRpc:
            txRecord.type === 'DEPOSIT'
              ? ALL_NETWORKS.find((n) => n.chainId === txRecord.highNetworkChainId)?.rpcs[0]
              : ALL_NETWORKS.find((n) => n.chainId === txRecord.lowNetworkChainId)?.rpcs[0],
          originSignerOrProviderOrRpc:
            txRecord.type === 'DEPOSIT'
              ? ALL_NETWORKS.find((n) => n.chainId === txRecord.lowNetworkChainId)?.rpcs[0]
              : ALL_NETWORKS.find((n) => n.chainId === txRecord.highNetworkChainId)?.rpcs[0]
        })

        const status = await _bridgeTransfer.getStatus()

        const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
        const transactions = transactionsString ? JSON.parse(transactionsString) : []

        const newTransactions: TransactionRecord[] = transactions.map((t: TransactionRecord) => {
          const hashComparison: boolean =
            txRecord.type === 'DEPOSIT'
              ? t.lowNetworkHash === txRecord.lowNetworkHash
              : t.highNetworkHash === txRecord.highNetworkHash

          if (hashComparison) {
            return { ...t, status: status?.status }
          }
          return { ...t }
        })
        localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(newTransactions))
        return status
      },
      {
        // initialData: () => {
        //   const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
        //   if (transactionsString) {
        //     const transactions = JSON.parse(transactionsString)
        //     const cachedTransaction = transactions.find((t: TransactionRecord) =>
        //       txRecord.type === 'DEPOSIT'
        //         ? t.lowNetworkHash === txRecord.lowNetworkHash
        //         : t.highNetworkHash === txRecord.highNetworkHash
        //     )
        //     if (cachedTransaction && cachedTransaction.status) {
        //       return { status: cachedTransaction.status }
        //     }
        //   }
        // },
        refetchInterval: 60 * 15 * 1000,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!txRecord,
        // onSuccess: (status) => {
        //   console.log("checking...")
        //   const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
        //   const transactions = transactionsString ? JSON.parse(transactionsString) : []

        //   const newTransactions: TransactionRecord[] = transactions.map((t: TransactionRecord) => {
        //     const hashComparison: boolean =
        //       txRecord.type === 'DEPOSIT'
        //         ? t.lowNetworkHash === txRecord.lowNetworkHash
        //         : t.highNetworkHash === txRecord.highNetworkHash

        //     if (hashComparison && t.status !== status?.status) {
        //       return { ...t, status: status?.status }
        //     }
        //     return { ...t }
        //   })
        //   localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(newTransactions))
        // }
      }
    )
  }

  // Mutate function

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
      onSuccess: ({ res, withdrawal }, highNetworkHash) => {
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
          let transactions = transactionsString ? JSON.parse(transactionsString) : []
          const newTransactions: TransactionRecord[] = transactions.map((t: TransactionRecord) => {
            if (t.highNetworkHash === highNetworkHash) {
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
        queryClient.refetchQueries(['pendingTransactions'])
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
