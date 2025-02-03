import { useState, useEffect } from 'react'
import { useMessages } from '@/hooks/useL2ToL1MessageStatus'
import { useBridgeAPI } from '@/hooks/useBridgeAPI'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { isUSDC } from '@/utils/web3utils'
import { ethers } from 'ethers'

const mergeTransactions = (apiData: TransactionRecord[], localData: TransactionRecord[]): TransactionRecord[] => {
    const combinedData = new Map<string, TransactionRecord>()
    localData.forEach((localTx) => {
        const hashKey = localTx.type === 'DEPOSIT' ? (localTx.lowNetworkHash ?? '') : (localTx.highNetworkHash ?? '')
        combinedData.set(hashKey, localTx)
    })

    // Merge API data, prioritizing latest withdrawal completionTimestamp
    apiData.forEach((apiTx) => {
        const hashKey = apiTx.type === 'DEPOSIT' ? (apiTx.lowNetworkHash ?? '') : (apiTx.highNetworkHash ?? '')
        const existingTx = combinedData.get(hashKey)
        if (existingTx) {
            if (apiTx.type === 'WITHDRAWAL' && !apiTx.completionTimestamp && existingTx.completionTimestamp) {
                combinedData.set(hashKey, existingTx)
            } else if (apiTx.type === 'WITHDRAWAL' && apiTx.completionTimestamp && !existingTx.completionTimestamp) {
                combinedData.set(hashKey, apiTx)
            } else if (apiTx.type === 'WITHDRAWAL' && apiTx.completionTimestamp && existingTx.completionTimestamp) {
                combinedData.set(hashKey, existingTx)
            } else if (apiTx.type === 'WITHDRAWAL' && apiTx.highNetworkHash && !existingTx.highNetworkHash) {
                combinedData.set(hashKey, existingTx)
            } else if (apiTx.type === 'WITHDRAWAL' && apiTx.lowNetworkHash && !existingTx.lowNetworkHash) {
                combinedData.set(hashKey, existingTx)
            } else if (apiTx.type === 'DEPOSIT' && !apiTx.completionTimestamp && existingTx.completionTimestamp) {
                combinedData.set(hashKey, existingTx)
            } else if (apiTx.type === 'DEPOSIT' && apiTx.completionTimestamp && !existingTx.completionTimestamp) {
                combinedData.set(hashKey, apiTx)
            } else if (apiTx.type === 'DEPOSIT' && apiTx.completionTimestamp && existingTx.completionTimestamp) {
                combinedData.set(hashKey, existingTx)
            } else if (apiTx.type === 'DEPOSIT' && !apiTx.symbol && existingTx.symbol) {
                combinedData.set(hashKey, existingTx)
            } else if (apiTx.type === 'DEPOSIT' && apiTx.highNetworkHash && !existingTx.highNetworkHash) {
                combinedData.set(hashKey, existingTx)
            } else if (apiTx.type === 'DEPOSIT' && apiTx.lowNetworkHash && !existingTx.lowNetworkHash) {
                combinedData.set(hashKey, existingTx)
            }
        } else {
            combinedData.set(hashKey, apiTx)
        }
    })
    const combinedDataArray = Array.from(combinedData.values())
    return combinedDataArray
}

// Maps API data to the TransactionRecord format
const apiDataToTransactionRecord = (apiData: any): TransactionRecord => {
    const amountFormatted = apiData?.amount ? isUSDC(apiData.destination_token ?? apiData.origin_token) ? ethers.utils.formatUnits(apiData.amount, 6) : ethers.utils.formatEther(apiData.amount) : '0.0'
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
        challengePeriod: apiData.challengePeriod,
        tokenAddress: apiData.token,
        destinationTokenAddress: apiData.destination_token,
        symbol: apiData.symbol,
        isCCTP: apiData.isCctp
    }
}

export const useTransactions = (account: string | undefined, networkType: string) => {
    const { data: messages } = useMessages(account, networkType || 'Testnet')
    const { useHistoryTransactions } = useBridgeAPI()
    const { data: apiTransactions } = useHistoryTransactions(account)

    const [mergedTransactions, setMergedTransactions] = useState<TransactionRecord[]>([])

    useEffect(() => {
        if (!messages && !apiTransactions) return
        const localTransactions = messages || []
        const formattedApiTransactions = apiTransactions
            ? apiTransactions.map(apiDataToTransactionRecord)
            : []
        const combinedTransactions = mergeTransactions(formattedApiTransactions, localTransactions)

        combinedTransactions.sort((x, y) => {
            const xTimestamp = x.type === 'DEPOSIT' ? x.lowNetworkTimestamp : x.highNetworkTimestamp
            const yTimestamp = y.type === 'DEPOSIT' ? y.lowNetworkTimestamp : y.highNetworkTimestamp
            return (yTimestamp ?? 0) - (xTimestamp ?? 0)
        })

        if (account && networkType) {
            localStorage.setItem(
                `bridge-${account}-transactions-${networkType}`,
                JSON.stringify(combinedTransactions)
            )
        }

        setMergedTransactions(combinedTransactions)
    }, [messages, apiTransactions])

    return { mergedTransactions }
}
