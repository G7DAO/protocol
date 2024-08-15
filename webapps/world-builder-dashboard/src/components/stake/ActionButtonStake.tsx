// External Libraries
import React from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
// Styles
import styles from '@/components/bridge/bridge/ActionButton.module.css'

import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { createPool } from '@/utils/stake/createPool'
import { editPool } from '@/utils/stake/editPool'
import { ethers } from 'ethers'
import { L3_NETWORK } from '../../../constants'

export interface CreatePoolParams {
    tokenType: string
    tokenAddress: string
    tokenID: string
    transferable: boolean
    lockupSeconds: string
    cooldownSeconds: string
}

export interface EditPoolParams {
    poolId: string
    changeTransferability: boolean
    transferable: boolean
    changeLockup: boolean
    lockupSeconds: string
    changeCooldown: boolean
    cooldownSeconds: string
}

export interface ActionButtonStakeProps {
    actionType: 'CREATEPOOL' | 'EDITPOOL'
    params?: CreatePoolParams | EditPoolParams
    isDisabled: boolean
    setErrorMessage: (arg0: string) => void
}

const ActionButtonStake: React.FC<ActionButtonStakeProps> = ({ actionType, params, isDisabled, setErrorMessage }) => {
    const { connectedAccount, isConnecting, connectWallet, switchChain } =
        useBlockchainContext()

    const navigate = useNavigate()

    const getLabel = (): String | undefined => {
        if (isConnecting) {
            return 'Connecting...'
        }
        if (_createPool.isLoading) {
            return 'Submitting...'
        }
        if (!connectedAccount) {
            return 'Connect wallet'
        }
        return 'Submit'
    }

    const handleClick = async () => {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const currentChainId = (await provider.getNetwork()).chainId

            if (isConnecting) {
                return
            }
            if (typeof window.ethereum === 'undefined') {
                setErrorMessage("Wallet isn't installed")
                return
            }
            if (!connectedAccount) {
                await connectWallet()
                return
            }
            setErrorMessage('')
            if (actionType === 'CREATEPOOL') {
                const { tokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds } = params as CreatePoolParams
                if (currentChainId !== L3_NETWORK.chainId) {
                    await switchChain(L3_NETWORK).then(() => {
                        _createPool.mutate({ tokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds, provider });
                    })
                } else {
                    _createPool.mutate({ tokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds, provider });
                }
                return
            }
            if (actionType === 'EDITPOOL') {
                const { poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds } = params as EditPoolParams
                if (currentChainId !== L3_NETWORK.chainId) {
                    try {
                        await switchChain(L3_NETWORK)
                        _editPool.mutate({ poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds, provider });
                    } catch (error) {
                        console.error('Error switching chain: ', error)
                    }
                } else {
                    _editPool.mutate({ poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds, provider });
                }
                return
            }
        } else {
            console.error('Wallet is not installed!')
        }
    }

    const queryClient = useQueryClient()


    //#region pool functions
    const _createPool = useMutation(
        async ({
            tokenType,
            tokenAddress,
            tokenID,
            lockupSeconds,
            cooldownSeconds,
            transferable
        }: any) => {
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum)
                if (!connectedAccount) {
                    throw new Error("Wallet isn't connected")
                }
                return createPool(tokenType, tokenAddress, tokenID, lockupSeconds, cooldownSeconds, transferable, connectedAccount, provider)
            } else {
                throw new Error('No wallet installed')
            }
        },
        {
            onSuccess: async () => {
                // add setup
                queryClient.refetchQueries(['pools'])
                navigate('/stake/pools')
            },
            onError: (e) => {
                console.log(e)
                setErrorMessage("Something went wrong. Check the console log!");
            }
        }
    )

    const _editPool = useMutation(
        async ({
            poolId,
            changeTransferability,
            transferable,
            changeLockup,
            lockupSeconds,
            changeCooldown,
            cooldownSeconds
        }: any) => {
            if (!connectedAccount) {
                throw new Error("Wallet isn't connected")
            }
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum)
                return editPool(poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds, connectedAccount, provider)   
            }
        },
        {
            onSuccess: async () => {
                // add setup
                queryClient.refetchQueries(['pools'])
                navigate('/stake/pools')
            },
            onError: (e) => {
                console.log(e)
                setErrorMessage("Something went wrong. Check the console log!");
            }
        }
    )
    //#endregion

    const actionButton = (direction: string) => {
        if (direction === "CREATEPOOL" || direction === "EDITPOOL") {
            return (
                <button
                    className={styles.container}
                    onClick={handleClick}
                    disabled={getLabel() !== 'Connect wallet' && isDisabled}
                >
                    {getLabel() ?? 'Submit'}
                </button>
            )
        }
    }

    return (
        <>
            {actionButton(actionType)}
        </>
    )
}

export default ActionButtonStake
