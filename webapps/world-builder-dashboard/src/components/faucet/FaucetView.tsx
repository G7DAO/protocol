import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { FAUCET_CHAIN, G7T_FAUCET_ADDRESS, L2_NETWORK, L3_NATIVE_TOKEN_SYMBOL, L3_NETWORK } from '../../../constants'
import styles from './FaucetView.module.css'
import { ethers } from 'ethers'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { timeDifferenceInHoursAndMinutes } from '@/utils/timeFormat'
import { faucetABI } from '@/web3/ABI/faucet_abi'
import { Signer } from '@ethersproject/abstract-signer'
import { useMediaQuery } from '@mantine/hooks'

interface FaucetViewProps {}
const FaucetView: React.FC<FaucetViewProps> = ({}) => {
  const [selectedNetwork, setSelectedNetwork] = useState(L2_NETWORK)
  const { connectedAccount, isConnecting, getProvider } = useBlockchainContext()
  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const smallView = useMediaQuery('(max-width: 767px)')

  const handleClick = async () => {
    if (window.ethereum) {
      const provider = await getProvider(L2_NETWORK)
      const signer = provider.getSigner()
      claim.mutate({ isL2Target: selectedNetwork.chainId === L2_NETWORK.chainId, signer })
    } else {
      console.error('Wallet is not installed!')
    }
  }

  const queryClient = useQueryClient()
  const claim = useMutation(
    async ({ isL2Target, signer }: { isL2Target: boolean; signer: Signer }) => {
      if (window.ethereum) {
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
        const receipt = tx.wait() // Wait for the transaction to be mined
        const type: 'CLAIM' | 'DEPOSIT' | 'WITHDRAWAL' = 'CLAIM'
        return {
          type,
          amount: '1',
          highNetworkChainId: selectedNetwork.chainId,
          lowNetworkChainId: FAUCET_CHAIN.chainId,
          lowNetworkHash: receipt.hash,
          lowNetworkTimestamp: Date.now() / 1000,
          completionTimestamp: Date.now() / 1000,
          newTransaction: true
        }
      }
      throw new Error('no window.ethereum')
    },
    {
      onSuccess: (data: TransactionRecord | undefined) => {
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)

          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          transactions.push({ ...data })
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        queryClient.setQueryData(['nextFaucetClaimTimestamp', connectedAccount], (oldData: any) => {
          const lastClaimTimestamp = Date.now() / 1000
          let faucetTimeInterval = oldData?.faucetTimeInterval
          if (!faucetTimeInterval) {
            queryClient.refetchQueries(['nextFaucetClaimTimestamp'])
            return oldData
          }

          const nextClaimTimestamp = lastClaimTimestamp + faucetTimeInterval
          const interval = timeDifferenceInHoursAndMinutes(Date.now() / 1000, nextClaimTimestamp)
          const isAvailable = false
          const date = new Date(nextClaimTimestamp * 1000)

          const readableDate = date.toLocaleString()
          return { readableDate, isAvailable, interval, faucetTimeInterval }
        })
        queryClient.refetchQueries('pendingTransactions')
        queryClient.refetchQueries(['notifications'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.refetchQueries(['ERC20balance'])
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

    return timestampInMillis <= currentInMillis
  }

  const nextClaimAvailable = useQuery(['nextFaucetClaimTimestamp', connectedAccount], async () => {
    const rpc = L2_NETWORK.rpcs[0]
    const provider = new ethers.providers.JsonRpcProvider(rpc)
    const faucetContract = new ethers.Contract(G7T_FAUCET_ADDRESS, faucetABI, provider)
    const lastClaimTimestamp = Number(await faucetContract.lastClaimedTimestamp(connectedAccount))
    const faucetTimeInterval = Number(await faucetContract.faucetTimeInterval())
    const nextClaimTimestamp = lastClaimTimestamp + faucetTimeInterval
    const interval = timeDifferenceInHoursAndMinutes(Date.now() / 1000, nextClaimTimestamp)
    const isAvailable = compareTimestampWithCurrentMoment(nextClaimTimestamp)
    const date = new Date(nextClaimTimestamp * 1000)

    const readableDate = date.toLocaleString()
    return { readableDate, isAvailable, interval, faucetTimeInterval }
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
        {connectedAccount ? (
          <div className={styles.address}>
            {smallView ? `${connectedAccount.slice(0, 6)}....${connectedAccount.slice(-4)}` : connectedAccount}
          </div>
        ) : (
          <div className={styles.addressPlaceholder}>'Please connect a wallet...</div>
        )}
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
