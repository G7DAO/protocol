import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getNetworks, getNetworksThirdWeb } from '../../constants'
import { BridgeTransfer, BridgeTransferStatus, getBridgeTransfer } from 'game7-bridge-sdk'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { fetchTransactionTimestamp, getCachedTransactions, saveCachedTransactions } from '@/utils/web3utils'
import { useRequestQueue } from './useQueueRequests'
import { useActiveAccount } from 'thirdweb/react'
import { createThirdwebClient } from 'thirdweb'
import { ethers5Adapter } from 'thirdweb/adapters/ethers5'

interface UseTransferDataProps {
  txRecord: TransactionRecord
}

export const useBridgeTransfer = () => {
  const { queueRequest } = useRequestQueue()
  const { connectedAccount, selectedNetworkType, wallet } = useBlockchainContext()
  const LOCK_TIMEOUT = 5000; // 5 seconds timeout for lock

  // Helper functions to manage locks
  const acquireLock = (lockKey: string): boolean => {
    const now = Date.now()
    const lockValue = localStorage.getItem(lockKey)

    if (lockValue) {
      const lockTime = parseInt(lockValue);
      if (now - lockTime < LOCK_TIMEOUT) {
        return false
      }
    }

    localStorage.setItem(lockKey, now.toString())
    return true
  }

  const releaseLock = (lockKey: string) => {
    localStorage.removeItem(lockKey)
  }

  // Retry function with exponential backoff for handling 429 errors
  const retryWithExponentialBackoff = async (fn: () => Promise<any>, retries = 20, delay = 1000, jitterFactor = 0.5) => {
    let attempt = 0

    const executeWithRetry = async () => {
      while (attempt < retries) {
        try {
          return await fn()
        } catch (error: any) {
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

    return queueRequest(executeWithRetry)
  }

  const returnTransferData = ({ txRecord }: UseTransferDataProps) => {
    const isDeposit = txRecord.type === 'DEPOSIT'
    const txHash = isDeposit ? txRecord.lowNetworkHash : txRecord.highNetworkHash
    const destinationChainId = isDeposit ? txRecord.highNetworkChainId : txRecord.lowNetworkChainId
    const originChainId = isDeposit ? txRecord.lowNetworkChainId : txRecord.highNetworkChainId
    const destinationRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === destinationChainId)?.rpcs[0]
    const originRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === originChainId)?.rpcs[0]

    // Update shouldFetchStatus to prevent refetching for completed transactions
    const shouldFetchStatus = (cachedTransaction: any) => {
      const isCompleted = [2, 6, 9, 12].includes(cachedTransaction?.status)
      if (isCompleted) return false
      const timeSinceLastUpdate = Date.now() - (cachedTransaction?.lastUpdated || 0)
      return timeSinceLastUpdate > 1 * 60 * 1000
    }

    let status: any

    return useQuery(
      {
        queryKey: ['transferData', txHash],
        queryFn:
          async () => {
            const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType);
            const cachedTransaction = transactions.find((t: any) =>
              isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
            )
            if (cachedTransaction && [1, 2, 6, 9, 11, 12].includes(cachedTransaction.status)) {
              return { status: cachedTransaction.status }
            }

            try {
              const _bridgeTransfer: BridgeTransfer = await getBridgeTransfer({
                txHash: txHash ?? '',
                destinationNetworkChainId: destinationChainId ?? 0,
                originNetworkChainId: originChainId ?? 0,
                destinationSignerOrProviderOrRpc: destinationRpc,
                originSignerOrProviderOrRpc: originRpc,
              }, txRecord.isCCTP)

              status = await retryWithExponentialBackoff(async () => await _bridgeTransfer.getStatus())

              if (status?.status === undefined) {
                console.warn('Status is undefined, skipping cache update')
                return status
              }

              const lockKey = `bridge-${connectedAccount}-lock-${selectedNetworkType}`;

              // Try to acquire lock
              let lockAcquired = false;
              for (let i = 0; i < 3; i++) { // Try 3 times to acquire lock
                lockAcquired = acquireLock(lockKey);
                if (lockAcquired) break;
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms between attempts
              }

              if (!lockAcquired) {
                console.warn('Could not acquire lock for transaction update, skipping cache update');
                return status;
              }

              try {
                // Get fresh transactions data after acquiring lock
                const currentTransactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType);

                const newTransactions = currentTransactions.map((t: any) => {
                  const isSameHash = isDeposit
                    ? t.lowNetworkHash === txRecord.lowNetworkHash
                    : t.highNetworkHash === txRecord.highNetworkHash

                  return isSameHash ? { ...t, status: status.status, lastUpdated: Date.now() } : t
                });

                saveCachedTransactions(connectedAccount ?? '', selectedNetworkType, newTransactions)
              } finally {
                // Always release the lock
                releaseLock(lockKey);
              }

              return status;
            } catch (error) {
              console.log(
                'Error fetching status:',
                error,
                originChainId,
                destinationChainId,
                txRecord.tokenAddress,
                txHash
              )

              // Fallback to cached status if available
              if (cachedTransaction && cachedTransaction.status !== undefined) {
                status = cachedTransaction.status;
                return { status }; // Return cached status
              }

              throw error // Re-throw error if no cache
            }
          },
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
        refetchInterval: () => {
          const cachedTx = getCachedTransactions(connectedAccount ?? '', selectedNetworkType).find((t: any) =>
            t.type === 'DEPOSIT' ? t.lowNetworkHash === txHash : t.highNetworkHash === txHash
          )
          return shouldFetchStatus(cachedTx) ? 1 * 60 * 1000 : false
        },
        refetchOnWindowFocus: false,
        enabled: !!txRecord,
      }
    )

  }

  // Mutate function
  const navigate = useNavigate()
  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const queryClient = useQueryClient()
  const account = useActiveAccount()
  const client = createThirdwebClient({
    clientId: '6410e98bc50f9521823ca83e255e279d'
  })



  const claim = useMutation({
    mutationFn: async ({ txRecord }: { txRecord: TransactionRecord }) => {
      const isDeposit = txRecord.type === 'DEPOSIT'
      const txHash = isDeposit ? txRecord.lowNetworkHash : txRecord.highNetworkHash
      const destinationChainId = isDeposit ? txRecord.highNetworkChainId : txRecord.lowNetworkChainId
      const originChainId = isDeposit ? txRecord.lowNetworkChainId : txRecord.highNetworkChainId
      const destinationRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === destinationChainId)?.rpcs[0]
      const originRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === originChainId)?.rpcs[0]
      if (!txRecord) {
        throw new Error('transaction hash is undefined')
      }
      const targetChain = getNetworksThirdWeb(selectedNetworkType)?.find((network) => network.id === destinationChainId);
      if (!targetChain || !account) {
        throw new Error('Target chain is undefined');
      }
      const signer = await ethers5Adapter.signer.toEthers({ client, chain: targetChain, account })
      
      await wallet?.switchChain(targetChain)

      // Bridge Transfer execute
      const _bridgeTransfer: BridgeTransfer = await getBridgeTransfer({
        txHash: txHash ?? '',
        destinationNetworkChainId: destinationChainId ?? 0,
        originNetworkChainId: originChainId ?? 0,
        destinationSignerOrProviderOrRpc: destinationRpc,
        originSignerOrProviderOrRpc: originRpc
      }, txRecord.isCCTP)

      _bridgeTransfer.isCctp() && await _bridgeTransfer.getStatus()
      console.log('making tx')
      const res: any = await _bridgeTransfer?.execute(signer)
      console.log(res)
      return { res, txRecord }
    },
    onSuccess: ({ res, txRecord }) => {
      const isDeposit = txRecord.type === 'DEPOSIT'
      const txHash = isDeposit ? txRecord.lowNetworkHash : txRecord.highNetworkHash
      try {
        const transactionsString = localStorage.getItem(
          `bridge-${connectedAccount}-transactions-${selectedNetworkType}`
        )
        let transactions = transactionsString ? JSON.parse(transactionsString) : []
        const newTransactions: TransactionRecord[] = transactions.map((t: TransactionRecord) => {
          if (isDeposit ? t.lowNetworkHash === txHash : t.highNetworkHash === txHash) {
            return {
              ...t,
              completionTimestamp: Date.now() / 1000,
              lowNetworkTimestamp: isDeposit ? t.lowNetworkTimestamp : Date.now() / 1000,
              newTransaction: true,
              highNetworkHash: isDeposit ? res?.transactionHash : t.highNetworkHash,
              lowNetworkHash: !isDeposit ? res?.transactionHash : t.lowNetworkHash,
              status: txRecord.isCCTP
                ? BridgeTransferStatus.CCTP_REDEEMED
                : !isDeposit ? BridgeTransferStatus.WITHDRAW_EXECUTED : BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED
            }
          }
          return { ...t }
        })
        saveCachedTransactions(connectedAccount ?? '', selectedNetworkType, newTransactions)

      } catch (e) {
        console.log(e)
      }
      refetchNewNotifications(connectedAccount ?? '')
      queryClient.refetchQueries({ queryKey: ['transferData', isDeposit ? txRecord.lowNetworkHash : txRecord.highNetworkHash] })
      queryClient.refetchQueries({ queryKey: ['incomingMessages'] })
      queryClient.refetchQueries({ queryKey: ['ERC20Balance'] })
      queryClient.refetchQueries({ queryKey: ['nativeBalance'] })
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

    return useQuery(
      {
        queryKey: ['transactionInputs', txHash],
        queryFn: async () => {
          try {
            if (txRecord.transactionInputs) {
              return txRecord.transactionInputs
            }

            const _bridgeTransfer: BridgeTransfer = await getBridgeTransfer({
              txHash: txHash ?? '',
              destinationNetworkChainId: destinationChainId ?? 0,
              originNetworkChainId: originChainId ?? 0,
              destinationSignerOrProviderOrRpc: destinationRpc,
              originSignerOrProviderOrRpc: originRpc
            }, txRecord.isCCTP)

            const transactionInputs = await _bridgeTransfer.getInfo()

            const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)

            // Update the cache with the latest status
            const newTransactions = transactions.map((t: any) => {
              const isSameHash = isDeposit
                ? t.lowNetworkHash === txRecord.lowNetworkHash
                : t.highNetworkHash === txRecord.highNetworkHash

              return isSameHash ? { ...t, transactionInputs: transactionInputs } : t
            })

            saveCachedTransactions(connectedAccount ?? '', selectedNetworkType, newTransactions)

            return transactionInputs
          } catch (error) {
            // Return cached transaction if an error occurs
            const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)
            const cachedTransaction = transactions.find((t: any) =>
              isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
            )
            return cachedTransaction?.transactionInputs || null
          }
        },
        placeholderData: () => {
          const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)
          const cachedTransaction = transactions.find((t: any) =>
            isDeposit ? t.lowNetworkHash === txRecord.lowNetworkHash : t.highNetworkHash === txRecord.highNetworkHash
          )

          if (cachedTransaction?.transactionInputs) {
            return cachedTransaction.transactionInputs
          }

          return null
        },
        staleTime: 2 * 60 * 1000,
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
      {
        queryKey: ['highNetworkTimestamp', txRecord?.lowNetworkHash], queryFn: async () => {
          if (!txRecord) throw new Error('Deposit data is missing.')

          const transactions = getCachedTransactions(connectedAccount ?? '', selectedNetworkType)
          const cachedTransaction = transactions.find((t: any) => t.lowNetworkHash === txRecord.lowNetworkHash)

          if (cachedTransaction?.highNetworkTimestamp) {
            return cachedTransaction.highNetworkTimestamp
          }

          const destinationRpc = getNetworks(selectedNetworkType)?.find((n) => n.chainId === txRecord.highNetworkChainId)
            ?.rpcs[0]

          if (!transferStatus?.completionTxHash) {
            throw new Error('Completion transaction hash is missing.')
          }

          const timestamp = await retryWithExponentialBackoff(() =>
            fetchTransactionTimestamp(transferStatus.completionTxHash, destinationRpc ?? '')
          )

          const updatedTransactions = transactions.map((t: any) => {
            const isSameHash = t.lowNetworkHash === txRecord.lowNetworkHash
            return isSameHash ? { ...t, highNetworkTimestamp: timestamp, lastUpdated: Date.now() } : t
          })

          saveCachedTransactions(connectedAccount ?? '', selectedNetworkType, updatedTransactions)

          return timestamp
        },
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
