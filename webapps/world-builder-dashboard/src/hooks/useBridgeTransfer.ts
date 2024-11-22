import { useMutation, useQueryClient } from 'react-query'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { getNetworks, L1_NETWORK, L2_NETWORK } from '../../constants'
import { ethers } from 'ethers'
import { BridgeTransfer, BridgeTransferStatus } from 'game7-bridge-sdk'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'

interface UseTransferDataProps {
  txRecord: TransactionRecord
}

export const useBridgeTransfer = () => {
  const { connectedAccount, selectedNetworkType, switchChain } = useBlockchainContext()

  const returnTransferData = ({ txRecord }: UseTransferDataProps) => {
    const isDeposit = txRecord.type === 'DEPOSIT'
    const txHash = isDeposit ? txRecord.lowNetworkHash : txRecord.highNetworkHash
    const destinationChainId = isDeposit ? txRecord.highNetworkChainId : txRecord.lowNetworkChainId
    const originChainId = isDeposit ? txRecord.lowNetworkChainId : txRecord.highNetworkChainId
    const destinationRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === destinationChainId)?.rpcs[0]
    const originRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === originChainId)?.rpcs[0]

    const getCachedTransactions = () => {
      const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions-${selectedNetworkType}`)
      return transactionsString ? JSON.parse(transactionsString) : []
    }

    // If the status is pending and time since last fetched is 2 minutes, fetch again
    const shouldFetchStatus = (cachedTransaction: any) => {
      const isPending = ![2, 6, 9].includes(cachedTransaction?.status)
      const timeSinceLastUpdate = Date.now() - (cachedTransaction?.lastUpdated || 0)
      return isPending && timeSinceLastUpdate > 1 * 60 * 1000
    }

    let status: any
    return useQuery(
      ['transferData', txHash],
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

          const newTransactions = transactions.map((t: any) => {
            const isSameHash = isDeposit
              ? t.lowNetworkHash === txRecord.lowNetworkHash
              : t.highNetworkHash === txRecord.highNetworkHash

            return isSameHash ? { ...t, status: status?.status, lastUpdated: Date.now() } : t
          })

          localStorage.setItem(
            `bridge-${connectedAccount}-transactions-${selectedNetworkType}`,
            JSON.stringify(newTransactions)
          )

          return status
        } catch (error) {
          const transactions = getCachedTransactions()
          const cachedTransaction = transactions.find((t: any) =>
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
          const cachedTransaction = transactions.find((t: any) =>
            isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
          )

          if (cachedTransaction && cachedTransaction.status !== undefined) {
            status = cachedTransaction.status
            return { status }
          }
        },
        staleTime: 1 * 60 * 1000,
        refetchInterval: shouldFetchStatus(
          getCachedTransactions().find((t: TransactionRecord) =>
            t.type === 'DEPOSIT' ? t.lowNetworkHash === txHash : t.highNetworkHash === txHash
          )
        )
          ? 1 * 60 * 1000
          : false,
        refetchOnWindowFocus: false,
        enabled: !!txRecord && shouldFetchStatus(getCachedTransactions().find((t: any) => t.txHash === txHash))
      }
    )
  }

  // Mutate function
  const navigate = useNavigate()
  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const queryClient = useQueryClient()

  const claim = useMutation(
    async (withdrawal: TransactionRecord | undefined) => {
      if (!withdrawal) {
        throw new Error('transaction hash is undefined')
      }

      const targetChain = withdrawal.highNetworkChainId === L2_NETWORK.chainId ? L1_NETWORK : L2_NETWORK
      console.log(targetChain)
      let provider
      if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum)
        const currentChain = await provider.getNetwork()
        if (currentChain.chainId !== targetChain.chainId) {
          console.log('about to switch')
          await switchChain(targetChain)
          console.log('switching?')
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
        destinationSignerOrProviderOrRpc: getNetworks(selectedNetworkType)?.find(
          (n) => n.chainId === withdrawal.lowNetworkChainId
        )?.rpcs[0],
        originSignerOrProviderOrRpc: getNetworks(selectedNetworkType)?.find(
          (n) => n.chainId === withdrawal.highNetworkChainId
        )?.rpcs[0]
      })

      const res = await _bridgeTransfer?.execute(signer)
      return { res, withdrawal }
    },
    {
      onSuccess: ({ res, withdrawal }) => {
        try {
          const transactionsString = localStorage.getItem(
            `bridge-${connectedAccount}-transactions-${selectedNetworkType}`
          )
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
            console.log("couldn't find the transaction..")
            return { ...t }
          })
          localStorage.setItem(
            `bridge-${connectedAccount}-transactions-${selectedNetworkType}`,
            JSON.stringify(newTransactions)
          )
        } catch (e) {
          console.log(e)
        }
        refetchNewNotifications(connectedAccount ?? '')
        queryClient.refetchQueries(['transferData', withdrawal?.highNetworkHash])
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

  const getTransactionInputs = ({ txRecord }: UseTransferDataProps) => {
    const isDeposit = txRecord.type === 'DEPOSIT'
    const txHash = isDeposit ? txRecord.lowNetworkHash : txRecord.highNetworkHash
    const destinationChainId = isDeposit ? txRecord.highNetworkChainId : txRecord.lowNetworkChainId
    const originChainId = isDeposit ? txRecord.lowNetworkChainId : txRecord.highNetworkChainId
    const destinationRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === destinationChainId)?.rpcs[0]
    const originRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === originChainId)?.rpcs[0]

    let transactionInputs: any

    return useQuery(
      ['transactionInputs', txHash],
      async () => {
        const _bridgeTransfer = new BridgeTransfer({
          txHash: txHash ?? '',
          destinationNetworkChainId: destinationChainId ?? 0,
          originNetworkChainId: originChainId ?? 0,
          destinationSignerOrProviderOrRpc: destinationRpc,
          originSignerOrProviderOrRpc: originRpc
        })

        transactionInputs = await _bridgeTransfer.getTransactionInputs()
        return transactionInputs
      },
      {
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!txRecord
      }
    )
  }

  return {
    getTransactionInputs,
    returnTransferData,
    claim
  }
}
