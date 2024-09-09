import React, { useMemo } from 'react'
import { ethers } from 'ethers'
import { useQuery, useMutation } from 'react-query'

import styles from './BridgeView.module.css'
import { useWallet } from '../contexts/WalletContext'
import { getRPC, L1_NETWORK, L2_NETWORK, L3_NETWORK, NETWORKS, TG7T } from '../networks'
import WalletConnection from './WalletConnection'
import { BridgeNetwork } from 'game7-bridge-sdk/dist/bridgeNetwork'
import { BridgeToken } from 'game7-bridge-sdk/dist/bridgeToken'
import Bridger from 'game7-bridge-sdk/dist/bridger'

const BridgerView = ({ bridger }: { bridger: Bridger }) => {
  const { account, getSigner } = useWallet()
  const rpc = useMemo(() => getRPC(bridger.originNetwork.chainId), [bridger.originNetwork.chainId])
  const fee = useQuery(
    ['fee', bridger, account],
    async () => {
      // let retryableGasOverrides?: GasOverrides;

      const fee = await bridger.getGasAndFeeEstimation(ethers.BigNumber.from(0), rpc, account)
      return ethers.utils.formatEther(fee.estimatedFee)
    },
    {
      enabled: !!account && !!rpc
    }
  )
  const allowance = useQuery(
    ['allowance', bridger, account],
    async () => {
      const allowance = await bridger.getAllowance(rpc, account)
      if (allowance) {
        return ethers.utils.formatEther(allowance)
      }
      return allowance
    },
    {
      enabled: !!rpc && !!account
    }
  )

  const approveAllowance = useMutation({
    mutationFn: async (amount: string) => {
      const network = NETWORKS.find((n) => n.chainId === bridger.originNetwork.chainId)
      const signer = await getSigner(network)
      return bridger.approve(ethers.utils.parseUnits(amount), signer)
    }
  })
  const handleApproveClick = () => {
    const amount = prompt('New allowance')
    if (amount) {
      approveAllowance.mutate(amount)
    }
  }

  const transfer = useMutation({
    mutationFn: async (amount: string) => {
      const network = NETWORKS.find((n) => n.chainId === bridger.originNetwork.chainId)
      const signer = await getSigner(network)
      return bridger.transfer({ amount: ethers.utils.parseUnits(amount), signer: signer })
    },
    onSuccess: (data) => {
      console.log(data)
      //0x5ce56d7cf0554bec609e995f3f3e98ad495a08fe29e66b91a9d951840fce6674
      // 0x68bb539766ba5fcc6eba8536eaa5ac3f7e346e2eab8b6ebbaa9a976d6b8786ec
      //0x630d46c87e1df9ab91b8f6311b711033fc11b95ef3487135af5e0726506f4135
    }
  })

  const handleTransferClick = () => {
    const amount = prompt('Amount')
    if (amount) {
      transfer.mutate(amount)
    }
  }

  return (
    <div className={styles.bridgerContainer}>
      <div className={styles.bridgerDirection}>
        {`${bridger.isDeposit ? 'deposit to' : 'withdrawal to'} ${bridger.destinationNetwork.name}`}
      </div>
      <div className={styles.bridgerAllowance}>
        <div
          className={styles.bridgerAllowanceText}
        >{`Approved allowance: ${allowance.data ?? (allowance.data === null ? 'not needed' : "can't fetch")}`}</div>
        {allowance.data !== null && (
          <button className={styles.bridgerApproveButton} onClick={handleApproveClick}>
            Change
          </button>
        )}
      </div>
      <div className={styles.bridgerFee}>
        {`Estimated fee: ${fee.data ?? "can't fetch"}${fee.data ? ` ${bridger.originNetwork.nativeCurrency?.symbol ?? ''} ` : ''}`}
      </div>
      <button className={styles.bridgerApproveButton} onClick={handleTransferClick}>
        Transfer
      </button>
    </div>
  )
}

const Token = ({ token }: { token: BridgeToken }) => {
  const rpc = getRPC(token.chainId)

  const { account } = useWallet()

  const symbol = useQuery(
    ['symbol', token],
    () => {
      return token.getSymbol(rpc)
    },
    {
      enabled: !!rpc,
      onError: (error) => {
        console.error('Failed to fetch token balance:', error)
      },
      refetchInterval: false
    }
  )
  const balance = useQuery(
    ['balance', token.chainId, account],
    () => {
      return token.getBalance(rpc, account)
    },
    {
      enabled: !!rpc && !!account,
      refetchInterval: 60000,
      onError: (error) => {
        console.error('Failed to fetch token symbol:', error)
      }
    }
  )
  return (
    <div className={styles.tokenContainer}>
      <div className={styles.tokenSymbol}>{symbol.data ? symbol.data : ''}</div>
      <div className={styles.tokenSymbol}>{balance.data ? ethers.utils.formatEther(balance.data) : ''}</div>
      {token.bridgers.map((b, idx) => (
        <BridgerView bridger={b} key={idx} />
      ))}
    </div>
  )
}

const Network = ({ network }: { network: BridgeNetwork }) => {
  const { account } = useWallet()
  const rpc = useMemo(() => {
    const found = NETWORKS.find((n) => n.chainId === network.chainId)?.rpcs[0]
    if (!found) {
      console.error(`RPC missing for network chain ID ${network.chainId}`)
    }
    return found
  }, [network.chainId])

  const balance = useQuery(
    ['gasBalance', network.chainId, account],
    async () => {
      if (!account || !rpc) {
        return
      }
      const provider = new ethers.providers.JsonRpcProvider(rpc) as ethers.providers.Provider
      const balance = await network.getGasBalance(provider, account)
      return ethers.utils.formatEther(balance)
    },
    {
      enabled: !!account && !!rpc
    }
  )
  return (
    <div className={styles.networkContainer}>
      <div className={styles.networkName}>{network.name}</div>
      <div className={styles.networkNativeTokenSymbol}>{network.symbol}</div>
      <div className={styles.networkNativeTokenBalance}>{balance.data ?? '-'}</div>
      {network.tokens.map((t, idx) => (
        <Token token={t} key={idx} />
      ))}
    </div>
  )
}

const BridgeView = () => {
  const networks = [L1_NETWORK, L2_NETWORK, L3_NETWORK].map((n) => new BridgeNetwork(n.chainId, [TG7T]))

  return (
    <div>
      <WalletConnection />
      <div className={styles.container}>
        {networks.map((network) => (
          <Network network={network} key={network.chainId} />
        ))}
      </div>
    </div>
  )
}

export default BridgeView
