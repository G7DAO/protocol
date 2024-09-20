import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  ALL_NETWORKS,
  FAUCET_CHAIN,
  G7T_FAUCET_ADDRESS,
  L2_NETWORK,
  L3_NATIVE_TOKEN_SYMBOL,
  L3_NETWORK
} from '../../../constants'
import ValueSelector from '../commonComponents/valueSelector/ValueSelector'
import styles from './FaucetView.module.css'
import { ethers } from 'ethers'
import { NetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { useUISettings } from '@/contexts/UISettingsContext'
import { useFaucetAPI } from '@/hooks/useFaucetAPI'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { timeDifferenceInHoursAndMinutes, timeDifferenceInHoursMinutesAndSeconds } from '@/utils/timeFormat'
import { ZERO_ADDRESS } from '@/utils/web3utils'
import { faucetABI } from '@/web3/ABI/faucet_abi'
import { Signer } from '@ethersproject/abstract-signer'
import { useMediaQuery } from '@mantine/hooks'

interface FaucetViewProps {}
const FaucetView: React.FC<FaucetViewProps> = ({}) => {
  const [selectedAccountType, setSelectedAccountType] = useState({ valueId: 1, displayName: 'Other wallet' })
  const [address, setAddress] = useState<string>('')
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkInterface>(L3_NETWORK)
  const { requestFaucet } = useFaucetAPI()
  const { connectedAccount, isConnecting } = useBlockchainContext()
  const [animatedInterval, setAnimatedInterval] = useState('')
  const [nextClaimTimestamp, setNextClaimTimestamp] = useState(0)
  const [networkError, setNetworkError] = useState('')
  const { faucetTargetChainId } = useUISettings()

  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const smallView = useMediaQuery('(max-width: 1199px)')

  useEffect(() => {
    const targetNetwork = ALL_NETWORKS.find((n) => n.chainId === faucetTargetChainId)
    if (targetNetwork) {
      setSelectedNetwork(targetNetwork)
    }

    if (selectedAccountType.valueId === 0 && connectedAccount) setAddress(connectedAccount)
  }, [faucetTargetChainId, selectedAccountType])

  const handleClick = async () => {
    // TODO: DELETE LATER WHEN REQUEST IS FULLY INTEGRATED :D
    // if (!connectedAccount) {
    //   await connectWallet()
    //   return
    // }
    // const provider = await getProvider(L2_NETWORK)
    // const signer = provider.getSigner()
    // claim.mutate({ isL2Target: selectedNetwork.chainId === L2_NETWORK.chainId, signer })

    await requestFaucet(address)
  }

  const handleSelectAccountType = (selectedAccountType: any) => {
    if (selectedAccountType.valueId === 0 && connectedAccount) setAddress(connectedAccount)
    else setAddress('')
    console.log(selectedAccountType)
    setSelectedAccountType(selectedAccountType)
  }

  const queryClient = useQueryClient()
  const claim = useMutation(
    async ({ isL2Target, signer }: { isL2Target: boolean; signer: Signer }) => {
      setNetworkError('')
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
        const receipt = await tx.wait() // Wait for the transaction to be mined
        const type: 'CLAIM' | 'DEPOSIT' | 'WITHDRAWAL' = 'CLAIM'
        return {
          type,
          amount: '1',
          highNetworkChainId: selectedNetwork.chainId,
          lowNetworkChainId: FAUCET_CHAIN.chainId,
          lowNetworkHash: receipt.transactionHash,
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
        setNetworkError('Something went wrong. Try again, please')
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
    ['nextFaucetClaimTimestamp', address],
    async () => {
      if (address === '') return
      const rpc = L2_NETWORK.rpcs[0]
      const provider = new ethers.providers.JsonRpcProvider(rpc)
      const faucetContract = new ethers.Contract(G7T_FAUCET_ADDRESS, faucetABI, provider)

      const lastClaimedL2Timestamp = Number(await faucetContract.lastClaimedL2Timestamp(address))
      const lastClaimedL3Timestamp = Number(await faucetContract.lastClaimedL3Timestamp(address))

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
      enabled: !!address
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Testnet Faucet</div>
        <div className={styles.supportingText}>
          {`Request and get 1 ${L3_NATIVE_TOKEN_SYMBOL} per day to your connected wallet or a another wallet address on G7 network.`}
        </div>
      </div>
      {/* <div className={styles.networksContainer}> */}
      <div className={styles.addressContainer}>
        <div className={styles.label}>Address type</div>
        <ValueSelector
          values={[
            { valueId: 0, displayName: 'Connected wallet' },
            { valueId: 1, displayName: 'Other wallet' }
          ]}
          selectedValue={selectedAccountType}
          onChange={(e) => {
            handleSelectAccountType(e, address)
          }}
        />
      </div>
      {/* TODO: MAKE A COMPONENT */}
      <div className={styles.addressContainer}>
        <div className={styles.label}>Wallet Address</div>
        {connectedAccount ? (
          <input
            placeholder={ZERO_ADDRESS}
            className={styles.address}
            value={connectedAccount && selectedAccountType.valueId === 0 ? connectedAccount : address}
            onChange={(e) => {
              setAddress(e.target.value)
            }}
          />
        ) : (
          <div className={styles.addressPlaceholder}>Please connect a wallet...</div>
        )}
      </div>
      <div className={styles.addressContainer} style={{ marginTop: '18px' }}>
        <button
          className={styles.button}
          onClick={handleClick}
          disabled={
            !!connectedAccount && (!nextClaimAvailable.data || !nextClaimAvailable.data.L3.isAvailable)
            // (selectedNetwork.chainId === L2_NETWORK.chainId
            //   ? !nextClaimAvailable.data.L2.isAvailable
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
      {!!networkError && <div className={styles.errorContainer}>{networkError}.</div>}
      {!networkError && nextClaimAvailable.isLoading && (
        <div className={styles.warningContainer}>Checking faucet permissions...</div>
      )}

      {/* May delete. Probably will */}
      {/* 
      {!nextClaimAvailable.isLoading &&
        !networkError &&
        (selectedNetwork.chainId === L2_NETWORK.chainId
          ? nextClaimAvailable.data?.L2.isAvailable
          : nextClaimAvailable.data?.L3.isAvailable) && (
          <div className={styles.hintBadge}>You may only request funds to a connected wallet.</div>
        )}
      {!nextClaimAvailable.isLoading && !connectedAccount && !networkError && (
        <div className={styles.hintBadge}>You may only request funds to a connected wallet.</div>
      )} */}

      {selectedNetwork.chainId === L2_NETWORK.chainId &&
        nextClaimAvailable.data &&
        !nextClaimAvailable.data.L2.isAvailable && (
          <div className={styles.errorContainer}>
            {`You requested funds recently. Come back in `}
            <span className={styles.time}>{animatedInterval}</span>
          </div>
        )}
      {selectedNetwork.chainId === L3_NETWORK.chainId &&
        nextClaimAvailable.data &&
        !nextClaimAvailable.data.L3.isAvailable && (
          <div className={styles.errorContainer}>
            {`You requested funds recently. Come back in `}{' '}
            <span className={styles.time}>{` ${animatedInterval}`}</span>
          </div>
        )}
    </div>
  )
}

export default FaucetView
