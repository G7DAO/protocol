// External Libraries
import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
// Constants
import { L3_NETWORK } from '../../../../constants'
// Styles
import styles from './ActionButton.module.css'
import { Modal } from 'summon-ui/mantine'
// Absolute Imports
import ApproveAllowance from '@/components/bridge/allowance/ApproveAllowance'
import { HighNetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import useERC20Balance, { fetchERC20Allowance, useERC20Allowance } from '@/hooks/useERC20Balance'
import { depositERC20ArbitrumSDK, TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { sendDepositERC20ToNativeTransaction } from '@/utils/bridge/depositERC20ToNative'
import { sendWithdrawERC20Transaction } from '@/utils/bridge/withdrawERC20'
import { sendWithdrawTransaction } from '@/utils/bridge/withdrawNativeToken'
import { L2ToL1MessageStatus } from '@arbitrum/sdk'

interface ActionButtonProps {
  direction: 'DEPOSIT' | 'WITHDRAW' | 'CREATEPOOL'
  amount: string
  isDisabled: boolean
  setErrorMessage: (arg0: string) => void
}

const ActionButton: React.FC<ActionButtonProps> = ({ direction, amount, isDisabled, setErrorMessage }) => {
  const { connectedAccount, isConnecting, selectedHighNetwork, selectedLowNetwork, connectWallet, getProvider } =
    useBlockchainContext()
  const [isAllowanceModalOpened, setIsAllowanceModalOpened] = useState(false)
  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const navigate = useNavigate()

  const { data: allowance } = useERC20Allowance({
    tokenAddress: selectedLowNetwork.g7TokenAddress,
    owner: connectedAccount,
    spender: selectedLowNetwork.routerSpender ?? '',
    rpc: selectedLowNetwork.rpcs[0]
  })

  const { data: lowNetworkBalance } = useERC20Balance({
    tokenAddress: selectedLowNetwork.g7TokenAddress,
    account: connectedAccount,
    rpc: selectedLowNetwork.rpcs[0]
  })

  const getLabel = (): String | undefined => {
    if (isConnecting) {
      return 'Connecting...'
    }
    if (deposit.isLoading || withdraw.isLoading) {
      return 'Submitting...'
    }
    if (!connectedAccount) {
      return 'Connect wallet'
    }
    return 'Submit'
  }

  const handleClick = async () => {
    if (isConnecting || deposit.isLoading || withdraw.isLoading) {
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
    if (direction === 'DEPOSIT') {
      deposit.mutate(amount)
      return
    }
    if (direction === 'WITHDRAW') {
      withdraw.mutate(amount)
      return
    }
    if (direction === 'CREATEPOOL') {
      return
    }
  }

  const queryClient = useQueryClient()
  const deposit = useMutation(
    async (amount: string) => {
      const provider = await getProvider(selectedLowNetwork)
      if (!provider || !connectedAccount) {
        throw new Error("Wallet isn't connected")
      }
      const allowance = await fetchERC20Allowance({
        tokenAddress: selectedLowNetwork.g7TokenAddress,
        owner: connectedAccount,
        spender: selectedLowNetwork.routerSpender ?? '',
        rpc: selectedLowNetwork.rpcs[0]
      })
      if (allowance !== undefined && allowance < Number(amount)) {
        setIsAllowanceModalOpened(true)
        return
      }
      const signer = provider.getSigner()
      if (selectedHighNetwork.chainId === L3_NETWORK.chainId) {
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
        console.log(e)
        setErrorMessage('Something went wrong. Try again, please')
      }
    }
  )

  const withdraw = useMutation(
    async (amount: string) => {
      const provider = await getProvider(selectedHighNetwork)
      if (!provider || !connectedAccount) {
        throw new Error("Wallet isn't connected")
      }
      if (selectedHighNetwork.chainId !== L3_NETWORK.chainId) {
        return sendWithdrawERC20Transaction(amount, connectedAccount)
      }
      return sendWithdrawTransaction(amount, connectedAccount)
    },
    {
      onSuccess: async (record: TransactionRecord) => {
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
        queryClient.setQueryData(
          ['withdrawalStatus', record.highNetworkHash, selectedLowNetwork.rpcs[0], selectedHighNetwork.rpcs[0]],
          () => {
            return {
              timestamp: new Date().getTime() / 1000,
              status: L2ToL1MessageStatus.UNCONFIRMED,
              value: record.amount,
              confirmations: 1
            }
          }
        )
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
        disabled={getLabel() !== 'Connect wallet' && (isDisabled || Number(amount) <= 0)}
      >
        {getLabel() ?? 'Submit'}
      </button>
      <Modal
        opened={isAllowanceModalOpened}
        onClose={() => setIsAllowanceModalOpened(false)}
        withCloseButton={false}
        padding={'24px'}
        size={'400px'}
        radius={'12px'}
      >
        <ApproveAllowance
          balance={Number(lowNetworkBalance ?? '0')}
          allowance={allowance ?? 0}
          amount={Number(amount)}
          onSuccess={() => {
            setIsAllowanceModalOpened(false)
            deposit.mutate(amount)
          }}
          onClose={() => setIsAllowanceModalOpened(false)}
        />
      </Modal>
    </>
  )
}

export default ActionButton
