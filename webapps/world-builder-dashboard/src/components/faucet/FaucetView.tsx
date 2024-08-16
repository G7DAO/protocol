import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { FAUCET_CHAIN, G7T_FAUCET_ADDRESS, L2_NETWORK, L3_NATIVE_TOKEN_SYMBOL, L3_NETWORK } from '../../../constants'
import styles from './FaucetView.module.css'
import { ethers } from 'ethers'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { timeDifferenceInHoursAndMinutes, timeDifferenceInHoursMinutesAndSeconds } from '@/utils/timeFormat'
import { faucetABI } from '@/web3/ABI/faucet_abi'
import { Signer } from '@ethersproject/abstract-signer'
import { useMediaQuery } from '@mantine/hooks'

interface FaucetViewProps {}
const FaucetView: React.FC<FaucetViewProps> = ({}) => {
  const [selectedNetwork, setSelectedNetwork] = useState(L2_NETWORK)
  const { connectedAccount, isConnecting, getProvider, connectWallet } = useBlockchainContext()
  const [animatedInterval, setAnimatedInterval] = useState('')
  const [nextClaimTimestamp, setNextClaimTimestamp] = useState(0)

  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const smallView = useMediaQuery('(max-width: 767px)')

  const handleClick = async () => {
    if (!connectedAccount) {
      await connectWallet()
      return
    }
    const provider = await getProvider(L2_NETWORK)
    const signer = provider.getSigner()
    claim.mutate({ isL2Target: selectedNetwork.chainId === L2_NETWORK.chainId, signer })
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
      onSuccess: (data: TransactionRecord | undefined, variables) => {
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
          if (!oldData) {
            queryClient.refetchQueries(['nextFaucetClaimTimestamp'])
            return oldData
          }

          const nextClaimTimestamp = lastClaimTimestamp + oldData.faucetTimeInterval
          const interval = timeDifferenceInHoursAndMinutes(Date.now() / 1000, nextClaimTimestamp)
          const isAvailable = false
          const L2 = variables.isL2Target ? { nextClaimTimestamp, interval, isAvailable } : oldData.L2
          const L3 = !variables.isL2Target ? { nextClaimTimestamp, interval, isAvailable } : oldData.L3

          return { faucetTimeInterval: oldData.faucetTimeInterval, L2, L3 }
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

  const nextClaimAvailable = useQuery(
    ['nextFaucetClaimTimestamp', connectedAccount],
    async () => {
      const rpc = L2_NETWORK.rpcs[0]
      const provider = new ethers.providers.JsonRpcProvider(rpc)
      const faucetContract = new ethers.Contract(G7T_FAUCET_ADDRESS, faucetABI, provider)

      const lastClaimedL2Timestamp = Number(await faucetContract.lastClaimedL2Timestamp(connectedAccount))
      const lastClaimedL3Timestamp = Number(await faucetContract.lastClaimedL3Timestamp(connectedAccount))

      const faucetTimeInterval = Number(await faucetContract.faucetTimeInterval())
      const nextClaimL2Timestamp = lastClaimedL2Timestamp + faucetTimeInterval
      const nextClaimL3Timestamp = lastClaimedL3Timestamp + faucetTimeInterval

      const intervalL2 = timeDifferenceInHoursAndMinutes(Date.now() / 1000, nextClaimL2Timestamp)
      const intervalL3 = timeDifferenceInHoursAndMinutes(Date.now() / 1000, nextClaimL3Timestamp)

      const isAvailableL2 = compareTimestampWithCurrentMoment(nextClaimL2Timestamp)
      const isAvailableL3 = compareTimestampWithCurrentMoment(nextClaimL3Timestamp)

      const L2 = { interval: intervalL2, nextClaimTimestamp: nextClaimL2Timestamp, isAvailable: isAvailableL2 }
      const L3 = { interval: intervalL3, nextClaimTimestamp: nextClaimL3Timestamp, isAvailable: isAvailableL3 }

      return { faucetTimeInterval, L2, L3 }
    },
    {
      enabled: !!connectedAccount
    }
  )

  useEffect(() => {
    if (!nextClaimAvailable.data) {
      return
    }
    const intervalInfo =
      selectedNetwork.chainId === L2_NETWORK.chainId ? nextClaimAvailable.data.L2 : nextClaimAvailable.data.L3
    if (!intervalInfo.isAvailable) {
      setNextClaimTimestamp(intervalInfo.nextClaimTimestamp)
    }
  }, [nextClaimAvailable.data, selectedNetwork])

  useEffect(() => {
    let intervalId: NodeJS.Timeout
    if (nextClaimTimestamp) {
      setAnimatedInterval(timeDifferenceInHoursMinutesAndSeconds(Math.floor(Date.now() / 1000), nextClaimTimestamp))
      intervalId = setInterval(() => {
        setAnimatedInterval(timeDifferenceInHoursMinutesAndSeconds(Math.floor(Date.now() / 1000), nextClaimTimestamp))
      }, 1000)
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [nextClaimTimestamp])

  useEffect(() => {}, [])

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
          <div className={styles.addressPlaceholder}>Please connect a wallet...</div>
        )}
      </div>
      {nextClaimAvailable.isLoading && <div className={styles.warningContainer}>Checking faucet permissions...</div>}
      {!nextClaimAvailable.isLoading &&
        (selectedNetwork.chainId === L2_NETWORK.chainId
          ? nextClaimAvailable.data?.L2.isAvailable
          : nextClaimAvailable.data?.L3.isAvailable) && (
          <div className={styles.hintBadge}>You may only request funds to a connected wallet.</div>
        )}
      {!nextClaimAvailable.isLoading && !connectedAccount && (
        <div className={styles.hintBadge}>You may only request funds to a connected wallet.</div>
      )}
      {selectedNetwork.chainId === L2_NETWORK.chainId &&
        nextClaimAvailable.data &&
        !nextClaimAvailable.data.L2.isAvailable && (
          <div className={styles.warningContainer}>
            {`Already requested today. Come back in `}
            <span className={styles.time}>{animatedInterval}</span>
          </div>
        )}
      {selectedNetwork.chainId === L3_NETWORK.chainId &&
        nextClaimAvailable.data &&
        !nextClaimAvailable.data.L3.isAvailable && (
          <div className={styles.warningContainer}>
            {`Already requested today. Come back in `} <span className={styles.time}>{` ${animatedInterval}`}</span>
          </div>
        )}
      <button
        className={styles.button}
        onClick={handleClick}
        disabled={
          !!connectedAccount &&
          (!nextClaimAvailable.data ||
            (selectedNetwork.chainId === L2_NETWORK.chainId
              ? !nextClaimAvailable.data.L2.isAvailable
              : !nextClaimAvailable.data.L3.isAvailable))
        }
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
