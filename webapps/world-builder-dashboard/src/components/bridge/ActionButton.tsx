import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { L3_NETWORK } from '../../../constants'
import styles from './ActionButton.module.css'
import { ethers } from 'ethers'
import IconLoading01 from '@/assets/IconLoading01'
import { HighNetworkInterface, NetworkInterface, useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { depositERC20ArbitrumSDK, DepositRecord } from '@/components/bridge/depositERC20ArbitrumSDK'
import { sendDepositERC20ToNativeTransaction } from '@/components/bridge/depositERC20ToNative'
import { sendWithdrawERC20Transaction } from '@/components/bridge/withdrawERC20'
import { sendWithdrawTransaction, WithdrawRecord } from '@/components/bridge/withdrawNativeToken'
import { L2ToL1MessageStatus } from '@arbitrum/sdk'

interface ActionButtonProps {
  direction: 'DEPOSIT' | 'WITHDRAW'
  l3Network: HighNetworkInterface
  amount: string
}
const ActionButton: React.FC<ActionButtonProps> = ({ direction, amount }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const { connectedAccount, walletProvider, checkConnection, switchChain, selectedHighNetwork, selectedLowNetwork } =
    useBlockchainContext()

  const getLabel = (): String | undefined => {
    if (isConnecting || deposit.isLoading || withdraw.isLoading) {
      return undefined
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

  const handleClick = async () => {
    if (isConnecting || deposit.isLoading || withdraw.isLoading) {
      return
    }

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
              mutate(amount)
            } catch (error) {
              console.error('Error switching chain:', error)
            }
          } else {
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
        // return sendDepositERC20Transaction(amount, connectedAccount, selectedLowNetwork, selectedHighNetwork, provider)
        return depositERC20ArbitrumSDK(selectedLowNetwork, selectedHighNetwork, amount, signer)
      }
      throw new Error('no window.ethereum')
    },
    {
      onSuccess: (deposit: DepositRecord) => {
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
        console.log(deposit)
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.refetchQueries(['incomingMessages'])
      },
      onError: (e: Error) => {
        console.log(e)
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
      onSuccess: async (record: WithdrawRecord) => {
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
        console.log(record)
      }
    }
  )

  return (
    <button
      className={styles.container}
      onClick={handleClick}
      disabled={getLabel() !== 'Connect wallet' && (!Number(amount) || Number(amount) <= 0)}
    >
      {getLabel() ?? <IconLoading01 color={'white'} className={styles.rotatable} />}
    </button>
  )
}

export default ActionButton
