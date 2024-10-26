import React, { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import {useQuery, useMutation, useQueryClient} from 'react-query'

import styles from './BridgeView.module.css'
import { useWallet } from '../contexts/WalletContext'
import {ETH, faucets, getRPC, L1_NETWORK, L2_NETWORK, L3_NETWORK, NETWORKS, TG7T} from '../networks'
import WalletConnection from './WalletConnection'
import IconEdit02 from '../assets/IconEdit02.tsx'
import Documentation from './Documentation.tsx'
import TransferStatus from './TransferStatus.tsx'
import {BridgeNetwork, BridgeToken, Bridger, BridgeTransferInfo, TokenAddressMap} from "game7-bridge-sdk";
import IconBookOpen from "../assets/IconBookOpen.tsx";
import {BridgeTransfer} from "game7-bridge-sdk/dist/bridgeTransfer";
import BridgeTransferView from "./BridgeTransferView.tsx";
import IconRoute from "../assets/IconRoute.tsx";


const BridgerView = ({ bridger, amount, hoveredItem }: { bridger: Bridger; amount?: ethers.BigNumber; hoveredItem: string }) => {
  const { account, getSigner } = useWallet()
  const originRpc = useMemo(() => getRPC(bridger.originNetwork.chainId), [bridger.originNetwork.chainId])
  const destinationRpc = useMemo(() => getRPC(bridger.destinationNetwork.chainId), [bridger.destinationNetwork.chainId])

  const [text, setText] = useState(
    `${bridger.isDeposit ? 'Deposit ' : 'Withdraw '}to ${bridger.destinationNetwork.name}`
  )
  const [hoverText, setHoverText] = useState('')

  const originalText = `${bridger.isDeposit ? 'Deposit ' : 'Withdraw '}to ${bridger.destinationNetwork.name}`

  const fee = useQuery(
    ['fee', bridger, account],
    async () => {
      try {
        const fee = await bridger.getGasAndFeeEstimation(amount ?? ethers.utils.parseEther('0'), originRpc, account)
        const feeFormatted = ethers.utils.formatEther(fee.estimatedFee)
        setHoverText(
          `Estimated fee: ${feeFormatted ?? "can't fetch"}${feeFormatted ? ` ${bridger.originNetwork.nativeCurrency?.symbol ?? ''} ` : ''}`
        )
        return ethers.utils.formatEther(fee.estimatedFee)
      } catch (e) {
        setHoverText(`Estimated fee: can't fetch`)
      }
    },
    {
      enabled: !!account && !!originRpc
    }
  )



  const queryClient = useQueryClient()
  const transfer = useMutation({
    mutationFn: async (amount: string) => {
      const network = NETWORKS.find((n) => n.chainId === bridger.originNetwork.chainId)
      const signer = await getSigner(network)
      const destinationRPC = getRPC(bridger.destinationNetwork.chainId)
      const destinationProvider = new ethers.providers.JsonRpcProvider(destinationRPC) as ethers.providers.Provider
      return bridger.transfer({ amount: ethers.utils.parseUnits(amount), signer, destinationProvider })
    },
    onSuccess: (data) => {
      const record = {txHash: data.hash, originNetworkChainId: bridger.originNetwork.chainId, destinationNetworkChainId: bridger.destinationNetwork.chainId}
      const historyJSON = localStorage.getItem(`${account}-bridge_0.0.1`)
      let history
      try {
        if (!historyJSON) {
          history = []
        } else {
          history = JSON.parse(historyJSON)
        }
        history.push(record)
        localStorage.setItem(`${account}-bridge_0.0.1`, JSON.stringify(history))
      } catch (e) {
        console.error('writing to the local storage failed', e)
      }
      queryClient.invalidateQueries('history')
    }
  })

  const handleTransferClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement; // Cast e.target to HTMLElement
    const amount = prompt('Amount')
    if (amount) {
      transfer.mutate(amount)
    }
  }

  const handleMouseEnter = () => {
    setText(hoverText)
  }

  const handleMouseLeave = () => {
    setText(originalText)
  }

  return (
    <div
      className={`${bridger.isDeposit ? styles.bridgerContainerDeposit : styles.bridgerContainerWithdrawal} ${hoveredItem === 'bridger' && bridger.originNetwork.chainId === 11155111 ? styles.scaled : ''}`}
      onMouseUp={(e) => handleTransferClick(e)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.runwayLights}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((_, idx) => (
          <div
            className={styles.light}
            key={idx}
            style={{ animationDelay: `${(bridger.isDeposit ? idx : 6 - idx) * 50}ms` }}
          >{`${bridger.isDeposit ? '>' : '<'}`}</div>
        ))}
      </div>
      {transfer.isLoading ? (
        <div className={styles.spinner} />
      ) : (
        <div className={styles.bridgerFee}>
          {originalText}<br />
          {hoverText}
          {/*{`Estimated fee: ${fee.data ?? "can't fetch"}${fee.data ? ` ${bridger.originNetwork.nativeCurrency?.symbol ?? ''} ` : ''}`}*/}
        </div>
      )}
      <div className={styles.runwayLights}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((_, idx) => (
          <div
            className={styles.light}
            key={idx}
            style={{ animationDelay: `${(bridger.isDeposit ? idx : 6 - idx) * 50}ms` }}
          >{`${bridger.isDeposit ? '>' : '<'}`}</div>
        ))}
      </div>
    </div>
  )
}

