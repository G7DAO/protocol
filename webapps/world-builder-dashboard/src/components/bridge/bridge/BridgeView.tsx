// Libraries
import { useEffect, useState } from 'react'
import {
  DEFAULT_STAKE_NATIVE_POOL_ID,
  L1_MAIN_NETWORK,
  L1_NETWORK,
  L2_MAIN_NETWORK,
  L2_NETWORK,
  L3_MAIN_NETWORK,
  L3_NETWORK
} from '../../../../constants'
// Styles and Icons
import styles from './BridgeView.module.css'
import { ethers } from 'ethers'
// G7 SDK
import { Bridger, getBridger } from 'game7-bridge-sdk'
// Components
import ActionButton from '@/components/bridge/bridge/ActionButton'
import BridgeMessage from '@/components/bridge/bridge/BridgeMessage'
import NetworkSelector from '@/components/bridge/bridge/NetworkSelector'
import TransactionSummary from '@/components/bridge/bridge/TransactionSummary'
import ValueToBridge from '@/components/bridge/bridge/ValueToBridge'
// Blockchain Context and Utility Functions
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useUISettings } from '@/contexts/UISettingsContext'
import useTokenInformation from '@/hooks/useBalance'
import { useCoinGeckoAPI } from '@/hooks/useCoinGeckoAPI'
// Hooks and Constants
import { DepositDirection } from '@/pages/BridgePage/BridgePage'
import { getStakeNativeTxData } from '@/utils/bridge/stakeContractInfo'
import { getTokensForNetwork, Token } from '@/utils/tokens'
import { useBridger } from '@/hooks/useBridger'
import IconAlertCircle from '@/assets/IconAlertCircle'
import { Tooltip } from 'summon-ui/mantine'

