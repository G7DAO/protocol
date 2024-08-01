import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { G7T_FAUCET_ADDRESS, L2_NETWORK, L3_NATIVE_TOKEN_SYMBOL, L3_NETWORK } from '../../../constants'
import styles from './FaucetView.module.css'
import { ethers } from 'ethers'
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { useBridgeNotificationsContext } from '@/components/bridge/BridgeNotificationsContext'
import { TransactionRecord } from '@/components/bridge/depositERC20ArbitrumSDK'
import { timeDifferenceInHoursAndMinutes } from '@/utils/timeFormat'

const FAUCET_CHAIN = L2_NETWORK

interface FaucetViewProps {}
const FaucetView: React.FC<FaucetViewProps> = ({}) => {
  const [selectedNetwork, setSelectedNetwork] = useState(L2_NETWORK)
  const { connectedAccount, switchChain } = useBlockchainContext()
  const [isConnecting, setIsConnecting] = useState(false)
  const { refetchNewNotifications } = useBridgeNotificationsContext()

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

  const queryClient = useQueryClient()
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
        const receipt = tx.wait() // Wait for the transaction to be mined
        return {
          type: 'CLAIM',
          amount: 1,
          highNetworkChainId: selectedNetwork.chainId,
          lowNetworkHash: receipt.hash,
          lowNetworkTimestamp: Date.now() / 1000,
          completionTimestamp: Date.now() / 1000,
          newTransaction: true
        }
      }
      throw new Error('no window.ethereum')
    },
    {
      onSuccess: (data: TransactionRecord) => {
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)

          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          transactions.push({ ...data })
          console.log(transactions)
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        // console.log('Claim successful')
        // console.log(data)
        queryClient.refetchQueries(['nextFaucetClaimTimestamp'])
        queryClient.refetchQueries('pendingTransactions')
        queryClient.refetchQueries(['notifications'])
        refetchNewNotifications(connectedAccount ?? '')
      },
      onError: (e: Error) => {
        console.error('Transaction failed:', e)
        console.log(e)
      }
    }
  )

  function compareTimestampWithCurrentMoment(unixTimestamp: number): boolean {
    const timestampInMillis = unixTimestamp * 1000 // Unix timestamp in milliseconds
    const currentInMillis = Date.now() // Current time in milliseconds

    if (timestampInMillis > currentInMillis) {
      return false
    }

    return true
  }

  const nextClaimAvailable = useQuery(['nextFaucetClaimTimestamp', connectedAccount], async () => {
    const rpc = L2_NETWORK.rpcs[0]
    const provider = new ethers.providers.JsonRpcProvider(rpc)
    const faucetContract = new ethers.Contract(
      G7T_FAUCET_ADDRESS,
      [
        {
          inputs: [],
          name: 'faucetTimeInterval',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256'
            }
          ],
          stateMutability: 'view',
          type: 'function'
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: '',
              type: 'address'
            }
          ],
          name: 'lastClaimedTimestamp',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256'
            }
          ],
          stateMutability: 'view',
          type: 'function'
        }
      ],
      provider
    )
    const lastClaimTimestamp = Number(await faucetContract.lastClaimedTimestamp(connectedAccount))
    const faucetTimeInterval = Number(await faucetContract.faucetTimeInterval())
    const nextClaimTimestamp = lastClaimTimestamp + faucetTimeInterval
    const interval = timeDifferenceInHoursAndMinutes(Date.now() / 1000, nextClaimTimestamp)
    const isAvailable = compareTimestampWithCurrentMoment(nextClaimTimestamp)
    const date = new Date(nextClaimTimestamp * 1000)

    const readableDate = date.toLocaleString()

    return { readableDate, isAvailable, interval }
  })

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
      {(!nextClaimAvailable.data || nextClaimAvailable.data.isAvailable) && (
        <div className={styles.hintBadge}>You may only request funds to a connected wallet.</div>
      )}
      {nextClaimAvailable.data && !nextClaimAvailable.data.isAvailable && (
        <div
          className={styles.warningContainer}
        >{`Already requested today. Come back in ${nextClaimAvailable.data.interval}`}</div>
      )}
      <button
        className={styles.button}
        onClick={handleClick}
        disabled={!!connectedAccount && (!nextClaimAvailable.data || !nextClaimAvailable.data.isAvailable)}
      >
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
