import { useMutation, useQueryClient } from 'react-query'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { getNetworks, L1_MAIN_NETWORK, L1_NETWORK, L2_MAIN_NETWORK, L2_NETWORK } from '../../constants'
import { ethers } from 'ethers'
import { BridgeTransfer, BridgeTransferStatus } from 'game7-bridge-sdk'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { fetchTransactionTimestamp, getCachedTransactions } from '@/utils/web3utils'

interface UseTransferDataProps {
  txRecord: TransactionRecord
}

export const useBridgeTransfer = () => {
  const { connectedAccount, selectedNetworkType, switchChain } = useBlockchainContext()
  // Retry function with exponential backoff for handling 429 errors
  const retryWithExponentialBackoff = async (fn: () => Promise<any>, retries = 5, delay = 1000, jitterFactor = 0.5) => {
    let attempt = 0

    while (attempt < retries) {
      try {
        return await fn()
      } catch (error: any) {
        // Add network failure errors to retryable conditions
        const isNetworkError = error.message?.includes('net::ERR_FAILED') ||
          error.message?.includes('Network Error') ||
          error.code === 'ECONNABORTED' ||
          !error.response;
        const retryableStatusCodes = [429, 503, 502, 500];

        if ((isNetworkError || retryableStatusCodes.includes(error?.response?.status)) && attempt < retries - 1) {
          const baseDelay = delay * 2 ** attempt
          const jitter = baseDelay * (Math.random() * jitterFactor * 2 - jitterFactor)
          const retryDelay = Math.max(baseDelay + jitter, 0)
          console.warn(`Retry attempt ${attempt + 1}/${retries} after ${retryDelay}ms due to:`, error.message)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
          attempt++
        } else {
          throw error
        }
      }
    }
  }

  const returnTransferData = ({ txRecord }: UseTransferDataProps) => {
    const isDeposit = txRecord.type === 'DEPOSIT'
    const txHash = isDeposit ? txRecord.lowNetworkHash : txRecord.highNetworkHash
    const destinationChainId = isDeposit ? txRecord.highNetworkChainId : txRecord.lowNetworkChainId
    const originChainId = isDeposit ? txRecord.lowNetworkChainId : txRecord.highNetworkChainId
    const destinationRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === destinationChainId)?.rpcs[0]
    const originRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === originChainId)?.rpcs[0]

    // If the status is pending and time since last fetched is > 2 minutes, fetch again
    const shouldFetchStatus = (cachedTransaction: any) => {
      const isPending = ![1, 2, 6, 9].includes(cachedTransaction?.status)
      const timeSinceLastUpdate = Date.now() - (cachedTransaction?.lastUpdated || 0)
      return isPending && timeSinceLastUpdate > 1 * 60 * 1000
    }

    let status: any

    return useQuery(
      ['transferData', txHash],
      async () => {
        const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)
        const cachedTransaction = transactions.find((t: any) =>
          isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
        )

        if (cachedTransaction?.status && !shouldFetchStatus(cachedTransaction)) {
          return { status: cachedTransaction.status }
        }
        const _bridgeTransfer = new BridgeTransfer({
          txHash: txHash ?? '',
          destinationNetworkChainId: destinationChainId ?? 0,
          originNetworkChainId: originChainId ?? 0,
          destinationSignerOrProviderOrRpc: destinationRpc,
          originSignerOrProviderOrRpc: originRpc
        })

        try {
          // Fetch status with retry logic
          status = await retryWithExponentialBackoff(async () => await _bridgeTransfer.getStatus())

          // Update the cache with the latest status
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
          console.error('Error fetching status:', error)

          // Fallback to cached status if available
          const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)
          const cachedTransaction = transactions.find((t: any) =>
            isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
          )

          if (cachedTransaction && cachedTransaction.status !== undefined) {
            status = cachedTransaction.status
            return { status, ...cachedTransaction } // Return cached status
          }

          throw error // Re-throw error if no cache
        }
      },
      {
        // Placeholder data from cache
        placeholderData: () => {
          const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)
          const cachedTransaction = transactions.find((t: any) =>
            isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
          )

          if (cachedTransaction && cachedTransaction.status !== undefined) {
            status = cachedTransaction.status
            return { status }
          }
        },
        staleTime: 0.5 * 60 * 1000,
        refetchInterval: shouldFetchStatus(
          getCachedTransactions(connectedAccount ?? '', selectedNetworkType).find((t: any) =>
            t.type === 'DEPOSIT' ? t.lowNetworkHash === txHash : t.highNetworkHash === txHash
          )
        )
          ? 1 * 60 * 1000
          : false,
        refetchOnWindowFocus: false,
        enabled: !!txRecord
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

      let targetChain
      if (selectedNetworkType === 'Testnet')
        targetChain = withdrawal.highNetworkChainId === L2_NETWORK.chainId ? L1_NETWORK : L2_NETWORK
      else targetChain = withdrawal.highNetworkChainId === L2_MAIN_NETWORK.chainId ? L1_MAIN_NETWORK : L2_MAIN_NETWORK

      let provider
      if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum)
        const currentChain = await provider.getNetwork()
        if (currentChain.chainId !== targetChain.chainId) {
          await switchChain(targetChain)
          provider = new ethers.providers.Web3Provider(window.ethereum)
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

    // Check cache before setting up the query
    const cachedTransactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)
    const cachedTransaction = cachedTransactions.find((t: any) =>
      isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
    )
    const hasCachedInputs = cachedTransaction?.transactionInputs !== undefined


    return useQuery(
      ['transactionInputs', txHash],
      async () => {
        if (hasCachedInputs) {
          return cachedTransaction.transactionInputs
        }
        const _bridgeTransfer = new BridgeTransfer({
          txHash: txHash ?? '',
          destinationNetworkChainId: destinationChainId ?? 0,
          originNetworkChainId: originChainId ?? 0,
          destinationSignerOrProviderOrRpc: destinationRpc,
          originSignerOrProviderOrRpc: originRpc
        })

        const transactionInputs = await retryWithExponentialBackoff(
          async () => _bridgeTransfer.getInfo()
        )
        console.log(transactionInputs)
        const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)

        // Update the cache with the latest status
        const newTransactions = transactions.map((t: any) => {
          const isSameHash = isDeposit
            ? t.lowNetworkHash === txRecord.lowNetworkHash
            : t.highNetworkHash === txRecord.highNetworkHash

          return isSameHash ? { ...t, transactionInputs: transactionInputs } : t
        })

        localStorage.setItem(
          `bridge-${connectedAccount}-transactions-${selectedNetworkType}`,
          JSON.stringify(newTransactions)
        )
        return transactionInputs
      },
      {
        placeholderData: () => {
          if (hasCachedInputs) {
            return cachedTransaction.transactionInputs
          }
        },
        staleTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!txRecord
      }
    )
  }

  const getHighNetworkTimestamp = ({
    txRecord,
    transferStatus,
  }: {
    txRecord: any
    transferStatus: any
  }) => {


    return useQuery(
      ['highNetworkTimestamp', txRecord?.lowNetworkHash],
      async () => {
        if (!txRecord) throw new Error('Deposit data is missing.')

        const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)
        const cachedTransaction = transactions.find((t: any) => t.lowNetworkHash === txRecord.lowNetworkHash)

        if (cachedTransaction?.highNetworkTimestamp) {
          return cachedTransaction.highNetworkTimestamp
        }

        const destinationRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === txRecord.highNetworkChainId)
          ?.rpcs[0]

        if (!transferStatus?.completionTxHash) {
          console.log('No completion transaction hash found')
          throw new Error('Completion transaction hash is missing.')
        }

        const timestamp = await retryWithExponentialBackoff(() =>
          fetchTransactionTimestamp(transferStatus.completionTxHash, destinationRpc ?? '')
        )

        const updatedTransactions = transactions.map((t: any) => {
          const isSameHash = t.lowNetworkHash === txRecord.lowNetworkHash
          return isSameHash ? { ...t, highNetworkTimestamp: timestamp, lastUpdated: Date.now() } : t
        })

        localStorage.setItem(
          `bridge-${connectedAccount}-transactions-${selectedNetworkType}`,
          JSON.stringify(updatedTransactions)
        )

        return timestamp
      },
      {
        placeholderData: () => {
          const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)
          const cachedTransaction = transactions.find((t: any) => t.lowNetworkHash === txRecord?.lowNetworkHash)
          return cachedTransaction?.highNetworkTimestamp
        },

        staleTime: Infinity,
        refetchInterval: false,
        refetchOnWindowFocus: false,
        enabled: !!txRecord && !!transferStatus?.completionTxHash // Run query only if data is valid
      }
    )
  }

  return {
    getTransactionInputs,
    returnTransferData,
    getHighNetworkTimestamp,
    claim
  }
}
