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
  gasFees?: string[]
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
  gasFees
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
  const [allowancesVerified, setAllowancesVerified] = useState(false)
  let bridgeTokenAllowance: ethers.BigNumber = ethers.BigNumber.from(0)
  let nativeTokenAllowance: ethers.BigNumber = ethers.BigNumber.from(0)
  
  const checkAllowances = async () => {
    if (!bridger || !connectedAccount) return null;

    if (allowancesVerified) {
      console.log('Allowances already verified, skipping check');
      return true;
    }
    
    // For testing only!
    if (amount === '0.01') {
      console.log('Starting token index set to 0');
      setStartingTokenIndex(0);
      setShowApproval(true);
      return false;
    }
    
    bridgeTokenAllowance = await bridger.getAllowance(selectedLowNetwork.rpcs[0], connectedAccount) ?? ethers.BigNumber.from(0)
    nativeTokenAllowance = await bridger.getNativeAllowance(selectedLowNetwork.rpcs[0], connectedAccount) ?? ethers.BigNumber.from(0)

    const amountBN = ethers.utils.parseUnits(amount, decimals)
    
    const needsBridgeTokenApproval = bridgeTokenAllowance !== null && bridgeTokenAllowance.lt(amountBN)
    const needsNativeTokenApproval = nativeTokenAllowance !== null && nativeTokenAllowance.lt(amountBN)

    if (needsBridgeTokenApproval || needsNativeTokenApproval) {
      setStartingTokenIndex(!needsBridgeTokenApproval && needsNativeTokenApproval ? 1 : 0)
      setShowApproval(true)
      return false
    }

    setAllowancesVerified(true)
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
    
    // Replace direct transfer.mutate with allowance check
    checkAllowancesAndTransfer()
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
                : BridgeTransferStatus.DEPOSIT_ERC20_NOT_YET_CREATED
          }
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

  const handleApprovalComplete = () => {
    console.log('=== ActionButton: handleApprovalComplete ===');
    console.log('Setting allowancesVerified to true');
    setShowApproval(false)
    setAllowancesVerified(true)
    console.log('Triggering transfer');
    transfer.mutate(amount)
  }

  const checkAllowancesAndTransfer = async () => {
    console.log('=== checkAllowancesAndTransfer START ===');
    console.log('Current allowancesVerified state:', allowancesVerified);
    
    if (allowancesVerified) {
      console.log('Allowances already verified, proceeding to transfer');
      transfer.mutate(amount)
      return
    }
  
    console.log('Checking allowances before transfer');
    const allowancesOk = await checkAllowances()
    console.log('Allowances check result:', allowancesOk);
    
    if (allowancesOk) {
      console.log('Allowances OK, proceeding to transfer');
      transfer.mutate(amount)
    }
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
          bridger={bridger}
          decimals={decimals}
          startingTokenIndex={startingTokenIndex}
          tokens={(() => {
            const nativeToken = getTokensForNetwork(
              selectedLowNetwork.chainId,
              connectedAccount
            ).find(token => token.symbol === selectedHighNetwork.nativeCurrency?.symbol)!;

            if (bridgeTokenAllowance !== null && nativeTokenAllowance !== null) {
              return [selectedBridgeToken, nativeToken];
            } else if (bridgeTokenAllowance !== null) {
              return [selectedBridgeToken];
            } else if (nativeTokenAllowance !== null) {
              return [nativeToken];
            }
            return [];
          })()}
          onApprovalComplete={handleApprovalComplete}
          gasFees={gasFees ?? []}
        />
      }
    </>
  )
}

export default ActionButton
