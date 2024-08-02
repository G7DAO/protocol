// External Libraries
import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
// Constants
import { L3_NETWORK } from '../../../../constants'
// Styles
import styles from './ActionButton.module.css'
import { ethers } from 'ethers'
import { Modal } from 'summon-ui/mantine'
// Absolute Imports
import ApproveAllowance from '@/components/bridge/allowance/ApproveAllowance'
import { HighNetworkInterface, NetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import useERC20Balance, { useERC20Allowance } from '@/hooks/useERC20Balance'
import { depositERC20ArbitrumSDK, TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { sendDepositERC20ToNativeTransaction } from '@/utils/bridge/depositERC20ToNative'
import { sendWithdrawERC20Transaction } from '@/utils/bridge/withdrawERC20'
import { sendWithdrawTransaction } from '@/utils/bridge/withdrawNativeToken'
import { L2ToL1MessageStatus } from '@arbitrum/sdk'

interface ActionButtonProps {
  direction: 'DEPOSIT' | 'WITHDRAW'
  l3Network: HighNetworkInterface
  amount: string
  isDisabled: boolean
  setErrorMessage: (arg0: string) => void
}
const ActionButton: React.FC<ActionButtonProps> = ({ direction, amount, isDisabled, setErrorMessage }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const { connectedAccount, walletProvider, checkConnection, switchChain, selectedHighNetwork, selectedLowNetwork } =
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
    if (!connectedAccount || !walletProvider) {
      return 'Connect wallet'
    }
    return 'Submit'
  }

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsConnecting(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send('eth_requestAccounts', [])
      } catch (error) {
        console.error('Error connecting to wallet:', error)
      } finally {
        setIsConnecting(false)
      }
    } else {
      alert('Wallet is not installed. Please install it to use this feature.')
    }
  }

  const handleClick = async (isAllowanceSet: boolean) => {
    if (isConnecting || deposit.isLoading || withdraw.isLoading) {
      return
    }
    setErrorMessage('')

    if (connectedAccount && walletProvider) {
      setIsConnecting(true)

      const accounts = await walletProvider.listAccounts()
      if (accounts.length === 0) {
        await connectWallet()
      }
      const handleTransaction = async (
        targetChain: NetworkInterface,
        mutate: (amount: string) => void,
        amount: string
      ): Promise<void> => {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum)
          const currentChain = await provider.getNetwork()
          if (currentChain.chainId !== targetChain.chainId) {
            try {
              await switchChain(targetChain)
              if (direction === 'DEPOSIT' && allowance !== undefined && !isAllowanceSet) {
                if (allowance < Number(amount)) {
                  setIsAllowanceModalOpened(true)
                  return
                }
              }
              mutate(amount)
            } catch (error) {
              console.error('Error switching chain:', error)
            }
          } else {
            if (direction === 'DEPOSIT' && allowance !== undefined && !isAllowanceSet) {
              if (allowance < Number(amount)) {
                setIsAllowanceModalOpened(true)
                return
              }
            }
            mutate(amount)
          }
        } else {
          console.error('Wallet is not installed!')
        }
      }

      const handleDeposit = async (): Promise<void> => {
        await handleTransaction(selectedLowNetwork, deposit.mutate, amount)
      }

      const handleWithdraw = async (): Promise<void> => {
        await handleTransaction(selectedHighNetwork, withdraw.mutate, amount)
      }

      if (direction === 'DEPOSIT') {
        await handleDeposit()
      }
      if (direction === 'WITHDRAW') {
        await handleWithdraw()
      }

      setIsConnecting(false)
      return
    }
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const accounts = await provider.listAccounts()
      if (accounts.length === 0) {
        await connectWallet()
      } else {
        checkConnection()
        console.log('Wallet already connected')
      }
    } else {
      alert('Wallet is not installed. Please install it to use this feature.')
    }
  }

  const queryClient = useQueryClient()
  const deposit = useMutation(
    (amount: string) => {
      if (!(connectedAccount && walletProvider)) {
        throw new Error("Wallet isn't connected")
      }
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
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
      }
      throw new Error('no window.ethereum')
    },
    {
      onSuccess: (deposit: TransactionRecord) => {
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
    (amount: string) => {
      if (!(connectedAccount && walletProvider)) {
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
        queryClient.setQueryData(['incomingMessages', connectedAccount], (oldData: any) => {
          if (oldData) {
            return [record, ...oldData]
          }
          return [record]
        })
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.refetchQueries(['pendingNotifications'])

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
        onClick={() => handleClick(false)}
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
            handleClick(true)
          }}
          onClose={() => setIsAllowanceModalOpened(false)}
        />
      </Modal>
    </>
  )
}

export default ActionButton