const BridgeView = ({
  direction,
  setDirection
}: {
  direction: DepositDirection
  setDirection: (arg0: DepositDirection) => void
}) => {
  const [value, setValue] = useState('0')
  const [message, setMessage] = useState<{ destination: string; data: string }>({ destination: '', data: '' })
  const [isMessageExpanded, setIsMessageExpanded] = useState(false)
  const [inputErrorMessages, setInputErrorMessages] = useState({ value: '', data: '', destination: '' })
  const [networkErrorMessage, setNetworkErrorMessage] = useState('')
  const { isMessagingEnabled } = useUISettings()
  const { useUSDPriceOfToken } = useCoinGeckoAPI()
  const {
    connectedAccount,
    selectedLowNetwork,
    setSelectedLowNetwork,
    selectedHighNetwork,
    setSelectedHighNetwork,
    setSelectedBridgeToken,
    selectedBridgeToken,
    selectedNetworkType,
    setSelectedNativeToken,
    selectedNativeToken
  } = useBlockchainContext()

  const { isFetching: isFetchingTokenInformation, data: tokenInformation } = useTokenInformation({
    account: connectedAccount,
    token: selectedBridgeToken
  })

  const nativeToken = getTokensForNetwork(selectedLowNetwork.chainId, connectedAccount).find(
    (token) => token.symbol === selectedHighNetwork.nativeCurrency?.symbol
  ) ?? null

  const { data: nativeTokenInformation } = useTokenInformation({
    account: connectedAccount,
    token: nativeToken
  })

  const { data: coinUSDRate, isFetching: isCoinFetching } = useUSDPriceOfToken(selectedBridgeToken?.geckoId ?? '')
  const { data: ethRate } = useUSDPriceOfToken('ethereum')
  const handleTokenChange = async (token: Token) => {
    setSelectedBridgeToken(token)
  }
  const { getEstimatedFee, useAllowances } = useBridger()

  const [bridger, setBridger] = useState<Bridger | null>(null)


  const estimatedFee = getEstimatedFee({
    bridger,
    value,
    direction,
    selectedLowNetwork,
    selectedHighNetwork,
    tokenInformation
  })

  const {
    data: allowances,
    isLoading: isLoadingAllowances
  } = useAllowances({
    bridger,
    direction,
    selectedLowNetwork,
    selectedHighNetwork,
    connectedAccount: connectedAccount ?? ''
  })
  useEffect(() => {
    if (selectedBridgeToken && connectedAccount && selectedHighNetwork && selectedLowNetwork) {
      const originChainId = direction === 'DEPOSIT' ? selectedLowNetwork.chainId : selectedHighNetwork.chainId
      const destinationChainId = direction === 'DEPOSIT' ? selectedHighNetwork.chainId : selectedLowNetwork.chainId
      const chainIds = Object.keys(selectedBridgeToken.tokenAddressMap)
      if (!chainIds.includes(String(destinationChainId))) {
        return
      }
      try {
        if (direction === 'DEPOSIT') {
          const token = getTokensForNetwork(selectedLowNetwork.chainId, connectedAccount).find(
            (token) => token.symbol === selectedLowNetwork.nativeCurrency?.symbol
          ) ?? null
          setSelectedNativeToken(token)
        } else if (direction === 'WITHDRAW') {
          const token = getTokensForNetwork(selectedHighNetwork.chainId, connectedAccount).find(
            (token) => token.symbol === selectedLowNetwork.nativeCurrency?.symbol
          ) ?? null
          setSelectedNativeToken(token)
        }
        const _bridger: Bridger = getBridger(originChainId, destinationChainId, selectedBridgeToken.tokenAddressMap)
        setBridger(_bridger)

      } catch (e) {
        console.error(e)
        setNetworkErrorMessage('Cannot bridge between these 2 networks')
      }
    }
  }, [selectedBridgeToken, connectedAccount, selectedHighNetwork, selectedLowNetwork])

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
          direction={direction}
          networks={selectedNetworkType === 'Testnet' ? [L1_NETWORK, L2_NETWORK] : [L1_MAIN_NETWORK, L2_MAIN_NETWORK]}
          selectedNetwork={selectedLowNetwork}
          onChange={setSelectedLowNetwork}
        />
      )
    } else {
      return (
        <NetworkSelector
          networks={selectedNetworkType === 'Testnet' ? [L2_NETWORK, L3_NETWORK] : [L2_MAIN_NETWORK, L3_MAIN_NETWORK]}
          selectedNetwork={selectedHighNetwork}
          onChange={setSelectedHighNetwork}
          direction={direction}
        />
      )
    }
  }

  return (
    <div className={styles.container}>
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
        symbol={tokenInformation?.symbol ?? ''}
        value={value}
        setValue={setValue}
        onTokenChange={handleTokenChange}
        balance={tokenInformation?.tokenBalance}
        rate={
          selectedBridgeToken?.symbol === 'TG7T' || selectedBridgeToken?.symbol === 'G7'
            ? 1
            : isCoinFetching
              ? 0.0
              : coinUSDRate[selectedBridgeToken?.geckoId ?? '']
                ? coinUSDRate[selectedBridgeToken?.geckoId ?? ''].usd
                : 0
        }
        isFetchingBalance={isFetchingTokenInformation}
        errorMessage={inputErrorMessages.value}
        setErrorMessage={(msg) => setInputErrorMessages((prev) => ({ ...prev, value: msg }))}
        selectedChainId={direction === 'DEPOSIT' ? selectedLowNetwork.chainId : selectedHighNetwork.chainId}
        gasFee={estimatedFee.data?.parentFee ?? ""}
      />
      {direction === 'DEPOSIT' &&
        selectedLowNetwork.chainId === L2_NETWORK.chainId &&
        isMessagingEnabled &&
        selectedNetworkType === 'Testnet' && (
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
        address={connectedAccount}
        nativeBalance={Number(nativeTokenInformation?.tokenBalance)}
        transferTime={
          direction === 'DEPOSIT'
            ? `~${Math.floor((selectedLowNetwork.retryableCreationTimeout ?? 0) / 60)} min`
            : `~${Math.floor((selectedHighNetwork.challengePeriod ?? 0) / 60)} min`
        }
        fee={Number(estimatedFee.data?.parentFee ?? 0)}
        childFee={Number(estimatedFee.data?.childFee ?? 0)}
        isEstimatingFee={estimatedFee.isFetching}
        value={Number(value)}
        ethRate={ethRate?.ethereum?.usd ?? 0}
        tokenRate={
          selectedBridgeToken?.symbol === 'TG7T' || selectedBridgeToken?.symbol === 'G7'
            ? 1
            : isCoinFetching
              ? 0.0
              : coinUSDRate && selectedBridgeToken?.geckoId && coinUSDRate[selectedBridgeToken.geckoId]
                ? coinUSDRate[selectedBridgeToken.geckoId]?.usd ?? 0
                : 0
        }
        tokenSymbol={tokenInformation?.symbol ?? ''}
        gasNativeTokenSymbol={
          selectedNativeToken?.symbol ?? ''
        }
        gasChildNativeTokenSymbol={
          selectedHighNetwork.nativeCurrency?.symbol ?? ''
        }
        selectedLowChain={selectedLowNetwork}
        selectedHighChain={selectedHighNetwork}

      />
      {networkErrorMessage && <div className={styles.networkErrorMessage}>{networkErrorMessage}</div>}
      {<div className={styles.manualGasMessageContainer}>
        <div className={styles.manualGasMessageText}>
          Claim transaction may be required on {selectedHighNetwork.displayName}
        </div>
        <Tooltip
          multiline
          radius={'8px'}
          arrowSize={8}
          withArrow
          arrowOffset={14}
          events={{ hover: true, focus: true, touch: true }}
          label='Gas requirements may change on the destination chain, requiring manual completion. Check the Activity tab for updates.'
        >
          <IconAlertCircle stroke='#FFFAEB' height={16} width={16} />
        </Tooltip>
      </div>}
      <ActionButton
        direction={direction}
        amount={value ?? '0'}
        isDisabled={!!inputErrorMessages.value || !!inputErrorMessages.destination || !!inputErrorMessages.data}
        setErrorMessage={setNetworkErrorMessage}
        L2L3message={isMessageExpanded ? message : { data: '', destination: '' }}
        bridger={bridger}
        symbol={tokenInformation?.symbol ?? ''}
        decimals={tokenInformation?.decimalPlaces ?? 18}
        balance={tokenInformation?.tokenBalance}
        nativeBalance={nativeTokenInformation?.tokenBalance}
        gasFees={[estimatedFee.data?.parentFee ?? '', estimatedFee.data?.childFee ?? '']}
        bridgeAllowance={allowances?.bridgeTokenAllowance ?? null}
        nativeAllowance={allowances?.nativeTokenAllowance ?? null}
        isLoadingAllowances={isLoadingAllowances}
      />
    </div>
  )
}

export default BridgeView