const Token = ({ token, hoveredItem, historyInfo }: { token: BridgeToken; hoveredItem: string; historyInfo: BridgeTransferInfo[] }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const rpc = getRPC(token.chainId)

  const { account, getSigner } = useWallet()

  const symbol = useQuery(
    ['symbol', token],
    () => {
      return token.getSymbol(rpc)
    },
    {
      enabled: !!rpc && !!token.tokenAddresses[token.chainId],
      onError: (error) => {
        console.error('Failed to fetch token balance:', error)
      },
      refetchInterval: false
    }
  )
  const balance = useQuery(
    ['balance', token.chainId, account, token.tokenAddresses],
    () => {
      return token.getBalance(rpc, account)
    },
    {
      enabled: !!rpc && !!account && !!token.tokenAddresses[token.chainId],
      refetchInterval: 60000,
      onError: (error) => {
        console.error('Failed to fetch token symbol:', error)
      }
    }
  )

  const bridger = token.bridgers.find((b) => b.isDeposit)

  const allowance = useQuery(
    ['allowance', bridger, account],
    async () => {
      if (!bridger) {
        return
      }
      const allowance = await bridger.getAllowance(rpc, account)
      if (allowance) {
        return ethers.utils.formatEther(allowance)
      }
    },
    {
      enabled: !!rpc && !!account
    }
  )

  const approveAllowance = useMutation({
    mutationFn: async (amount: string) => {
      if (!bridger) {
        throw new Error('no bridger')
      }
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

  if (!token.tokenAddresses[token.chainId]) {
    return <></>
  }

  const getFaucet = (token: BridgeToken) => {
    const faucetToken = faucets[token.address]
    if (faucetToken) {
      return faucetToken[token.chainId]
    }
  }

  useEffect(() => {
    console.log({historyInfo})
  }, [historyInfo]);

  return (
    <div className={styles.tokenContainer}>
      <div className={styles.tokenBalance}>
        <div className={styles.tokenHeader}>

          <div
              className={styles.tokenSymbol}
          >{`${symbol.data ? symbol.data : ''}${token.tokenAddresses[token.chainId] === ethers.constants.AddressZero ? ' (native)' : ` ${token.address.slice(0, 6)}...${token.address.slice(-4)}`}`}</div>
          <div className={styles.bookIcon} onClick={() => setIsHistoryOpen(!isHistoryOpen)}>{isHistoryOpen ? <IconRoute /> : <IconBookOpen/>}</div>
        </div>
        <div className={styles.allowance}>
          <div
              className={styles.tokenBalanceNumber}
          >{`Balance: ${balance.data ? ethers.utils.formatEther(balance.data) : ''}`}</div>
          {getFaucet(token) && <a style={{ marginRight: '8px', color: '#dcc9d4'}} href={getFaucet(token)} target={'_blank'}>{'+'}</a>}
        </div>
        {allowance.data && (
            <div className={styles.allowance}>
          <div className={`${styles.tokenBalanceNumber} ${hoveredItem === 'allowance' && token.chainId === 11155111 ? styles.scaled : ''}`}>{`Deposit allowance: ${allowance.data ?? ''}`}</div>
            <IconEdit02
              id={'editAllowanceButton'}
              onClick={handleApproveClick}
              className={`${styles.editIcon} ${hoveredItem === 'editAllowance' && token.chainId === 11155111 ? styles.scaled20p : ''}`}
            />
        </div>
            )}
      </div>

      {isHistoryOpen ? (<div className={styles.historyContainer}>

        {historyInfo.map((transfer) => <BridgeTransferView info={transfer} token={token} isIncome={transfer.destinationNetworkChainId === token.chainId} /> )}
      </div>
          ) :(
      <div className={styles.bridgers}>
        {token.bridgers.map((b, idx) => (
          <BridgerView bridger={b} key={idx} hoveredItem={hoveredItem}/>
        ))}
      </div>
      )}
    </div>
  )
}

const Network = ({ network, hoveredItem, historyInfo }: { network: BridgeNetwork; hoveredItem: string; historyInfo: BridgeTransferInfo[] }) => {
  const { account } = useWallet()
  const rpc = useMemo(() => {
    const found = NETWORKS.find((n) => n.chainId === network.chainId)?.rpcs[0]
    if (!found) {
      console.error(`RPC missing for network chain ID ${network.chainId}`)
    }
    return found
  }, [network.chainId])

  const isTokenTransferred = (
      info: BridgeTransferInfo,
      tokenMaps: TokenAddressMap[],
      tokenAddress: string
  ) => {

    let identifiedToken: string | undefined;
    let originTokenAddress = info.tokenOriginAddress;
    let destinationTokenAddress = info.tokenDestinationAddress;

    for (const [tokenName, tokenMap] of Object.entries(tokenMaps)) {
      if (info.tokenOriginAddress && tokenMap[info.originNetworkChainId].toLowerCase() === info.tokenOriginAddress.toLowerCase()) {
        identifiedToken = tokenName;
        break;
      }
      if (info.tokenDestinationAddress && tokenMap[info.destinationNetworkChainId].toLowerCase() === info.tokenDestinationAddress.toLowerCase()) {
        identifiedToken = tokenName;
        break;
      }
    }
    if (info.destinationNetworkChainId === 421614) {
      console.log(originTokenAddress, destinationTokenAddress, identifiedToken, tokenAddress, tokenMaps)
    }
    if (identifiedToken) {
      const tokenMap = tokenMaps[identifiedToken];
      if (!originTokenAddress) {
        originTokenAddress = tokenMap[info.originNetworkChainId];
      }
      if (!destinationTokenAddress) {
        destinationTokenAddress = tokenMap[info.destinationNetworkChainId];
      }
    }
    return tokenAddress.toLowerCase() === originTokenAddress?.toLowerCase() || tokenAddress.toLowerCase() === destinationTokenAddress?.toLowerCase();
  }

  useEffect(() => {
    console.log({network: network.name, historyInfo, tokens: network.tokens})
  }, [historyInfo]);

  return (
    <div className={styles.networkContainer}>
      <div
        className={`${styles.networkName} ${hoveredItem === 'networkConstructor' && network.name === 'Sepolia' ? styles.scaled : ''}`}
      >
        {network.name}
      </div>
      {network.tokens.map((t, idx) => (
        <Token historyInfo={historyInfo.filter((transfer) => isTokenTransferred(transfer, [TG7T, ETH], t.address))} hoveredItem={hoveredItem} token={t} key={idx} />
      ))}
    </div>
  )
}

const BridgeView = () => {
  const networks = [L1_NETWORK, L2_NETWORK, L3_NETWORK].map((n) => new BridgeNetwork(n.chainId, [TG7T, ETH]))
  const { account } = useWallet()

  const history = useQuery(["history", account], async () => {
    const historyJSON = localStorage.getItem(`${account}-bridge_0.0.1`)
    let history
    try {
      history = JSON.parse(historyJSON)
    } catch (e) {
      console.error("can't read transfers history", e)
    }
    return history
  })

  const historyInfo = useQuery(["historyInfo", account, history.data], async () => {
    const bridgers = history.data?.map((transfer) => new BridgeTransfer({txHash: transfer.txHash, destinationNetworkChainId: transfer.destinationNetworkChainId, originNetworkChainId: transfer.originNetworkChainId}))
    if (!bridgers) {
      return
    }
    const results =  await Promise.allSettled(bridgers.map(bridger => bridger.getInfo()));
    return results.filter((res) => res.status === 'fulfilled').map((res: any) => res?.value)
  }, {
    enabled: !!history.data,
    onSuccess: (data: any) => {
      console.log(data)
    }
  })

  const [hoveredItem, setHoveredItem] = useState('')
  useEffect(() => {
    console.log(hoveredItem)
  }, [hoveredItem])
  return (
    <div>
      {!account ? (
        <WalletConnection />
      ) : (
        <div className={styles.container}>
          <Documentation setHoveredItem={setHoveredItem} />
          <div className={styles.networksContainer}>
            {networks.map((network) => (
              <Network historyInfo={historyInfo.data?.filter((transfer) => transfer.destinationNetworkChainId === network.chainId || transfer.originNetworkChainId === network.chainId) ?? []} hoveredItem={hoveredItem} network={network} key={network.chainId} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BridgeView
