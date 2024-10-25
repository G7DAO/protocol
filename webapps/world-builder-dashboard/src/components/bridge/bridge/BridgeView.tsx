// Libraries
import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { DEFAULT_STAKE_NATIVE_POOL_ID, L1_NETWORK, L2_NETWORK, L3_NETWORK } from '../../../../constants'
// Styles and Icons
import styles from './BridgeView.module.css'
import { ethers } from 'ethers'
// G7 SDK
import { Bridger, getProvider } from 'game7-bridge-sdk'
// Components
import ActionButton from '@/components/bridge/bridge/ActionButton'
import BridgeMessage from '@/components/bridge/bridge/BridgeMessage'
import NetworkSelector from '@/components/bridge/bridge/NetworkSelector'
import TransactionSummary from '@/components/bridge/bridge/TransactionSummary'
import ValueToBridge from '@/components/bridge/bridge/ValueToBridge'
// Blockchain Context and Utility Functions
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useUISettings } from '@/contexts/UISettingsContext'
// Hooks and Constants
import useERC20Balance from '@/hooks/useERC20Balance'
import useEthUsdRate from '@/hooks/useEthUsdRate'
import useNativeBalance from '@/hooks/useNativeBalance'
import useTokenBalance from '@/hooks/useTokenBalance'
import { DepositDirection } from '@/pages/BridgePage/BridgePage'
import { getStakeNativeTxData } from '@/utils/bridge/stakeContractInfo'
import { Token } from '@/utils/tokens'

