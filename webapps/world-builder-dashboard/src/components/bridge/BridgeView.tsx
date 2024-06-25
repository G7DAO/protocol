// Libraries
import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { L2_CHAIN, L3_NATIVE_TOKEN_SYMBOL } from '../../../constants'
// Styles and Icons
import styles from './BridgeView.module.css'
import { Icon } from 'summon-ui'
import IconArbitrumOne from '@/assets/IconArbitrumOne'
import ActionButton from '@/components/bridge/ActionButton'
// Blockchain Context and Utility Functions
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import HistoryHeader from '@/components/bridge/HistoryHeader'
// Components
import NetworkSelector from '@/components/bridge/NetworkSelector'
import TransactionSummary from '@/components/bridge/TransactionSummary'
import ValueToBridge from '@/components/bridge/ValueToBridge'
import { estimateDepositFee } from '@/components/bridge/depositERC20'
import { L3_NETWORKS } from '@/components/bridge/l3Networks'
import { estimateWithdrawFee } from '@/components/bridge/withdrawNativeToken'
import useERC20Balance from '@/hooks/useERC20Balance'
// Hooks and Constants
import useEthUsdRate from '@/hooks/useEthUsdRate'
import { useL2ToL1MessagesStatus, useMessages } from '@/hooks/useL2ToL1MessageStatus'
import useNativeBalance from '@/hooks/useNativeBalance'

const BridgeView: React.FC = () => {
  const [direction, setDirection] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT')
  const [value, setValue] = useState('0')
  const l2networks = ['Arbitrum Sepolia']

  // const [selectedNetwork, setSelectedNetwork] = useState<L3NetworkConfiguration>(L3_NETWORKS[0]);
  const g7tUsdRate = useQuery(['rate'], () => 31166.75)
  const { data: ethUsdRate } = useEthUsdRate()
  const { L2Provider, connectedAccount, tokenAddress, L2_RPC, selectedL3Network, setSelectedL3Network } =
    useBlockchainContext()
  const { data: l2Balance, isFetching: isFetchingL2Balance } = useERC20Balance({
    tokenAddress,
    account: connectedAccount,
    rpc: L2_RPC
  })
  const { data: l3NativeBalance, isFetching: isFetchingL3NativeBalance } = useNativeBalance({
    account: connectedAccount,
    rpc: selectedL3Network.chainInfo.rpcs[0]
  })
  const { data: l2NativeBalance } = useNativeBalance({ account: connectedAccount, rpc: L2_RPC })

  useEffect(() => {}, [l3NativeBalance])

  const messages = useMessages(connectedAccount, L2_CHAIN)
  const transactions = useL2ToL1MessagesStatus(messages.data)

  const estimatedFee = useQuery(['estimatedFee', value, direction], async () => {
    if (!connectedAccount) {
      return
    }
    let est
    if (direction === 'DEPOSIT') {
      est = await estimateDepositFee(value, connectedAccount, selectedL3Network)
    } else {
      if (L2Provider) {
        est = await estimateWithdrawFee(value, connectedAccount, L2Provider)
      }
    }
    return est
  })

  const renderNetworkSelect = (isSource: boolean, direction: 'DEPOSIT' | 'WITHDRAW') => {
    if ((isSource && direction === 'DEPOSIT') || (!isSource && direction === 'WITHDRAW')) {
      return (
        <div className={styles.network}>
          <IconArbitrumOne />
          {l2networks[0]}
        </div>
      )
    } else {
      return (
        <NetworkSelector networks={L3_NETWORKS} selectedNetwork={selectedL3Network} onChange={setSelectedL3Network} />
      )
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '56px' }}>
      {/*<HistoryHeader messages={transactions ? transactions?.filter((t) => t).map((t) => t.data) : undefined} />*/}
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
          <Icon name={'ArrowRight'} top={'12px'} color={'#667085'} />
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
          balance={direction === 'DEPOSIT' ? l2Balance ?? '0' : l3NativeBalance ?? '0'}
          rate={g7tUsdRate.data ?? 0}
          isFetchingBalance={direction === 'DEPOSIT' ? isFetchingL2Balance : isFetchingL3NativeBalance}
        />
        <TransactionSummary
          direction={direction}
          gasBalance={Number((direction === 'DEPOSIT' ? l2NativeBalance : l3NativeBalance) ?? 0)}
          address={connectedAccount ?? '0x'}
          transferTime={direction === 'DEPOSIT' ? '< min' : '~15 min'}
          fee={Number(estimatedFee.data ?? 0)}
          value={Number(value)}
          ethRate={ethUsdRate ?? 0}
          tokenSymbol={L3_NATIVE_TOKEN_SYMBOL}
          tokenRate={g7tUsdRate.data ?? 0}
        />
        <ActionButton direction={direction} l3Network={selectedL3Network} amount={value} />
      </div>
    </div>
  )
}

export default BridgeView
