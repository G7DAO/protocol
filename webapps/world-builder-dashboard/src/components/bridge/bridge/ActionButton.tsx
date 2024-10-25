// External Libraries
import React, { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
// Constants
import { ALL_NETWORKS, L3_NETWORK } from '../../../../constants'
// Styles
import styles from './ActionButton.module.css'
import { ethers } from 'ethers'
import { Bridger } from 'game7-bridge-sdk'
import { Modal } from 'summon-ui/mantine'
// Absolute Imports
import ApproveAllowance from '@/components/bridge/allowance/ApproveAllowance'
import { HighNetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import useERC20Balance, { fetchERC20Allowance } from '@/hooks/useERC20Balance'
import { estimateCreateRetryableTicketFee, sendL2ToL3Message } from '@/utils/bridge/createRetryableTicket'
import { depositERC20ArbitrumSDK, TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { sendDepositERC20ToNativeTransaction } from '@/utils/bridge/depositERC20ToNative'
import { parseUntilDelimiter, ZERO_ADDRESS } from '@/utils/web3utils'

interface ActionButtonProps {
  direction: 'DEPOSIT' | 'WITHDRAW'
  amount: number
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
  const [isAllowanceModalOpened, setIsAllowanceModalOpened] = useState(false)
  const [additionalCost, setAdditionalCost] = useState(ethers.BigNumber.from(0))
  const [feeEstimate, setFeeEstimate] = useState<
    { gasLimit: ethers.BigNumber; maxFeePerGas: ethers.BigNumber } | undefined
  >(undefined)
  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const navigate = useNavigate()

  useEffect(() => {
    setFeeEstimate(undefined)
  }, [L2L3message])

  const { data: lowNetworkBalance } = useERC20Balance({
    tokenAddress: selectedLowNetwork.g7TokenAddress,
    account: connectedAccount,
    rpc: selectedLowNetwork.rpcs[0]
  })

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
    transfer.mutate(String(amount))
    return
  }

  const queryClient = useQueryClient()
  const deposit = useMutation(
    async (amount: string) => {
      const provider = await getProvider(selectedLowNetwork)
      if (!provider || !connectedAccount) {
        setErrorMessage("Wallet isn't connected")
        throw new Error("Wallet isn't connected")
      }
      const allowance = await fetchERC20Allowance({
        tokenAddress: selectedLowNetwork.g7TokenAddress,
        owner: connectedAccount,
        spender: selectedLowNetwork.routerSpender,
        rpc: selectedLowNetwork.rpcs[0]
      })

      const signer = provider.getSigner()
      let messageExecutionCost = additionalCost
      let estimate: { gasLimit: ethers.BigNumber; maxFeePerGas: ethers.BigNumber } | undefined
      if (L2L3message?.data && L2L3message.destination && messageExecutionCost.eq(ethers.BigNumber.from(0))) {
        try {
          estimate = await estimateCreateRetryableTicketFee(
            '',
            selectedLowNetwork,
            L2L3message.destination ?? '',
            L2L3message.data
          )
          if (estimate) {
            setFeeEstimate(estimate)
            messageExecutionCost = estimate.maxFeePerGas.mul(estimate.gasLimit)
          }
        } catch (e) {
          setErrorMessage('Estimation message execution fee error')
          console.log(`Estimation message execution fee error:  ${e}`)
        }
      }

      setAdditionalCost(messageExecutionCost)
      if (allowance.raw.lt(ethers.utils.parseUnits(amount, 18).add(messageExecutionCost))) {
        setIsAllowanceModalOpened(true)
        return
      }
      if (selectedHighNetwork.chainId === L3_NETWORK.chainId) {
        if (L2L3message?.data && L2L3message.destination) {
          return sendL2ToL3Message(
            selectedLowNetwork,
            selectedHighNetwork,
            amount,
            signer,
            connectedAccount,
            L2L3message.destination,
            L2L3message.data,
            estimate ?? feeEstimate
          )
        }
        return sendDepositERC20ToNativeTransaction(
          selectedLowNetwork,
          selectedHighNetwork as HighNetworkInterface,
          amount,
          signer,
          connectedAccount
        )
      }
      return depositERC20ArbitrumSDK(selectedLowNetwork, selectedHighNetwork, amount, signer)
    },
    {
      onSuccess: (deposit: TransactionRecord | undefined) => {
        if (!deposit) {
          return
        }
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)

          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          transactions.push({ ...deposit, isDeposit: true })
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        refetchNewNotifications(connectedAccount ?? '')
        queryClient.invalidateQueries(['ERC20Balance'])
        queryClient.invalidateQueries(['pendingTransactions'])
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.refetchQueries(['incomingMessages'])
        queryClient.refetchQueries(['pendingNotifications'])
        navigate('/bridge/transactions')
      },
      onError: (e: Error) => {
        const error = parseUntilDelimiter(e)
        console.log(error)
        setErrorMessage('Something went wrong. Try again, please')
      }
    }
  )

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
            const approveTx = await bridger?.approve(ethers.utils.parseEther(amount), signer)
            await approveTx.wait()
          }
        }
        const tx = await bridger?.transfer({ amount: ethers.utils.parseUnits(amount), signer, destinationProvider })
        await tx.wait()
        return {
          type: 'DEPOSIT',
          amount,
          lowNetworkChainId: selectedLowNetwork.chainId,
          highNetworkChainId: selectedHighNetwork.chainId,
          lowNetworkHash: tx.hash,
          lowNetworkTimestamp: Date.now() / 1000,
          completionTimestamp: Date.now() / 1000,
          newTransaction: true,
          symbol
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
          highNetworkTimestamp: Date.now() / 1000,
          challengePeriod: 60 * 60,
          symbol
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
        navigate('/bridge/transactions')
      },
      onError: (e) => {
        console.log(e)
        setErrorMessage('Something went wrong. Try again, please')
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
      <Modal
        opened={isAllowanceModalOpened}
        onClose={() => setIsAllowanceModalOpened(false)}
        withCloseButton={false}
        padding={'23px'}
        size={'400px'}
        radius={'12px'}
        classNames={{ body: styles.body }}
      >
        <ApproveAllowance
          balance={lowNetworkBalance?.raw ?? ethers.BigNumber.from('0')}
          amount={ethers.utils.parseUnits(String(amount), 18).add(additionalCost)}
          onSuccess={() => {
            setIsAllowanceModalOpened(false)
            deposit.mutate(String(amount))
          }}
          onClose={() => setIsAllowanceModalOpened(false)}
          allowanceProps={{
            tokenAddress: selectedLowNetwork.g7TokenAddress,
            network: selectedLowNetwork,
            spender: selectedLowNetwork.routerSpender
          }}
        />
      </Modal>
    </>
  )
}

export default ActionButton
