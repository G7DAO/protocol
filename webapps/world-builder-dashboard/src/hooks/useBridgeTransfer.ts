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

    // Retry function with exponential backoff for handling 429 errors
    const retryWithExponentialBackoff = async (fn: () => Promise<any>, retries: number = 5, delay: number = 1000) => {
      let attempt = 0

      while (attempt < retries) {
        try {
          return await fn()
        } catch (error: any) {
          if (error?.response?.status === 429 && attempt < retries - 1) {
            const retryDelay = delay * 2 ** attempt
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
            attempt++
          } else {
            throw error // Rethrow error if not 429 or max retries reached
          }
        }
      }
    }

    // If the status is pending and time since last fetched is > 2 minutes, fetch again
    const shouldFetchStatus = (cachedTransaction: any) => {
      const isPending = ![2, 6, 9].includes(cachedTransaction?.status) // Add actual pending statuses
      const timeSinceLastUpdate = Date.now() - (cachedTransaction?.lastUpdated || 0)
      return isPending && timeSinceLastUpdate > 1 * 60 * 1000 // Adjust timing as needed
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
          // Fetch status with retry logic
          status = await retryWithExponentialBackoff(async () => await _bridgeTransfer.getStatus())

          const transactions = getCachedTransactions()

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
          const transactions = getCachedTransactions()
          const cachedTransaction = transactions.find((t: any) =>
            isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
          )

          if (cachedTransaction && cachedTransaction.status !== undefined) {
            status = cachedTransaction.status
            return { status } // Return cached status
          }

          throw error // Re-throw error if no cache
        }
      },
      {
        // Placeholder data from cache
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
        staleTime: 2 * 60 * 1000, // Data is considered fresh for 2 minutes
        refetchInterval: shouldFetchStatus(
          getCachedTransactions().find((t: any) =>
            t.type === 'DEPOSIT' ? t.lowNetworkHash === txHash : t.highNetworkHash === txHash
          )
        )
          ? 1 * 60 * 1000
          : false,
        refetchOnWindowFocus: false,
        enabled: !!txRecord,
        // retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 2000)
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
    const storageKey = `transaction-inputs-${connectedAccount}`
  
    // Retrieve cached transaction inputs from localStorage
    const getCachedTransactionInputs = () => {
      const cachedData = localStorage.getItem(storageKey)
      if (!cachedData) return null
  
      const cachedTransactions = JSON.parse(cachedData)
  
      // Return the specific transaction input based on txHash
      return cachedTransactions.find((input: any) => input.txHash === txHash) || null
    }
  
    // Save transaction inputs to localStorage as an array
    const saveTransactionInputsToCache = (newInput: any) => {
      const cachedData = localStorage.getItem(storageKey)
      const cachedTransactions = cachedData ? JSON.parse(cachedData) : []
  
      const updatedTransactions = cachedTransactions.some((input: any) => input.txHash === newInput.txHash)
        ? cachedTransactions.map((input: any) =>
            input.txHash === newInput.txHash ? { ...input, ...newInput } : input
          )
        : [...cachedTransactions, newInput]
  
      localStorage.setItem(storageKey, JSON.stringify(updatedTransactions))
    }
  
    // Use React Query to fetch or cache transaction inputs
    return useQuery(
      ['transactionInputs', txHash],
      async () => {
        const cachedTransactionInputs = getCachedTransactionInputs()
        // If found in cache, return the cached data
        if (cachedTransactionInputs) {
          return cachedTransactionInputs
        }
  
        // Otherwise, fetch transaction inputs from the bridge transfer instance
        const _bridgeTransfer = new BridgeTransfer({
          txHash: txHash ?? '',
          destinationNetworkChainId: destinationChainId ?? 0,
          originNetworkChainId: originChainId ?? 0,
          destinationSignerOrProviderOrRpc: destinationRpc,
          originSignerOrProviderOrRpc: originRpc,
        })

        
        const transactionInputs = isDeposit ? await _bridgeTransfer.getInfo() : await _bridgeTransfer.getTransactionInputs()
  
        // Save the fetched transaction inputs to cache
        saveTransactionInputsToCache({ txHash, ...transactionInputs })
  
        return transactionInputs
      },
      {
        placeholderData: () => {
          return getCachedTransactionInputs()
        },
        staleTime: 2 * 60 * 1000, // Data is considered fresh for 2 minutes
        refetchOnWindowFocus: false, // Disable refetching on window focus
        enabled: !!txRecord, // Ensure the query only runs when txRecord exists
      }
    )
  }
  return {
    getTransactionInputs,
    returnTransferData,
    claim
  }
}
