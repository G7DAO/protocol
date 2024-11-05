// External Libraries
import React from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
// Constants
import { ALL_NETWORKS } from '../../../../constants'
// Styles
import styles from './ActionButton.module.css'
import { ethers } from 'ethers'
import { Bridger } from 'game7-bridge-sdk'
// Absolute Imports
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { ZERO_ADDRESS } from '@/utils/web3utils'

interface ActionButtonProps {
  direction: 'DEPOSIT' | 'WITHDRAW'
  amount: string
  isDisabled: boolean
  L2L3message?: { destination: string; data: string }
  setErrorMessage: (arg0: string) => void
  bridger?: Bridger
  symbol?: string
}
const ActionButton: React.FC<ActionButtonProps> = ({
  amount,
  isDisabled,
  setErrorMessage,
  L2L3message,
  bridger,
  symbol
}) => {
  const {
    connectedAccount,
    isConnecting,
    selectedHighNetwork,
    selectedLowNetwork,
    connectWallet,
    getProvider,
    selectedBridgeToken
  } = useBlockchainContext()

  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const navigate = useNavigate()

  const getLabel = (): String | undefined => {
    if (isConnecting) {
      return 'Connecting wallet...'
    }
    if (transfer.isLoading) {
      return 'Submitting...'
    }
    if (!connectedAccount) {
      return 'Connect wallet'
    }
    return 'Submit'
  }

  const handleClick = async () => {
    if (isConnecting || transfer.isLoading) {
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
    transfer.mutateAsync(amount)
    return
  }

  const queryClient = useQueryClient()
  const transfer = useMutation(
    async (amount: string) => {
      const network = ALL_NETWORKS.find((n) => n.chainId === bridger?.originNetwork.chainId)
      const provider = await getProvider(network!)
      const signer = provider.getSigner()
      const destinationRPC = selectedHighNetwork.rpcs[0]
      const destinationProvider = new ethers.providers.JsonRpcProvider(destinationRPC) as ethers.providers.Provider

      // If deposit
      if (bridger?.isDeposit) {
        if (selectedBridgeToken.address != ZERO_ADDRESS) {
          const allowance = (await bridger?.getAllowance(selectedLowNetwork.rpcs[0], connectedAccount ?? '')) ?? ''
          // approve first
          if (Number(ethers.utils.formatEther(allowance)) < Number(amount)) {
            const txApprove = await bridger?.approve(ethers.utils.parseUnits(amount), signer)
            await txApprove.wait()
          }
        }
        const tx = await bridger?.transfer({ amount: ethers.utils.parseUnits(amount), signer, destinationProvider })
        await tx?.wait()
        return {
          type: 'DEPOSIT',
          amount: amount,
          lowNetworkChainId: selectedLowNetwork.chainId,
          highNetworkChainId: selectedHighNetwork.chainId,
          lowNetworkHash: tx?.hash,
          lowNetworkTimestamp: Date.now(),
          completionTimestamp: Date.now(),
          newTransaction: true,
          ETA: Date.now() + (60 * 15),
          symbol: symbol
        }
      } else {
        const tx = await bridger?.transfer({ amount: ethers.utils.parseUnits(amount), signer, destinationProvider })
        await tx?.wait()
        return {
          type: 'WITHDRAWAL',
          amount: amount,
          lowNetworkChainId: selectedLowNetwork.chainId,
          highNetworkChainId: selectedHighNetwork.chainId,
          highNetworkHash: tx?.hash,
          highNetworkTimestamp: Date.now(),
          challengePeriod: 60 * 40,
          ETA: Date.now()  + (60 * 60),
          symbol: symbol
        }
      }
    },
    {
      onSuccess: async (record: any) => {
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          transactions.push(record)
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.refetchQueries(['pendingNotifications'])
        queryClient.refetchQueries(['incomingMessages'])
        refetchNewNotifications(connectedAccount ?? '')
        navigate('/bridge/transactions')
      },
      onError: (e) => {
        console.log(e)
        setErrorMessage('Transaction failed. Try again, please')
      }
    }
  )

  return (
    <>
      <button
        className={styles.container}
        onClick={handleClick}
        disabled={
          getLabel() === 'Submit' &&
          (isDisabled ||
            Number(amount) < 0 ||
            ((!L2L3message?.destination || !L2L3message.data) && Number(amount) === 0))
        }
      >
        <div className={isConnecting || transfer.isLoading ? styles.buttonLabelLoading : styles.buttonLabel}>
          {getLabel() ?? 'Submit'}
        </div>
      </button>
    </>
  )
}

export default ActionButton
