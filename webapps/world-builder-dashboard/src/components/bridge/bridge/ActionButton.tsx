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
import { getTokensForNetwork, Token } from '@/utils/tokens'
import { ZERO_ADDRESS } from '@/utils/web3utils'
import { MultiTokenApproval } from './MultiTokenApproval'

interface ActionButtonProps {
  direction: 'DEPOSIT' | 'WITHDRAW'
  amount: string
  isDisabled: boolean
  L2L3message?: { destination: string; data: string }
  setErrorMessage: (arg0: string) => void
  bridger: Bridger
  symbol?: string
  decimals?: number
  balance?: string
  nativeBalance?: string
  gasFees?: string[]
  bridgeAllowance?: ethers.BigNumber | null
  nativeAllowance?: ethers.BigNumber | null
  isLoadingAllowances?: boolean
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
  nativeBalance,
  gasFees,
  bridgeAllowance,
  nativeAllowance,
  isLoadingAllowances
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
    if (!bridger || !connectedAccount) return null
    if (amount === '0.01') {
      setStartingTokenIndex(0)
      setShowApproval(true)
      return false
    }
    
    const amountBN = ethers.utils.parseUnits(amount, decimals)
    if (bridgeAllowance === null) {
      const gasFeesAmount = gasFees?.[1] ? ethers.utils.parseUnits(gasFees[1], 18) : amountBN
      const needsNativeTokenApproval = nativeAllowance !== null ? nativeAllowance?.lt(gasFeesAmount) : false
      if (needsNativeTokenApproval) {
        setStartingTokenIndex(0)
        setShowApproval(true)
        return false
      }
    } else {
      const needsBridgeTokenApproval = bridgeAllowance?.lt(amountBN)
      const gasFeesAmount = gasFees?.[1] ? ethers.utils.parseUnits(gasFees[1], 18) : amountBN
      const needsNativeTokenApproval = nativeAllowance !== null ? nativeAllowance?.lt(gasFeesAmount) : false
      if (needsBridgeTokenApproval || needsNativeTokenApproval) {
        setStartingTokenIndex(needsBridgeTokenApproval ? 0 : 1)
        setShowApproval(true)
        return false
      }
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

    if (isLoadingAllowances) {
      return 'Checking allowances...'
    }

    // if (!allowancesVerified)
    //   return 'Approve & Submit'

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

    const allowancesOk = await checkAllowances()
    if (allowancesOk) {
      transfer.mutate(amount)
    }
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

      if (bridger?.isDeposit) {
        const isCCTP = bridger?.isCctp()
        const tx = await bridger?.transfer({ amount: amountToSend, signer, destinationProvider })
        await tx?.wait()
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
              : isCCTP
                ? BridgeTransferStatus.CCTP_PENDING
                : BridgeTransferStatus.DEPOSIT_ERC20_NOT_YET_CREATED,
          isCCTP: isCCTP
        }
      } else {
        const isCCTP = bridger?.isCctp()
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
          status:
            isCCTP
              ? BridgeTransferStatus.CCTP_PENDING
              : BridgeTransferStatus.WITHDRAW_UNCONFIRMED,
          isCCTP: isCCTP
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

  const handleApprovalComplete = () => {
    transfer.mutate(amount)
  }

  const tokenList = (() => {
    const nativeToken = getTokensForNetwork(
      direction === 'DEPOSIT' ? selectedLowNetwork.chainId : selectedHighNetwork.chainId,
      connectedAccount
    ).find(
      (token) => direction === 'DEPOSIT' ?
        token.symbol === selectedHighNetwork.nativeCurrency?.symbol :
        token.symbol === selectedLowNetwork.nativeCurrency?.symbol
    )
    
    if (bridgeAllowance === null && nativeAllowance !== null) {
      return [nativeToken].filter((token): token is Token => token !== undefined)
    }
    if (nativeAllowance === null && bridgeAllowance !== null) {
      return [selectedBridgeToken].filter((token): token is Token => token !== undefined)
    }

    if (nativeAllowance === null && bridgeAllowance === null) {
      return []
    }

    return [selectedBridgeToken, nativeToken].filter((token): token is Token => token !== undefined)
  })()

  return (
    <>
      <button
        className={styles.container}
        onClick={handleClick}
        disabled={
          getLabel() === 'Submit' &&
          (isDisabled ||
            Number(amount) < 0 ||
            ((!L2L3message?.destination || !L2L3message.data) && Number(amount) === 0)) ||
          isLoadingAllowances
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
          bridger={bridger ?? null}
          decimals={decimals}
          startingTokenIndex={startingTokenIndex}
          tokens={tokenList}
          amount={amount}
          onApprovalComplete={handleApprovalComplete}
          gasFees={gasFees ?? []}
        />
      }
    </>
  )
}

export default ActionButton
