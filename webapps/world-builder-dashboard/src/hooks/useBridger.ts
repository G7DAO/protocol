import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'
import { NetworkInterface, NetworkType, useBlockchainContext } from '@/contexts/BlockchainContext'
import { DepositDirection } from '@/pages/BridgePage/BridgePage'
import { Bridger } from 'game7-bridge-sdk'
import { Token } from '@/utils/tokens'

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
        tokenInformation,
        selectedNetworkType,
        selectedBridgeToken
    }: {
        bridger: Bridger | null
        value: string
        direction: 'DEPOSIT' | 'WITHDRAW'
        selectedLowNetwork: NetworkInterface
        selectedHighNetwork: NetworkInterface
        tokenInformation?: { decimalPlaces?: number }
        selectedNetworkType?: NetworkType
        selectedBridgeToken?: Token
    }) => {
        return useQuery(
            {
                queryKey: ['estimatedFee', value, direction, selectedLowNetwork.chainId, selectedHighNetwork.chainId, selectedBridgeToken, tokenInformation],
                queryFn: async () => {
                    if (!bridger || !value || !tokenInformation) {
                        return null
                    }

                    let FALLBACK_PARENT_FEE: any
                    let FALLBACK_CHILD_FEE: any

                    if (direction === 'DEPOSIT') {
                        if (selectedLowNetwork.chainId === 11155111 || selectedLowNetwork.chainId === 1) {
                            FALLBACK_PARENT_FEE = ethers.utils.formatEther(ethers.utils.parseEther('0.005'))
                            FALLBACK_CHILD_FEE = ethers.utils.formatEther(ethers.utils.parseEther('0.0005'))
                        } else {
                            FALLBACK_PARENT_FEE = ethers.utils.formatEther(ethers.utils.parseEther('0.0005'))
                            FALLBACK_CHILD_FEE = ethers.utils.formatEther(ethers.utils.parseEther('0.000001'))
                        }
                    } else if (direction === 'WITHDRAW') {
                        if (selectedHighNetwork.chainId === 421614 || selectedHighNetwork.chainId === 42161) {
                            FALLBACK_PARENT_FEE = ethers.utils.formatEther(ethers.utils.parseEther('0.0005'))
                        } else {
                            FALLBACK_PARENT_FEE = ethers.utils.formatEther(ethers.utils.parseEther('0.000001'))
                        }
                    }


                    try {
                        const decimals = tokenInformation?.decimalPlaces ?? 18
                        const parsedValue = value ? ethers.utils.parseUnits(value, decimals) : ethers.utils.parseEther('0')

                        const originProvider = direction === 'DEPOSIT' ?
                            selectedLowNetwork.rpcs[0] :
                            selectedHighNetwork.rpcs[0]

                        const destinationProvider = direction === 'DEPOSIT' ?
                            selectedHighNetwork.rpcs[0] :
                            selectedLowNetwork.rpcs[0]

                        if (!originProvider) {
                            console.warn("Missing origin provider, returning zero fees")
                            return { parentFee: '0', childFee: '0' }
                        }

                        try {
                            return await retryWithExponentialBackoff(async () => {
                                const gasAndFee = await bridger.getGasAndFeeEstimation(
                                    parsedValue,
                                    originProvider,
                                    connectedAccount ?? '',
                                    destinationProvider
                                )

                                const parentFee = ethers.utils.formatEther(gasAndFee?.estimatedFee ?? '0')
                                const childFee = ethers.utils.formatEther(gasAndFee.childNetworkEstimation?.estimatedFee ?? '0')

                                return {
                                    parentFee,
                                    childFee: childFee ?? FALLBACK_CHILD_FEE 
                                }
                            })
                        } catch (e) {
                            console.error('Fee estimation failed:', e)
                            return {
                                parentFee: FALLBACK_PARENT_FEE,
                                childFee: FALLBACK_CHILD_FEE
                            }
                        }

                    } catch (e) {
                        console.error('Fee estimation failed:', e)
                        return {
                            parentFee: FALLBACK_PARENT_FEE,
                            childFee: FALLBACK_CHILD_FEE
                        }
                    }
                },
                enabled: !!connectedAccount && !!selectedLowNetwork && !!selectedHighNetwork && !!value && !!bridger && !!selectedNetworkType && !!selectedBridgeToken,
                retry: 2,
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
        bridger: Bridger | null
        direction: DepositDirection
        selectedLowNetwork: NetworkInterface
        selectedHighNetwork: NetworkInterface
        connectedAccount: string
    }) => {
        return useQuery(
            {
                queryKey: ['allowances', bridger, direction, selectedLowNetwork.chainId, selectedHighNetwork.chainId, connectedAccount],
                queryFn: async () => {
                    if (!bridger || !connectedAccount) return null

                    const rpc = direction === 'DEPOSIT' ? selectedLowNetwork.rpcs[0] : selectedHighNetwork.rpcs[0]

                    const bridgeTokenAllowance = await bridger.getAllowance(rpc, connectedAccount)
                    const nativeTokenAllowance = await bridger.getNativeAllowance(rpc, connectedAccount)

                    return {
                        bridgeTokenAllowance,
                        nativeTokenAllowance
                    }
                },
                enabled: !!bridger && !!connectedAccount
            }
        )
    }

    return {
        getEstimatedFee,
        useAllowances
    }
}
