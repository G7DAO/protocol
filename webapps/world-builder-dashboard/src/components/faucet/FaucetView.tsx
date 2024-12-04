import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { FAUCET_CHAIN, getNetworks, L3_NATIVE_TOKEN_SYMBOL, L3_NETWORK } from '../../../constants'
import { AccountType } from '../commonComponents/accountSelector/AccountSelector'
import AccountSelector from '../commonComponents/accountSelector/AccountSelector'
import styles from './FaucetView.module.css'
import { ethers } from 'ethers'
import { useMediaQuery } from 'summon-ui/mantine'
import { NetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { useUISettings } from '@/contexts/UISettingsContext'
import { useFaucetAPI } from '@/hooks/useFaucetAPI'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { timeDifferenceInHoursAndMinutes, timeDifferenceInHoursMinutesAndSeconds } from '@/utils/timeFormat'
import { useNavigate } from 'react-router-dom'

interface FaucetViewProps {}
const FaucetView: React.FC<FaucetViewProps> = ({}) => {
  const [address, setAddress] = useState<string | undefined>('')
  const [isValidAddress, setIsValidAddress] = useState<boolean>(false)
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkInterface>(L3_NETWORK)
  const { useFaucetInterval, useFaucetTimestamp } = useFaucetAPI()
  const { connectedAccount, connectWallet, chainId, selectedNetworkType } = useBlockchainContext()
  const [animatedInterval, setAnimatedInterval] = useState('')
  const [nextClaimTimestamp, setNextClaimTimestamp] = useState(0)
  const [networkError, setNetworkError] = useState('')
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('Connected Account')
  const [requestDisabled, setRequestDisabled] = useState<boolean>(true)
  const { faucetTargetChainId } = useUISettings()
  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const smallView = useMediaQuery('(max-width: 1199px)')
  const navigate = useNavigate()

  const values: AccountType[] = [`External Address`, `Connected Account`]
  const networks = getNetworks(selectedNetworkType)

  if (selectedNetworkType === 'Mainnet') {
    navigate('/bridge')
  }


  useEffect(() => {
    const targetNetwork = networks?.find((n) => n.chainId === faucetTargetChainId)
    if (targetNetwork) {
      setSelectedNetwork(targetNetwork)
    }

    if (connectedAccount) {
      if (selectedAccountType === 'External Address') {
        setSelectedAccountType('Connected Account')
      }

      if (address !== connectedAccount) {
        setAddress(connectedAccount)
      }
    } else if (selectedAccountType === 'External Address' || !connectedAccount) {
      if (address !== '') {
        setAddress('')
      }
    }
  }, [faucetTargetChainId, connectedAccount])

  useEffect(() => {
    setNetworkError('')
    if (!connectedAccount) setSelectedAccountType('External Address')
  }, [connectedAccount])

  const handleConnect = async () => {
    if (!connectedAccount) connectWallet()
  }

  const handleSelectAccountType = (selectedAccountType: AccountType) => {
    if (selectedAccountType === 'External Address') setAddress('')
    else setAddress(connectedAccount)
    setSelectedAccountType(selectedAccountType)
    setNetworkError('')
  }

  const queryClient = useQueryClient()
  const claim = useMutation(
    async ({ address }: { isL2Target: boolean; address: string | undefined }) => {
      const res = await fetch(`https://api.game7.build/faucet/request/${address}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`)
      }
      const data = await res.json()
      setNetworkError('')
      const type: 'CLAIM' | 'DEPOSIT' | 'WITHDRAWAL' = 'CLAIM'
      return {
        type,
        amount: '1',
        highNetworkChainId: selectedNetwork.chainId,
        lowNetworkChainId: FAUCET_CHAIN.chainId,
        lowNetworkTimestamp: Date.now() / 1000,
        completionTimestamp: Date.now() / 1000,
        highNetworkHash: data.result,
        newTransaction: true
      }
    },
    {
      onSuccess: (data: TransactionRecord | undefined, { address }) => {
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions-${selectedNetworkType}`)

          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          transactions.push({ ...data })
          localStorage.setItem(`bridge-${connectedAccount}-transactions-${selectedNetworkType}`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        const lastClaimTimestamp = Date.now() / 1000
        const faucetInterval = faucetIntervalQuery.data ? Number(faucetIntervalQuery.data) : 0
        const nextClaimL3Timestamp = lastClaimTimestamp + faucetInterval

        const intervalL3 = timeDifferenceInHoursAndMinutes(Date.now() / 1000, nextClaimL3Timestamp)
        const isAvailableL3 = false

        const updatedL3 = {
          interval: intervalL3,
          nextClaimTimestamp: nextClaimL3Timestamp,
          isAvailable: isAvailableL3
        }

        queryClient.setQueryData(['nextFaucetClaimTimestamp', address], (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              L3: updatedL3 // Update the L3 data
            }
          }
          return { faucetTimeInterval: faucetInterval, L3: updatedL3 }
        })

        queryClient.invalidateQueries(['faucetTimestamp', address])
        queryClient.refetchQueries(['notifications'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.refetchQueries(['ERC20balance'])
        refetchNewNotifications(address ?? '')
      },
      onError: (error) => {
        setNetworkError('Something went wrong')
        console.log(error)
        console.error('Error requesting tokens:', error)
      }
    }
  )

  function compareTimestampWithCurrentMoment(unixTimestamp: number): boolean {
    const timestampInMillis = unixTimestamp * 1000
    const currentInMillis = Date.now()

    return timestampInMillis <= currentInMillis
  }

  const lastClaimedTimestampQuery = useFaucetTimestamp(address)
  const faucetIntervalQuery = useFaucetInterval()

  const nextClaimAvailable = useQuery(
    ['nextFaucetClaimTimestamp', address],
    async () => {
      const lastClaimedL3Timestamp = lastClaimedTimestampQuery.data ? Number(lastClaimedTimestampQuery.data) : 0
      const faucetTimeInterval = Number(faucetIntervalQuery.data)
      const nextClaimL3Timestamp = lastClaimedL3Timestamp + faucetTimeInterval

      const intervalL3 = timeDifferenceInHoursAndMinutes(Date.now() / 1000, nextClaimL3Timestamp)
      const isAvailableL3 = lastClaimedL3Timestamp === 0 || compareTimestampWithCurrentMoment(nextClaimL3Timestamp)
      const L3 = { interval: intervalL3, nextClaimTimestamp: nextClaimL3Timestamp, isAvailable: isAvailableL3 }
      return { faucetTimeInterval, L3 }
    },
    {
      enabled: !!address && !!faucetIntervalQuery.data && !!lastClaimedTimestampQuery.data
    }
  )
  
  useEffect(() => {
    let isButtonDisabled = true

    const isNewAccount = nextClaimAvailable.status === 'idle' && lastClaimedTimestampQuery.data === 0

    if (isNewAccount) {
      isButtonDisabled = false
    } else {
      if (!nextClaimAvailable.data) {
        isButtonDisabled = true
      } else {
        isButtonDisabled =
          (selectedNetwork.chainId === L3_NETWORK.chainId &&
            nextClaimAvailable.data &&
            !nextClaimAvailable.data.L3.isAvailable) ||
          ((!isValidAddress || address === '') && selectedAccountType === 'External Address') ||
          claim.isLoading
      }
    }
    setRequestDisabled(isButtonDisabled)
  }, [
    selectedNetwork.chainId,
    nextClaimAvailable.data,
    nextClaimAvailable.status,
    isValidAddress,
    address,
    selectedAccountType,
    claim.isLoading,
    lastClaimedTimestampQuery.status
  ])

  useEffect(() => {
    if (!nextClaimAvailable.data) return
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
        <div className={styles.title}>G7 Sepolia Faucet</div>
        <div className={styles.supportingText}>
          Request <strong> 1 {L3_NATIVE_TOKEN_SYMBOL} token </strong> to your connected wallet or an external address on G7 Sepolia.
        </div>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.addressSelectorContainer}>
          <div className={styles.addressContainer}>
            <div className={styles.label}>Recipient Address</div>
            <input
              placeholder='Wallet address'
              className={styles.address}
              value={address}
              disabled={!!connectedAccount && selectedAccountType === 'Connected Account'}
              onChange={(e) => {
                setAddress(e.target.value)
                if (ethers.utils.isAddress(e.target.value)) setIsValidAddress(true)
                else setIsValidAddress(false)
              }}
            />
          </div>
          {!connectedAccount ? (
            <>
              <div className={styles.textSeparator}>
                {smallView ? (
                  <>
                    <div className={styles.bar} />
                    <span>Or</span>
                    <div className={styles.bar} />
                  </>
                ) : (
                  'Or'
                )}
              </div>
              <div
                className={styles.connectWalletButton}
                onClick={() => {
                  handleConnect()
                }}
              >
                <div className={styles.connectWalletText}>Connect Wallet</div>
              </div>
            </>
          ) : (
            <div className={styles.selectorContainer}>
              <div className={styles.label}>Account</div>
              <AccountSelector
                values={values}
                selectedValue={values.find((value) => selectedAccountType === value)!}
                onChange={handleSelectAccountType}
              />
            </div>
          )}
        </div>
        {!!networkError && <div className={styles.errorContainer}>{networkError}.</div>}
        {!networkError && nextClaimAvailable.isLoading && (
          <div className={styles.warningContainer}>Checking faucet permissions...</div>
        )}
        {selectedNetwork.chainId === L3_NETWORK.chainId &&
          nextClaimAvailable.data &&
          !nextClaimAvailable.data.L3.isAvailable && (
            <div className={styles.availableFundsContainer}>
              {`You requested funds recently. Come back in `}{' '}
              <span className={styles.time}>{` ${animatedInterval}`}</span>
            </div>
          )}
        <button
          className={requestDisabled ? styles.requestTokensButtonDisabled : styles.requestTokensButton}
          onClick={() => {
            claim.mutateAsync({ isL2Target: chainId === 13746, address })
          }}
          disabled={requestDisabled}
        >
          <div className={styles.requestTokensButtonText}>{claim.isLoading ? `Requesting...` : `Request Tokens`}</div>
        </button>
      </div>
    </div>
  )
}

export default FaucetView
