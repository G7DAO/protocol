import { useQuery } from 'react-query'
import { ethers } from 'ethers'
import { NetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { DepositDirection } from '@/pages/BridgePage/BridgePage'
import { Bridger } from 'game7-bridge-sdk'

export const useBridger = () => {
    const { connectedAccount } = useBlockchainContext()

    // Retry function with exponential backoff
    const retryWithExponentialBackoff = async (fn: () => Promise<any>, retries = 3, delay = 1000, jitterFactor = 0.5) => {
        let attempt = 0

        while (attempt < retries) {
            try {
                return await fn()
            } catch (error: any) {
                const isNetworkError = error.message?.includes('net::ERR_FAILED') ||
                    error.message?.includes('Network Error') ||
                    error.code === 'ECONNABORTED' ||
                    !error.response

                if (isNetworkError && attempt < retries - 1) {
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

    const getEstimatedFee = ({
        bridger,
        value,
        direction,
        selectedLowNetwork,
        selectedHighNetwork,
        tokenInformation
    }: {
        bridger: any
        value: string
        direction: 'DEPOSIT' | 'WITHDRAW'
        selectedLowNetwork: any
        selectedHighNetwork: any
        tokenInformation?: { decimalPlaces?: number }
    }) => {
        return useQuery(
            ['estimatedFee', bridger, connectedAccount, value],
            async () => {
                if (!bridger || !connectedAccount || !value) {
                    return { parentFee: '0', childFee: '0', totalFee: '0' }
                }

                try {
                    const decimals = tokenInformation?.decimalPlaces ?? 18
                    const parsedValue = value ? ethers.utils.parseUnits(value, decimals) : ethers.utils.parseEther('0')

                    const originProvider = direction === 'DEPOSIT' ?
                        selectedLowNetwork.rpcs[0] :
                        selectedHighNetwork.rpcs[0]

                    console.log("Origin provider:", originProvider)

                    const destinationProvider = direction === 'DEPOSIT' ?
                        selectedHighNetwork.rpcs[0] :
                        selectedLowNetwork.rpcs[0]

                    console.log("Destination provider:", destinationProvider)

                    if (!originProvider) {
                        console.warn("Missing origin provider, returning zero fees")
                        return { parentFee: '0', childFee: '0', totalFee: '0' }
                    }

                    console.log("Attempting fee estimation with:", {
                        parsedValue: parsedValue.toString(),
                        originProvider,
                        connectedAccount,
                        destinationProvider
                    })

                    return await retryWithExponentialBackoff(async () => {
                        const gasAndFee = await bridger.getGasAndFeeEstimation(
                            parsedValue,
                            originProvider,
                            connectedAccount,
                            destinationProvider
                        )

                        console.log("Fee estimation result:", gasAndFee)

                        const parentFee = ethers.utils.formatEther(gasAndFee?.estimatedFee ?? '0')
                        const childFee = gasAndFee?.childNetworkEstimation
                            ? ethers.utils.formatEther(gasAndFee.childNetworkEstimation.estimatedFee)
                            : '0'

                        return {
                            parentFee,
                            childFee,
                            totalFee: String(Number(parentFee) + Number(childFee))
                        }
                    })
                } catch (e) {
                    console.error('Fee estimation failed:', e)
                    return { parentFee: '0', childFee: '0', totalFee: '0' }
                }
            },
            {
                enabled: !!connectedAccount && !!selectedLowNetwork && !!selectedHighNetwork && !!value && !!bridger,
                retry: 2,
                retryDelay: 1000,
                staleTime: 30000,
                cacheTime: 60000,
            }
        )
    }

    const useAllowances = ({
        bridger,
        direction,
        selectedLowNetwork,
        selectedHighNetwork,
        connectedAccount
    }: {
        bridger: Bridger | undefined
        direction: DepositDirection
        selectedLowNetwork: NetworkInterface
        selectedHighNetwork: NetworkInterface
        connectedAccount: string
      }) => {
        return useQuery(
          ['allowances', bridger, direction, selectedLowNetwork.chainId, selectedHighNetwork.chainId, connectedAccount],
          async () => {
            if (!bridger || !connectedAccount) return null
    
            const rpc = direction === 'DEPOSIT' ? selectedLowNetwork.rpcs[0] : selectedHighNetwork.rpcs[0]
    
            const bridgeTokenAllowance = await bridger.getAllowance(rpc, connectedAccount)
            const nativeTokenAllowance = await bridger.getNativeAllowance(rpc, connectedAccount)
    
            return {
              bridgeTokenAllowance,
              nativeTokenAllowance
            }
          },
          {
            enabled: !!bridger && !!connectedAccount
          }
        )
      }

    return {
        getEstimatedFee,
        useAllowances
    }
}
