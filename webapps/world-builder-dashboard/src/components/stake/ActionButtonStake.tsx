// External Libraries
import React from 'react'
// import { useMutation, useQueryClient } from '@tanstack/react-query'
// import { useNavigate } from 'react-router-dom'
// Styles
import styles from '@/components/bridge/bridge/ActionButton.module.css'

// import { useBlockchainContext } from '@/contexts/BlockchainContext'
// import { createPool } from '@/utils/stake/createPool'
// import { editPool } from '@/utils/stake/editPool'
// import { L3_NETWORK } from '../../../constants'

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

const ActionButtonStake: React.FC<ActionButtonStakeProps> = ({ actionType, isDisabled }) => {  //params, setErrorMessage }) => {
    // const { connectedAccount, isConnecting, getProvider, connectWallet } = useBlockchainContext()

    // const navigate = useNavigate()

    const getLabel = (): String | undefined => {
        // if (isConnecting) {
        //     return 'Connecting...'
        // }
        // if (_createPool.isPending) {
        //     return 'Submitting...'
        // }
        // if (!connectedAccount) {
        //     return 'Connect wallet'
        // }
        return 'Submit'
    }

    // const handleClick = async () => {
    //     if (!connectedAccount) {
    //         await connectWallet()
    //         return
    //     }
    //     if (window.ethereum) {
    //         const provider = await getProvider(L3_NETWORK)
    //         if (actionType === 'CREATEPOOL') {
    //             const { tokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds } = params as CreatePoolParams
    //             _createPool.mutateAsync({ tokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds, provider });
    //             return
    //         }
    //         if (actionType === 'EDITPOOL') {
    //             const { poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds } = params as EditPoolParams
    //             _editPool.mutateAsync({ poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds, provider });
    //             return
    //         }
    //     } else {
    //         console.error('Wallet is not installed!')
    //     }
    // }

    // const queryClient = useQueryClient()


    //#region pool functions
    // const _createPool = useMutation(
    //     async ({
    //         tokenType,
    //         tokenAddress,
    //         tokenID,
    //         lockupSeconds,
    //         cooldownSeconds,
    //         transferable,
    //         provider
    //     }: any) => {
    //         if (window.ethereum) {
    //             if (!connectedAccount) {
    //                 throw new Error("Wallet isn't connected")
    //             }
    //             return createPool(tokenType, tokenAddress, tokenID, lockupSeconds, cooldownSeconds, transferable, connectedAccount, provider)
    //         } else {
    //             throw new Error('No wallet installed')
    //         }
    //     },
    //     {
    //         onSuccess: async () => {
    //             // add setup
    //             queryClient.refetchQueries(['pools'])
    //             navigate('/stake/pools')
    //         },
    //         onError: (e) => {
    //             console.log(e)
    //             setErrorMessage("Something went wrong. Check the console log!");
    //         }
    //     }
    // )

    // const _editPool = useMutation(
    //     async ({
    //         poolId,
    //         changeTransferability,
    //         transferable,
    //         changeLockup,
    //         lockupSeconds,
    //         changeCooldown,
    //         cooldownSeconds,
    //         provider
    //     }: any) => {
    //         if (!connectedAccount) {
    //             throw new Error("Wallet isn't connected")
    //         }
    //         if (window.ethereum) {
    //             return editPool(poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds, connectedAccount, provider)
    //         }
    //     },
    //     {
    //         onSuccess: async () => {
    //             // add setup
    //             queryClient.refetchQueries({ queryKey: ['pools'] })
    //             navigate('/stake/pools')
    //         },
    //         onError: (e) => {
    //             console.log(e)
    //             setErrorMessage("Something went wrong. Check the console log!");
    //         }
    //     }
    // )
    //#endregion

    const actionButton = (direction: string) => {
        if (direction === "CREATEPOOL" || direction === "EDITPOOL") {
            return (
                <button
                    className={styles.container}
                    onClick={() => { console.log('bello') }}
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
