import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  ALL_NETWORKS,
  FAUCET_CHAIN,
  L3_NATIVE_TOKEN_SYMBOL,
  L3_NETWORK
} from '../../../constants'
import styles from './FaucetView.module.css'
import { NetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { useUISettings } from '@/contexts/UISettingsContext'
import { useFaucetAPI } from '@/hooks/useFaucetAPI'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { timeDifferenceInHoursAndMinutes, timeDifferenceInHoursMinutesAndSeconds } from '@/utils/timeFormat'
import { ZERO_ADDRESS } from '@/utils/web3utils'
import ValueSelector, { ValueSelect } from '../commonComponents/valueSelector/ValueSelector'

interface FaucetViewProps { }
const FaucetView: React.FC<FaucetViewProps> = ({ }) => {
  const [selectedAccountType, setSelectedAccountType] = useState<ValueSelect>({ valueId: 0, displayName: 'External Address', value: '' })
  const [address, setAddress] = useState<string | undefined>('')
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkInterface>(L3_NETWORK)
  const { getFaucetInterval, getFaucetTimestamp } = useFaucetAPI()
  const { connectedAccount, connectWallet, accounts, chainId } = useBlockchainContext()
  const [animatedInterval, setAnimatedInterval] = useState('')
  const [nextClaimTimestamp, setNextClaimTimestamp] = useState(0)
  const [networkError, setNetworkError] = useState('')
  const { faucetTargetChainId } = useUISettings()
  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const [requesting, setRequesting] = useState<boolean>(false)

  const values = [
    {
      valueId: 0,
      displayName: 'External Address',
      value: ''
    },
    ...accounts.map((account, index) => ({
      valueId: index + 1,
      displayName: `Account ${(index + 1)}`,
      value: account
    }))
  ];

  useEffect(() => {
    const targetNetwork = ALL_NETWORKS.find((n) => n.chainId === faucetTargetChainId)
    if (targetNetwork) {
      setSelectedNetwork(targetNetwork)
    }

    if (selectedAccountType.valueId === 0) setAddress('')
  }, [faucetTargetChainId, selectedAccountType])

  useEffect(() => {
    console.log(requesting)
  }, [setRequesting, requesting])

  const handleConnect = async () => {
    if (!connectedAccount) connectWallet()
  }

  const handleSelectAccountType = (selectedAccountType: ValueSelect) => {
    if (selectedAccountType.valueId === 0 && !connectedAccount) setAddress('')
    else setAddress(selectedAccountType.value)
    setSelectedAccountType(selectedAccountType)
  }

  const queryClient = useQueryClient()
  const claim = useMutation(
    async ({ address }: { isL2Target: boolean; address: string | undefined }) => {
      setRequesting(true)

      const res = await fetch(`https://api.game7.build/api/faucet/request/${address}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      setNetworkError('')
      const type: 'CLAIM' | 'DEPOSIT' | 'WITHDRAWAL' = 'CLAIM'
      return {
        type,
        amount: '1',
        highNetworkChainId: selectedNetwork.chainId,
        lowNetworkChainId: FAUCET_CHAIN.chainId,
        lowNetworkTimestamp: Date.now() / 1000,
        completionTimestamp: Date.now() / 1000,
        newTransaction: true
      }
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
        setRequesting(false)
        refetchNewNotifications(connectedAccount ?? '')
      },
      onError: (e: Error) => {
        setNetworkError('Something went wrong')
        setRequesting(false)
        console.error('Request failed:', e)
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

      const lastClaimedL3Timestamp = Number(await getFaucetTimestamp(address))

      const faucetTimeInterval = Number(await getFaucetInterval())
      const nextClaimL3Timestamp = lastClaimedL3Timestamp + faucetTimeInterval

      const intervalL3 = timeDifferenceInHoursAndMinutes(Date.now() / 1000, nextClaimL3Timestamp)
      const isAvailableL3 = compareTimestampWithCurrentMoment(nextClaimL3Timestamp)

      const L3 = { interval: intervalL3, nextClaimTimestamp: nextClaimL3Timestamp, isAvailable: isAvailableL3 }
      return { faucetTimeInterval, L3 }
    },
    {
      enabled: !!address
    }
  )

  useEffect(() => {
    if (!nextClaimAvailable.data) {
      return
    }
    const intervalInfo = nextClaimAvailable.data.L3
    if (!intervalInfo.isAvailable) {
      setNextClaimTimestamp(intervalInfo.nextClaimTimestamp)
    }
  }, [nextClaimAvailable.data, chainId])

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
          Request and get <strong> 1{L3_NATIVE_TOKEN_SYMBOL} testnet token </strong> per day to your connected wallet or a another wallet address on G7 network.
        </div>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.addressSelectorContainer}>
          <div className={styles.addressContainer}>
            <div className={styles.label}>Recipient Address</div>
            <input
              placeholder={ZERO_ADDRESS}
              className={styles.address}
              value={selectedAccountType.valueId === 0 ? address : selectedAccountType.value}
              onChange={(e) => {
                setAddress(e.target.value)
              }}
            />
          </div>
          {!connectedAccount ? (
            <>
              <div className={styles.textSeparator}>
                Or
              </div>
              <div className={styles.connectWalletButton} onClick={() => { handleConnect() }}>
                <div className={styles.connectWalletText}>
                  Connect Wallet
                </div>
              </div>
            </>
          ) : (
            <div className={styles.selectorContainer}>
              <div className={styles.label}>Account</div>
              <ValueSelector values={values} selectedValue={selectedAccountType} onChange={handleSelectAccountType} />
            </div>
          )
          }

        </div>
        <div className={styles.requestTokensButton} onClick={() => {
          claim.mutate({ isL2Target: chainId === 13746, address })
        }}>
          <div className={styles.requestTokensButtonText}>
            {requesting ? `Requesting...` : `Request Tokens`}
          </div>
        </div>
      </div>
      {!!networkError && <div className={styles.errorContainer}>{networkError}.</div>}
      {!networkError && nextClaimAvailable.isLoading && (
        <div className={styles.warningContainer}>Checking faucet permissions...</div>
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
