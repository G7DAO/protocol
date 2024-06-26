import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { L2_CHAIN } from '../../../constants'
import styles from './ActionButton.module.css'
import { ethers } from 'ethers'
import IconLoading01 from '@/assets/IconLoading01'
import { ChainInterface, useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { sendDepositTransaction } from '@/components/bridge/depositERC20'
import { L3NetworkConfiguration } from '@/components/bridge/l3Networks'
import { sendWithdrawTransaction } from '@/components/bridge/withdrawNativeToken'
import { L2ToL1MessageStatus } from '@arbitrum/sdk'

interface ActionButtonProps {
  direction: 'DEPOSIT' | 'WITHDRAW'
  l3Network: L3NetworkConfiguration
  amount: string
}
const ActionButton: React.FC<ActionButtonProps> = ({ direction, amount, l3Network }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const { connectedAccount, walletProvider, checkConnection, switchChain } = useBlockchainContext()

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
        targetChain: ChainInterface,
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
          console.error('MetaMask is not installed!')
        }
      }

      const handleDeposit = async (): Promise<void> => {
        await handleTransaction(L2_CHAIN, deposit.mutate, amount)
      }

      const handleWithdraw = async (): Promise<void> => {
        const targetChain: ChainInterface = {
          name: l3Network.chainInfo.chainName,
          chainId: l3Network.chainInfo.chainId,
          rpcs: l3Network.chainInfo.rpcs
        }
        await handleTransaction(targetChain, withdraw.mutate, amount)
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
        return sendDepositTransaction(amount, connectedAccount, l3Network, provider)
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
            chainId: l3Network.chainInfo.chainId,
            delay: 60,
            l2RPC: L2_CHAIN.rpcs[0],
            l3RPC: l3Network.chainInfo.rpcs[0],
            from: connectedAccount,
            to: connectedAccount,
          })
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        console.log(receipt);
        queryClient.refetchQueries(['ERC20Balance']);
        queryClient.refetchQueries(['nativeBalance']);
        queryClient.refetchQueries(['incomingMessages']);
      }
    }
  )
  const withdraw = useMutation(
    (amount: string) => {
      if (!(connectedAccount && walletProvider)) {
        throw new Error("Wallet isn't connected")
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
            chainId: l3Network.chainInfo.chainId,
            delay: 60 * 60
          })
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        queryClient.setQueryData(
          ['withdrawalStatus', receipt.transactionHash, L2_CHAIN.rpcs[0], l3Network.chainInfo.rpcs[0]],
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
              chainId: l3Network.chainInfo.chainId,
              delay: 60 * 60,
              l2RPC: L2_CHAIN.rpcs[0],
              l3RPC: l3Network.chainInfo.rpcs[0]
            },
            ...oldData
          ]
        })
        queryClient.refetchQueries(['ERC20Balance']);
        queryClient.refetchQueries(['nativeBalance']);
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
