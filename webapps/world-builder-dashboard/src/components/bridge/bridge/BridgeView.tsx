// Libraries
import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import {
  DEFAULT_STAKE_NATIVE_POOL_ID,
  getNetworks,
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
import { Bridger } from 'game7-bridge-sdk'
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
import { Token } from '@/utils/tokens'

const BridgeView = ({
  direction,
  setDirection
}: {
  direction: DepositDirection
  setDirection: (arg0: DepositDirection) => void
}) => {
  const [bridger, setBridger] = useState<Bridger>()

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
    selectedNetworkType
  } = useBlockchainContext()

  const { isFetching: isFetchingTokenInformation, data: tokenInformation } = useTokenInformation({
    account: connectedAccount,
    token: selectedBridgeToken
  })

  const { data: coinUSDRate, isFetching: isCoinFetching } = useUSDPriceOfToken(selectedBridgeToken.geckoId ?? '')
  const handleTokenChange = async (token: Token) => {
    setSelectedBridgeToken(token)
  }

  const networks = getNetworks(selectedNetworkType)

  const estimatedFee = useQuery(
    ['estimatedFee', bridger, connectedAccount, value],
    async () => {
      try {
        const originNetwork = networks?.find((n) => n.chainId === bridger?.originNetwork.chainId)
        if (!originNetwork) throw new Error("Can't find network!")

        const allowance = await bridger?.getAllowance(originNetwork.rpcs[0], connectedAccount ?? '')
        const decimals = tokenInformation?.decimalPlaces ?? 18
        const parsedValue = value ? ethers.utils.parseUnits(value, decimals) : ethers.utils.parseEther('0')

        let approvalFee = ethers.utils.parseEther('0') // Default to zero if no approval needed
        let transferFee = ethers.utils.parseEther('0') // Default to zero

        if (allowance?.lt(parsedValue)) {
          const approvalEstimate = await bridger?.getApprovalGasAndFeeEstimation(
            parsedValue,
            originNetwork.rpcs[0],
            connectedAccount ?? ''
          )
          approvalFee = approvalEstimate?.estimatedFee ?? ethers.utils.parseEther('0')
        }

        const transferEstimate = await bridger?.getGasAndFeeEstimation(
          ethers.utils.parseEther('0.0'),
          direction === 'DEPOSIT' ? selectedLowNetwork.rpcs[0] : selectedHighNetwork.rpcs[0],
          connectedAccount ?? ''
        )

        transferFee = transferEstimate?.estimatedFee ?? ethers.utils.parseEther('0')
        const finalFee = approvalFee.add(transferFee)
        return ethers.utils.formatEther(finalFee)
      } catch (e) {
        console.error(e)
        throw e
      }
    },
    {
      enabled: !!connectedAccount && !!selectedLowNetwork && !!selectedHighNetwork && !!value,
      onError: (error) => {
        console.error('Error refetching fee:', error)
      }
    }
  )

  useEffect(() => {
    if (selectedBridgeToken && connectedAccount && selectedHighNetwork && selectedLowNetwork) {
      const originChainId = direction === 'DEPOSIT' ? selectedLowNetwork.chainId : selectedHighNetwork.chainId
      const destinationChainId = direction === 'DEPOSIT' ? selectedHighNetwork.chainId : selectedLowNetwork.chainId
      const chainIds = Object.keys(selectedBridgeToken.tokenAddressMap)

      if (!chainIds.includes(String(destinationChainId))) {
        return
      }
      try {
        const _bridger: Bridger = new Bridger(originChainId, destinationChainId, selectedBridgeToken.tokenAddressMap)
        setBridger(_bridger)
      } catch (e) {
        console.log(e)
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
        symbol={tokenInformation?.symbol ?? ''}
        value={value}
        setValue={setValue}
        onTokenChange={handleTokenChange}
        balance={tokenInformation?.tokenBalance}
        rate={
          selectedBridgeToken.symbol === 'TG7T' || selectedBridgeToken.symbol === 'G7'
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
        gasBalance={Number(tokenInformation?.tokenBalance)}
        address={connectedAccount}
        transferTime={
          direction === 'DEPOSIT'
            ? `~${Math.floor((selectedLowNetwork.retryableCreationTimeout ?? 0) / 60)} min`
            : `~${Math.floor((selectedHighNetwork.challengePeriod ?? 0) / 60)} min`
        }
        fee={Number(estimatedFee.data ?? 0)}
        isEstimatingFee={estimatedFee.isFetching}
        value={Number(value)}
        ethRate={
          selectedBridgeToken.symbol === 'TG7T' || selectedBridgeToken.symbol === 'G7'
            ? 1
            : isCoinFetching
              ? 0.0
              : coinUSDRate[selectedBridgeToken?.geckoId ?? ''].usd
        }
        tokenSymbol={tokenInformation?.symbol ?? ''}
        tokenRate={
          selectedBridgeToken.symbol === 'TG7T' || selectedBridgeToken.symbol === 'G7'
            ? 1
            : isCoinFetching
              ? 0.0
              : coinUSDRate[selectedBridgeToken?.geckoId ?? ''].usd
        }
        gasTokenSymbol={
          direction === 'DEPOSIT'
            ? (selectedLowNetwork?.nativeCurrency?.symbol ?? '')
            : (selectedHighNetwork?.nativeCurrency?.symbol ?? '')
        }
      />
      {networkErrorMessage && <div className={styles.networkErrorMessage}>{networkErrorMessage}</div>}
      <ActionButton
        direction={direction}
        amount={value ?? '0'}
        isDisabled={!!inputErrorMessages.value || !!inputErrorMessages.destination || !!inputErrorMessages.data}
        setErrorMessage={setNetworkErrorMessage}
        L2L3message={isMessageExpanded ? message : { data: '', destination: '' }}
        bridger={bridger}
        symbol={tokenInformation?.symbol ?? ''}
        decimals={tokenInformation?.decimalPlaces ?? 18}
      />
    </div>
  )
}

export default BridgeView
