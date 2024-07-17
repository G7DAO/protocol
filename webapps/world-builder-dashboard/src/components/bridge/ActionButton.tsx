import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { L3_NETWORK } from '../../../constants'
import styles from './ActionButton.module.css'
import { ethers } from 'ethers'
import IconLoading01 from '@/assets/IconLoading01'
import { HighNetworkInterface, NetworkInterface, useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { sendDepositERC20Transaction } from '@/components/bridge/depositERC20'
import { sendDepositERC20ToNativeTransaction } from '@/components/bridge/depositERC20ToNative'
import { sendWithdrawERC20Transaction } from '@/components/bridge/withdrawERC20'
import { sendWithdrawTransaction } from '@/components/bridge/withdrawNativeToken'
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
        if (selectedHighNetwork.chainId === L3_NETWORK.chainId) {
          return sendDepositERC20ToNativeTransaction(amount, connectedAccount, selectedHighNetwork, provider)
        }
        return sendDepositERC20Transaction(amount, connectedAccount, selectedLowNetwork, selectedHighNetwork, provider)
      }
      throw new Error('no window.ethereum')
    },
    {
      onSuccess: (receipt: ethers.providers.TransactionReceipt, amount) => {
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)

          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          transactions.push({
            isDeposit: true,
            timestamp: Date.now() / 1000,
            minedTimestamp: Date.now() / 1000 - 7,
            amount,
            txHash: receipt.transactionHash,
            chainId: selectedHighNetwork.chainId,
            delay: 60,
            l2RPC: selectedLowNetwork.rpcs[0],
            l3RPC: selectedHighNetwork.rpcs[0],
            from: connectedAccount,
            to: connectedAccount
          })
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        console.log(receipt)
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.refetchQueries(['incomingMessages'])
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
      onSuccess: async (receipt: ethers.providers.TransactionReceipt, variables) => {
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          transactions.push({
            txHash: receipt.transactionHash,
            chainId: selectedHighNetwork.chainId,
            delay: 60 * 60
          })
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        queryClient.setQueryData(
          ['withdrawalStatus', receipt.transactionHash, selectedLowNetwork.rpcs[0], selectedHighNetwork.rpcs[0]],
          () => {
            return {
              timestamp: new Date().getTime() / 1000,
              status: L2ToL1MessageStatus.UNCONFIRMED,
              value: variables,
              confirmations: 1
            }
          }
        )
        queryClient.setQueryData(['incomingMessages', connectedAccount], (oldData: any) => {
          return [
            {
              txHash: receipt.transactionHash,
              chainId: selectedHighNetwork.chainId,
              delay: 60 * 60,
              l2RPC: selectedLowNetwork.rpcs[0],
              l3RPC: selectedHighNetwork.rpcs[0]
            },
            ...oldData
          ]
        })
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        console.log(receipt)
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
