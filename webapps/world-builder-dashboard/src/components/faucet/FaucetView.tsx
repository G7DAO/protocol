import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { G7T_FAUCET_ADDRESS, L2_NETWORK, L3_NATIVE_TOKEN_SYMBOL, L3_NETWORK } from '../../../constants'
import styles from './FaucetView.module.css'
import { ethers } from 'ethers'
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { DepositRecord } from '@/components/bridge/depositERC20ArbitrumSDK'

const FAUCET_CHAIN = L2_NETWORK

interface FaucetViewProps {}
const FaucetView: React.FC<FaucetViewProps> = ({}) => {
  const [selectedNetwork, setSelectedNetwork] = useState(L2_NETWORK)
  const { connectedAccount, switchChain } = useBlockchainContext()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleClick = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const currentChain = await provider.getNetwork()
      const accounts = await provider.listAccounts()
      if (accounts.length === 0) {
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
        return
      }
      if (currentChain.chainId !== FAUCET_CHAIN.chainId) {
        try {
          await switchChain(FAUCET_CHAIN)
          claim.mutate({ isL2Target: selectedNetwork.chainId === L2_NETWORK.chainId })
        } catch (error) {
          console.error('Error switching chain:', error)
        }
      } else {
        claim.mutate({ isL2Target: selectedNetwork.chainId === L2_NETWORK.chainId })
      }
    } else {
      console.error('Wallet is not installed!')
    }
  }

  const claim = useMutation(
    async ({ isL2Target }: { isL2Target: boolean }) => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contractAbi = [
          {
            inputs: [],
            name: 'claim',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function'
          },
          {
            inputs: [],
            name: 'claimL3',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function'
          }
        ]

        const contract = new ethers.Contract(G7T_FAUCET_ADDRESS, contractAbi, signer)
        const tx = isL2Target ? await contract.claim() : await contract.claimL3()
        console.log('Transaction hash:', tx.hash)
        return tx.wait() // Wait for the transaction to be mined
      }
      throw new Error('no window.ethereum')
    },
    {
      onSuccess: (data: any) => {
        console.log('Claim successful')
        console.log(data)
      },
      onError: (e: Error) => {
        console.error('Transaction failed:', e)
        console.log(e)
      }
    }
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Testnet Faucet</div>
        <div className={styles.supportingText}>
          {`Request 1 ${L3_NATIVE_TOKEN_SYMBOL} per day to your wallet address.`}
        </div>
      </div>
      <div className={styles.networksContainer}>
        <button
          className={selectedNetwork === L3_NETWORK ? styles.selectedNetworkButton : styles.networkButton}
          onClick={() => setSelectedNetwork(L3_NETWORK)}
        >
          {L3_NETWORK.displayName}
        </button>
        <button
          className={selectedNetwork === L2_NETWORK ? styles.selectedNetworkButton : styles.networkButton}
          onClick={() => setSelectedNetwork(L2_NETWORK)}
        >
          {L2_NETWORK.displayName}
        </button>
      </div>
      <div className={styles.addressContainer}>
        <div className={styles.label}>Connected Wallet Address</div>
        <div className={connectedAccount ? styles.address : styles.addressPlaceholder}>
          {connectedAccount ?? 'Please connect a wallet...'}
        </div>
      </div>
      <div className={styles.hintBadge}>You may only request funds to a connected wallet.</div>
      <button className={styles.button} onClick={handleClick}>
        {isConnecting
          ? 'Connecting wallet...'
          : claim.isLoading
            ? 'Requesting...'
            : connectedAccount
              ? 'Request'
              : 'Connect wallet'}
      </button>
    </div>
  )
}
export default FaucetView