const BridgeView = ({
  direction,
  setDirection
}: {
  direction: DepositDirection
  setDirection: (arg0: DepositDirection) => void
}) => {
  const [bridger, setBridger] = useState<Bridger>()
  const [balance, setBalance] = useState<number | null>(null)
  const [value, setValue] = useState('0')
  const [message, setMessage] = useState<{ destination: string; data: string }>({ destination: '', data: '' })
  const [isMessageExpanded, setIsMessageExpanded] = useState(false)
  const [inputErrorMessages, setInputErrorMessages] = useState({ value: '', data: '', destination: '' })
  const [networkErrorMessage, setNetworkErrorMessage] = useState('')
  const { isMessagingEnabled } = useUISettings()
  const g7tUsdRate = useQuery(['rate'], () => 2501.32)
  const { data: ethUsdRate } = useEthUsdRate()
  const {
    connectedAccount,
    selectedLowNetwork,
    setSelectedLowNetwork,
    selectedHighNetwork,
    setSelectedHighNetwork,
    setSelectedBridgeToken,
    selectedBridgeToken
  } = useBlockchainContext()

  const { isFetching: isFetchingLowNetworkBalance } = useERC20Balance({
    tokenAddress: selectedLowNetwork.g7TokenAddress,
    account: connectedAccount,
    rpc: selectedLowNetwork.rpcs[0]
  })
  const { isFetching: isFetchingHighNetworkBalance } = useERC20Balance({
    tokenAddress: selectedHighNetwork.g7TokenAddress,
    account: connectedAccount,
    rpc: selectedHighNetwork.rpcs[0]
  })
  const { isFetching: isFetchingL3NativeBalance } = useNativeBalance({
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

  const { balance: tokenBalance } = useTokenBalance(
    selectedBridgeToken?.address || '',
    selectedBridgeToken?.rpc || '',
    connectedAccount
  )

  const handleTokenChange = (token: Token) => {
    setSelectedBridgeToken(token)
  }

  const estimatedFee = useQuery(
    ['estimatedFee', bridger, connectedAccount],
    async () => {
      try {
        const fee = await bridger?.getGasAndFeeEstimation(
          value ? ethers.utils.parseEther(value) : ethers.utils.parseEther('0.0'),
          selectedLowNetwork.rpcs[0],
          connectedAccount!
        )
        const feeFormatted = ethers.utils.formatEther(fee?.estimatedFee || '')
        return feeFormatted
      } catch (e) {
        console.error(e)
      }
    },
    {
      enabled: !!connectedAccount && !!selectedLowNetwork && !!bridger
    }
  )

  useEffect(() => {
    if (selectedBridgeToken && connectedAccount && selectedHighNetwork && selectedLowNetwork) {
      setBalance(Number(tokenBalance))
      const originChainId = direction === 'DEPOSIT' ? selectedLowNetwork.chainId : selectedHighNetwork.chainId
      const destinationChainId = direction === 'DEPOSIT' ? selectedHighNetwork.chainId : selectedLowNetwork.chainId
      const chainIds = Object.keys(selectedBridgeToken.tokenAddressMap)

      // TODO: get predicted address
      // const getPredictedAddress = async () => {
      //   const arbitrumBridger = new Erc20Bridger(networks[13746])
      //   const childAddress = await arbitrumBridger.getChildErc20Address(
      //     selectedBridgeToken.tokenAddressMap[selectedLowNetwork.chainId],
      //     getProvider(selectedBridgeToken.rpc[0])
      //   )
      //   console.log(childAddress)
      //   return childAddress
      // }

      if (!chainIds.includes(String(destinationChainId))) {
        return
      }
      const bridger: Bridger = new Bridger(originChainId, destinationChainId, selectedBridgeToken.tokenAddressMap)
      setBridger(bridger)
    }
  }, [selectedBridgeToken, balance, connectedAccount, selectedHighNetwork, selectedLowNetwork])

  useEffect(() => {
    setNetworkErrorMessage('')
  }, [selectedHighNetwork, selectedLowNetwork, value])

  useEffect(() => {
    if (message.data === 'stake') {
      if (!L3_NETWORK.staker) {
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
          selectedToken={selectedBridgeToken}
        />
      )
    } else {
      return (
        <NetworkSelector
          networks={[L2_NETWORK, L3_NETWORK]}
          selectedNetwork={selectedHighNetwork}
          onChange={setSelectedHighNetwork}
          selectedToken={selectedBridgeToken}
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
        symbol={selectedBridgeToken?.symbol ?? ''}
        value={value}
        setValue={setValue}
        onTokenChange={handleTokenChange}
        balance={tokenBalance}
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
        selectedChainId={direction === 'DEPOSIT' ? selectedLowNetwork.chainId : selectedHighNetwork.chainId}
      />
      {direction === 'DEPOSIT' && selectedLowNetwork.chainId === L2_NETWORK.chainId && isMessagingEnabled && (
        <BridgeMessage
          isExpanded={isMessageExpanded}
          setIsExpanded={setIsMessageExpanded}
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
        address={connectedAccount}
        transferTime={
          direction === 'DEPOSIT'
            ? `~${Math.floor((selectedLowNetwork.retryableCreationTimeout ?? 0) / 60)} min`
            : `~${Math.floor((selectedHighNetwork.challengePeriod ?? 0) / 60)} min`
        }
        fee={Number(estimatedFee.data ?? 0)}
        isEstimatingFee={estimatedFee.isFetching}
        value={Number(value)}
        ethRate={ethUsdRate ?? 0}
        tokenSymbol={selectedBridgeToken?.symbol || ''}
        tokenRate={g7tUsdRate.data ?? 0}
        gasTokenSymbol={selectedBridgeToken?.symbol ?? ''}
      />
      {networkErrorMessage && <div className={styles.networkErrorMessage}>{networkErrorMessage}</div>}
      <ActionButton
        direction={direction}
        amount={isNaN(Number(value)) ? 0 : Number(value)}
        isDisabled={!!inputErrorMessages.value || !!inputErrorMessages.destination || !!inputErrorMessages.data}
        setErrorMessage={setNetworkErrorMessage}
        L2L3message={isMessageExpanded ? message : { data: '', destination: '' }}
        bridger={bridger}
        symbol={selectedBridgeToken?.symbol}
      />
    </div>
  )
}

export default BridgeView
