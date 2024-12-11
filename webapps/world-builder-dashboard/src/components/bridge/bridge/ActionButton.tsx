// External Libraries
import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
// Constants
import { getNetworks } from '../../../../constants'
// Styles
import styles from './ActionButton.module.css'
import { ethers } from 'ethers'
import { Bridger, BridgeTransferStatus } from 'game7-bridge-sdk'
// Absolute Imports
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { getTokensForNetwork } from '@/utils/tokens'
import { ZERO_ADDRESS } from '@/utils/web3utils'
import { MultiTokenApproval } from './MultiTokenApproval'

interface ActionButtonProps {
  direction: 'DEPOSIT' | 'WITHDRAW'
  amount: string
  isDisabled: boolean
  L2L3message?: { destination: string; data: string }
  setErrorMessage: (arg0: string) => void
  bridger?: Bridger
  symbol?: string
  decimals?: number
  balance?: string
  nativeBalance?: string
}

const ActionButton: React.FC<ActionButtonProps> = ({
  direction,
  amount,
  isDisabled,
  setErrorMessage,
  L2L3message,
  bridger,
  symbol,
  decimals,
  balance,
  nativeBalance
}) => {
  const {
    connectedAccount,
    isConnecting,
    selectedHighNetwork,
    selectedLowNetwork,
    connectWallet,
    getProvider,
    selectedBridgeToken,
    selectedNetworkType
  } = useBlockchainContext()

  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const navigate = useNavigate()
  const networks = getNetworks(selectedNetworkType)
  const [showApproval, setShowApproval] = useState(false)
  const [startingTokenIndex, setStartingTokenIndex] = useState(0)

  const checkAllowances = async () => {
    if (!bridger || !connectedAccount) return null;
    const amountToSend = ethers.utils.parseUnits(amount, decimals)
    const oneEther = ethers.utils.parseEther('1')

    console.log('------------------')
    // Check bridge token allowance
    const bridgeTokenAllowance = await bridger.getAllowance(selectedLowNetwork.rpcs[0], connectedAccount)
    console.log("Bridge Token Allowance:", bridgeTokenAllowance ? ethers.utils.formatUnits(bridgeTokenAllowance, decimals) : 'null (not needed)')

    // Check native token allowance
    const nativeTokenAllowance = await bridger.getNativeAllowance(selectedLowNetwork.rpcs[0], connectedAccount)
    console.log("Native Token Allowance:", nativeTokenAllowance ? ethers.utils.formatUnits(nativeTokenAllowance, 18) : 'null (not needed)')
    console.log('------------------')

    // If bridge token needs approval
    if (bridgeTokenAllowance !== null && bridgeTokenAllowance?.lt(amountToSend)) {
      if (!showApproval) {
        console.log('Bridge token needs approval')
        setStartingTokenIndex(0)
        setShowApproval(true)
      }
      return false
    }

    // If native token needs approval (only check if getNativeAllowance returns non-null)
    if (nativeTokenAllowance !== null && nativeTokenAllowance?.lt(oneEther)) {
      if (!showApproval) {
        console.log('Native token needs approval')
        setStartingTokenIndex(1)
        setShowApproval(true)
      }
      return false
    }

    return true
  }

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

    transfer.mutate(amount)
    return
  }

  const queryClient = useQueryClient()
  const transfer = useMutation(
    async (amount: string) => {
      const network = networks?.find((n) => n.chainId === bridger?.originNetwork.chainId)!
      const provider = await getProvider(network)
      const signer = provider.getSigner()
      const destinationChain = direction === 'DEPOSIT' ? selectedHighNetwork : selectedLowNetwork
      const destinationRPC = destinationChain.rpcs[0]
      const destinationProvider = new ethers.providers.JsonRpcProvider(destinationRPC) as ethers.providers.Provider
      const destinationTokenAddress = getTokensForNetwork(destinationChain.chainId, connectedAccount).find(
        (token) => token.symbol === selectedBridgeToken.symbol
      )?.address
      const amountToSend = ethers.utils.parseUnits(amount, decimals)

      console.log('Debug Transfer Details:', {
        tokenAddress: selectedBridgeToken.address,
        tokenSymbol: selectedBridgeToken.symbol,
        decimals: decimals,
        rawAmount: amount,
        parsedAmount: amountToSend.toString(),
        fromNetwork: selectedLowNetwork.chainId,
        toNetwork: selectedHighNetwork.chainId,
        connectedAccount: connectedAccount
      });

      if (bridger?.isDeposit) {
        if (selectedBridgeToken.address != ZERO_ADDRESS) {

          const bridgeTokenAllowance = await bridger.getAllowance(selectedLowNetwork.rpcs[0], connectedAccount ?? '')
          console.log(ethers.utils.formatUnits(bridgeTokenAllowance ?? 0, decimals))

          const allowancesOk = await checkAllowances()
          console.log(allowancesOk)
          if (!allowancesOk) {
            return
          }
        }
        console.log('transferring')
        const tx = await bridger?.transfer({ amount: amountToSend, signer, destinationProvider })
        await tx?.wait()
        console.log('transferred')
        return {
          type: 'DEPOSIT',
          amount: amount,
          lowNetworkChainId: selectedLowNetwork.chainId,
          highNetworkChainId: selectedHighNetwork.chainId,
          lowNetworkHash: tx?.hash,
          lowNetworkTimestamp: Date.now() / 1000,
          completionTimestamp: Date.now() / 1000,
          newTransaction: true,
          symbol: symbol,
          status:
            destinationTokenAddress === ZERO_ADDRESS
              ? BridgeTransferStatus.DEPOSIT_GAS_PENDING
              : BridgeTransferStatus.DEPOSIT_ERC20_NOT_YET_CREATED
        }
      } else {
        const tx = await bridger?.transfer({ amount: amountToSend, signer, destinationProvider })
        await tx?.wait()
        return {
          type: 'WITHDRAWAL',
          amount: amount,
          lowNetworkChainId: selectedLowNetwork.chainId,
          highNetworkChainId: selectedHighNetwork.chainId,
          highNetworkHash: tx?.hash,
          highNetworkTimestamp: Date.now() / 1000,
          challengePeriod: selectedNetworkType === 'Testnet' ? 60 * 60 : 60 * 60 * 24 * 7,
          symbol: symbol,
          status: BridgeTransferStatus.WITHDRAW_UNCONFIRMED
        }
      }
    },
    {
      onSuccess: async (record: any) => {
        if (!record) return
        try {
          const transactionsString = localStorage.getItem(
            `bridge-${connectedAccount}-transactions-${selectedNetworkType}`
          )
          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          transactions.push(record)
          localStorage.setItem(
            `bridge-${connectedAccount}-transactions-${selectedNetworkType}`,
            JSON.stringify(transactions)
          )
        } catch (e) {
          console.log(e)
        }
        queryClient.refetchQueries(['pendingTransactions'])
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

  // Add callback for when approval is completed
  const handleApprovalComplete = () => {
    setShowApproval(false)
    // Continue with transfer
    transfer.mutate(amount)
  }

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
      {showApproval && 
        <MultiTokenApproval
          showApproval={showApproval}
          setShowApproval={setShowApproval}
          balance={balance}
          nativeBalance={nativeBalance}
          amount={amount}
          bridger={bridger}
          decimals={decimals}
          startingTokenIndex={startingTokenIndex}
          tokens={[
            selectedBridgeToken,
            getTokensForNetwork(
              selectedHighNetwork.chainId,
              connectedAccount
            ).find(token => token.symbol === selectedHighNetwork.nativeCurrency?.symbol)!
          ]}
          onApprovalComplete={handleApprovalComplete}
        />
      }
    </>
  )
}

export default ActionButton
