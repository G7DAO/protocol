import React, { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { useQuery, useMutation } from 'react-query'

import styles from './BridgeView.module.css'
import { useWallet } from '../contexts/WalletContext'
import {ETH, faucets, getRPC, L1_NETWORK, L2_NETWORK, L3_NETWORK, NETWORKS, TG7T} from '../networks'
import WalletConnection from './WalletConnection'
import IconEdit02 from '../assets/IconEdit02.tsx'
import Documentation from './Documentation.tsx'
import TransferStatus from './TransferStatus.tsx'
import {BridgeNetwork, BridgeToken, Bridger} from "game7-bridge-sdk";
import IconBookOpen from "../assets/IconBookOpen.tsx";


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

  const transfer = useMutation({
    mutationFn: async (amount: string) => {
      const network = NETWORKS.find((n) => n.chainId === bridger.originNetwork.chainId)
      const signer = await getSigner(network)
      const destinationRPC = getRPC(bridger.destinationNetwork.chainId)
      const destinationProvider = new ethers.providers.JsonRpcProvider(destinationRPC) as ethers.providers.Provider
      return bridger.transfer({ amount: ethers.utils.parseUnits(amount), signer, destinationProvider })
    },
    onSuccess: (data) => {
      console.log(data)
      //0x5ce56d7cf0554bec609e995f3f3e98ad495a08fe29e66b91a9d951840fce6674
      // 0x68bb539766ba5fcc6eba8536eaa5ac3f7e346e2eab8b6ebbaa9a976d6b8786ec
      //0x630d46c87e1df9ab91b8f6311b711033fc11b95ef3487135af5e0726506f4135
      // 0xc2c6cff17958df71b2507aa41393d9085ad4492b631271a590fdc7a834cb4275 L2->L3
      // 0x9a0d867b6523f1d55bbb0d1b16779c5cb433744f646bd9209f382142bb10ec06 L2->L1
      // 0x4f7aaf3d84d69a27123523deb85827982143c83fe6862eb1dca8c5ebef369740 L3->L2
      // 0x4d011728e4b8002750a0dcb8f2b18d7f17a08c278acda381d26d6eb9c460157f L3->L2
      // 0x8460187b8602c2cf2436f7821836c9097182d550a31cefaa07fb6352c013981e L2->L3
      // 0x6db1d677bc87d64d0adf0ef89d059e0a6b9a8f765af5dc0d2977f9d87aaf8677 L2->L1 ETH
      // 0xb5ba500f030e662a3bd4742c8f090b819881c508c9b748d699cf7820253afea8 L2->L1 ETH
      // 0x5311d470b7956262ad3329ea75bebb9fc01d9f07dde419e4dbcddae440215415 L2->L1 TG7T
      // 0x3b3581e5000f84ddfd22e61e6a800a01ceba6246fb2042816967a0034978e9ec L2->L1 TG7T
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

const Token = ({ token, hoveredItem }: { token: BridgeToken; hoveredItem: string }) => {
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

  return (
    <div className={styles.tokenContainer}>
      <div className={styles.tokenBalance}>
        <div className={styles.tokenHeader}>

          <div
              className={styles.tokenSymbol}
          >{`${symbol.data ? symbol.data : ''}${token.tokenAddresses[token.chainId] === ethers.constants.AddressZero ? ' (native)' : ` ${token.address.slice(0, 6)}...${token.address.slice(-4)}`}`}</div>
          <div className={styles.bookIcon}><IconBookOpen/></div>
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
      <div className={styles.bridgers}>
        {token.bridgers.map((b, idx) => (
          <BridgerView bridger={b} key={idx} hoveredItem={hoveredItem}/>
        ))}
      </div>
    </div>
  )
}

const Network = ({ network, hoveredItem }: { network: BridgeNetwork; hoveredItem: string }) => {
  const { account } = useWallet()
  const rpc = useMemo(() => {
    const found = NETWORKS.find((n) => n.chainId === network.chainId)?.rpcs[0]
    if (!found) {
      console.error(`RPC missing for network chain ID ${network.chainId}`)
    }
    return found
  }, [network.chainId])

  return (
    <div className={styles.networkContainer}>
      <div
        className={`${styles.networkName} ${hoveredItem === 'networkConstructor' && network.name === 'Sepolia' ? styles.scaled : ''}`}
      >
        {network.name}
      </div>
      {network.tokens.map((t, idx) => (
        <Token hoveredItem={hoveredItem} token={t} key={idx} />
      ))}
    </div>
  )
}

const BridgeView = () => {
  const networks = [L1_NETWORK, L2_NETWORK, L3_NETWORK].map((n) => new BridgeNetwork(n.chainId, [TG7T, ETH]))
  const { account } = useWallet()

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
              <Network hoveredItem={hoveredItem} network={network} key={network.chainId} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BridgeView
