// Libraries
import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import {
  DEFAULT_STAKE_NATIVE_POOL_ID,
  L1_NETWORK,
  L2_NETWORK,
  L3_NATIVE_TOKEN_SYMBOL,
  L3_NETWORK
} from '../../../../constants'
// Styles and Icons
import styles from './BridgeView.module.css'
import { ethers } from 'ethers'
import ActionButton from '@/components/bridge/bridge/ActionButton'
import BridgeMessage from '@/components/bridge/bridge/BridgeMessage'
// Components
import NetworkSelector from '@/components/bridge/bridge/NetworkSelector'
import TransactionSummary from '@/components/bridge/bridge/TransactionSummary'
import ValueToBridge from '@/components/bridge/bridge/ValueToBridge'
// Blockchain Context and Utility Functions
import { HighNetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
// Hooks and Constants
import useERC20Balance from '@/hooks/useERC20Balance'
import useEthUsdRate from '@/hooks/useEthUsdRate'
import useNativeBalance from '@/hooks/useNativeBalance'
import { DepositDirection } from '@/pages/BridgePage/BridgePage'
import { estimateDepositERC20ToNativeFee } from '@/utils/bridge/depositERC20ToNative'
import { getStakeNativeTxData } from '@/utils/bridge/stakeContractInfo'
import { estimateWithdrawFee } from '@/utils/bridge/withdrawNativeToken'

const BridgeView = ({
  direction,
  setDirection
}: {
  direction: DepositDirection
  setDirection: (arg0: DepositDirection) => void
}) => {
  const [value, setValue] = useState('0')
  const [message, setMessage] = useState<{ destination: string; data: string }>({ destination: '', data: '' })
  const [inputErrorMessages, setInputErrorMessages] = useState({ value: '', data: '', destination: '' })
  const [networkErrorMessage, setNetworkErrorMessage] = useState('')

  const g7tUsdRate = useQuery(['rate'], () => 0)
  const { data: ethUsdRate } = useEthUsdRate()
  const { connectedAccount, selectedLowNetwork, setSelectedLowNetwork, selectedHighNetwork, setSelectedHighNetwork } =
    useBlockchainContext()
  const { data: lowNetworkBalance, isFetching: isFetchingLowNetworkBalance } = useERC20Balance({
    tokenAddress: selectedLowNetwork.g7TokenAddress,
    account: connectedAccount,
    rpc: selectedLowNetwork.rpcs[0]
  })
  const { data: highNetworkBalance, isFetching: isFetchingHighNetworkBalance } = useERC20Balance({
    tokenAddress: selectedHighNetwork.g7TokenAddress,
    account: connectedAccount,
    rpc: selectedHighNetwork.rpcs[0]
  })
  const { data: l3NativeBalance, isFetching: isFetchingL3NativeBalance } = useNativeBalance({
    account: connectedAccount,
    rpc: L3_NETWORK.rpcs[0]
  })
  const { data: lowNetworkNativeBalance } = useNativeBalance({
    account: connectedAccount,
    rpc: selectedLowNetwork.rpcs[0]
  })

  const { data: highNetworkNativeBalance } = useNativeBalance({
    account: connectedAccount,
    rpc: selectedHighNetwork.rpcs[0]
  })

  const estimatedFee = useQuery(['estimatedFee', value, direction, selectedHighNetwork], async () => {
    if (!connectedAccount) {
      return
    }
    let est
    if (direction === 'DEPOSIT') {
      est = await estimateDepositERC20ToNativeFee(
        value,
        connectedAccount,
        selectedLowNetwork,
        selectedHighNetwork as HighNetworkInterface
      )
    } else {
      est = await estimateWithdrawFee(value, connectedAccount, selectedLowNetwork)
    }
    return est
  })

  useEffect(() => {
    setNetworkErrorMessage('')
  }, [selectedHighNetwork, selectedLowNetwork, value])

  useEffect(() => {
    if (message.data === 'stake') {
      if (!L3_NETWORK.staker) {
        console.log('staker is undefined')
        return
      }
      setDataForStake(L3_NETWORK.staker)
    }
  }, [message, value])

  const setDataForStake = async (destination: string) => {
    const data = await getStakeNativeTxData(destination, ethers.BigNumber.from(DEFAULT_STAKE_NATIVE_POOL_ID), value)
    if (data) {
      setMessage({ destination, data })
      setInputErrorMessages({ ...inputErrorMessages, data: '', destination: '' })
    }
  }

  const renderNetworkSelect = (isSource: boolean, direction: 'DEPOSIT' | 'WITHDRAW') => {
    if ((isSource && direction === 'DEPOSIT') || (!isSource && direction === 'WITHDRAW')) {
      return (
        <NetworkSelector
          networks={[L1_NETWORK, L2_NETWORK]}
          selectedNetwork={selectedLowNetwork}
          onChange={setSelectedLowNetwork}
        />
      )
    } else {
      return (
        <NetworkSelector
          networks={[L2_NETWORK, L3_NETWORK]}
          selectedNetwork={selectedHighNetwork}
          onChange={setSelectedHighNetwork}
        />
      )
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <div className={styles.title}>Transfer Assets</div>
        <div className={styles.subtitle}>Move your assets between different layers</div>
      </div>
      <div className={styles.directionContainer}>
        <button
          className={direction === 'DEPOSIT' ? styles.selectedDirectionButton : styles.directionButton}
          onClick={() => setDirection('DEPOSIT')}
        >
          Deposit
        </button>
        <button
          className={direction === 'WITHDRAW' ? styles.selectedDirectionButton : styles.directionButton}
          onClick={() => setDirection('WITHDRAW')}
        >
          Withdraw
        </button>
      </div>
      <div className={styles.networksContainer}>
        <div className={styles.networkSelect}>
          <label htmlFor='network-select-from' className={styles.label}>
            From
          </label>
          {renderNetworkSelect(true, direction)}
        </div>
        <div className={styles.networkSelect}>
          <label htmlFor='network-select-to' className={styles.label}>
            To
          </label>
          {renderNetworkSelect(false, direction)}
        </div>
      </div>
      <ValueToBridge
        symbol={L3_NATIVE_TOKEN_SYMBOL}
        value={value}
        setValue={setValue}
        balance={
          direction === 'DEPOSIT'
            ? lowNetworkBalance ?? '0'
            : (selectedHighNetwork.chainId === L3_NETWORK.chainId ? l3NativeBalance : highNetworkBalance) ?? '0'
        }
        rate={g7tUsdRate.data ?? 0}
        isFetchingBalance={
          direction === 'DEPOSIT'
            ? isFetchingLowNetworkBalance
            : selectedHighNetwork.chainId === L3_NETWORK.chainId
              ? isFetchingL3NativeBalance
              : isFetchingHighNetworkBalance
        }
        errorMessage={inputErrorMessages.value}
        setErrorMessage={(msg) => setInputErrorMessages((prev) => ({ ...prev, value: msg }))}
      />
      {direction === 'DEPOSIT' && selectedLowNetwork.chainId === L2_NETWORK.chainId && (
        <BridgeMessage
          message={message}
          setMessage={(newMessage) => {
            setMessage((prev) => ({ ...prev, ...newMessage }))
          }}
          errors={inputErrorMessages}
          setErrors={(newErrors) => {
            setInputErrorMessages((prev) => ({ ...prev, ...newErrors }))
          }}
        />
      )}
      <TransactionSummary
        direction={direction}
        gasBalance={Number((direction === 'DEPOSIT' ? lowNetworkNativeBalance : highNetworkNativeBalance) ?? 0)}
        address={connectedAccount ?? '0x'}
        transferTime={
          direction === 'DEPOSIT'
            ? `~${Math.floor((selectedLowNetwork.retryableCreationTimeout ?? 0) / 60)} min`
            : `~${Math.floor((selectedHighNetwork.challengePeriod ?? 0) / 60)} min`
        }
        fee={Number(estimatedFee.data ?? 0)}
        isEstimatingFee={estimatedFee.isFetching}
        value={Number(value)}
        ethRate={ethUsdRate ?? 0}
        tokenSymbol={L3_NATIVE_TOKEN_SYMBOL}
        tokenRate={g7tUsdRate.data ?? 0}
        gasTokenSymbol={
          direction === 'DEPOSIT'
            ? selectedLowNetwork.nativeCurrency?.symbol ?? ''
            : selectedHighNetwork.nativeCurrency?.symbol ?? ''
        }
      />
      {networkErrorMessage && <div className={styles.networkErrorMessage}>{networkErrorMessage}</div>}
      <ActionButton
        direction={direction}
        amount={value}
        isDisabled={!!inputErrorMessages.value || !!inputErrorMessages.destination || !!inputErrorMessages.data}
        setErrorMessage={setNetworkErrorMessage}
        L2L3message={message}
      />
    </div>
  )
}

export default BridgeView
