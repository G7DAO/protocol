// External Libraries
import React from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
// Styles
import styles from '@/components/bridge/bridge/ActionButton.module.css'

import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { createPool } from '@/utils/stake/createPool'
import { editPool } from '@/utils/stake/editPool'


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
    const { connectedAccount, isConnecting, connectWallet } =
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
            _createPool.mutate({ tokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds });
            return
        }
        if (actionType === 'EDITPOOL') {
            const { poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds } = params as EditPoolParams
            _editPool.mutate({ poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds });
            return
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
        }: CreatePoolParams) => {
            if (!connectedAccount) {
                throw new Error("Wallet isn't connected")
            }
            return createPool(tokenType, tokenAddress, tokenID, lockupSeconds, cooldownSeconds, transferable, connectedAccount)
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
            cooldownSeconds,
        }: EditPoolParams) => {
            if (!connectedAccount) {
                throw new Error("Wallet isn't connected")
            }
            return editPool(poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds, connectedAccount)
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
