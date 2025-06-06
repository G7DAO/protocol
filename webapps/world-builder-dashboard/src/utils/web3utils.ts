import { getHighNetworks, getLowNetworks, HIGH_NETWORKS, LOW_NETWORKS, USDC, USDC_MAINNET } from '../../constants'
import { ethers } from 'ethers'
import { NetworkInterface, NetworkType } from '@/contexts/BlockchainContext'
import { providers } from 'ethers'
import { TransactionRecord } from './bridge/depositERC20ArbitrumSDK'
import { getTokensForNetwork } from './tokens'
import { DepositDirection } from '@/pages/BridgePage/BridgePage'

export const convertToBigNumber = (numberString: string, precision = 18) => {
  const [integerPart, decimalPart] = numberString.split('.')
  const decimalPartPadded = (decimalPart || '').padEnd(precision, '0')
  const bigNumberString = integerPart + decimalPartPadded
  return ethers.BigNumber.from(bigNumberString)
}

export const getBlockExplorerUrl = (chainId: number | undefined, selectedNetworkType: NetworkType) => {
  const network = [...getLowNetworks(selectedNetworkType) || LOW_NETWORKS, ...getHighNetworks(selectedNetworkType) || HIGH_NETWORKS].find(
    (n) => n.chainId === chainId
  )
  if (network?.blockExplorerUrls) {
    return network.blockExplorerUrls[0]
  }
}

export const getNetwork = (chainId: number, selectedNetworkType: NetworkType) => {
  return [...getLowNetworks(selectedNetworkType) || LOW_NETWORKS, ...getHighNetworks(selectedNetworkType) || HIGH_NETWORKS].find(
    (n) => n.chainId === chainId
  )
}

export const tokenTypes = [
  { value: '1', label: 'Native' },
  { value: '20', label: 'ERC20' },
  { value: '721', label: 'ERC721' },
  { value: '1155', label: 'ERC1155' }
]

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const doesContractExist = async (
  address: string,
  provider: ethers.providers.Provider | null
): Promise<boolean> => {
  const smartContractCode = await provider?.getCode(address)
  return smartContractCode !== '0x'
}

export const formatBigNumber = (bigNumber: ethers.BigNumber, lengthLimit = 25, units = 18) => {
  const formattedString = ethers.utils.formatUnits(bigNumber, units)
  if (formattedString.length < lengthLimit) {
    return formattedString
  }

  const bigNumberString = bigNumber.toString()
  const firstDigit = bigNumberString[0]
  const remainingDigits = bigNumberString.slice(1, 3)
  const exponent = bigNumberString.length - 1 - units

  return `${firstDigit}.${remainingDigits}${exponent > 0 ? 'e+' + exponent : ''}`
}

export const parseUntilDelimiter = (input: any) => {
  const match = input.match(/^[^\(\[]+/)
  return match ? match[0] : input
}

export const fetchTransactionTimestamp = async (completionTxHash: string, rpcUrl: string): Promise<number | null> => {
  try {
    // Initialize the provider with the RPC URL
    const provider = new providers.JsonRpcProvider(rpcUrl)

    // Fetch the transaction receipt
    const receipt = await provider.getTransactionReceipt(completionTxHash)
    if (!receipt) {
      console.warn('Transaction receipt not found for hash:', completionTxHash)
      return null
    }

    // Fetch the block details using the block number from the receipt
    const block = await provider.getBlock(receipt.blockNumber)
    if (!block) {
      console.warn('Block not found for block number:', receipt.blockNumber)
      return null
    }

    // Return the timestamp from the block
    return block.timestamp
  } catch (error) {
    console.error('Error fetching transaction timestamp:', error)
    return null
  }
}

export const getCachedTransactions = (connectedAccount: string, selectedNetworkType: NetworkType) => {
  const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions-${selectedNetworkType}`)
  return transactionsString ? JSON.parse(transactionsString) : []
}

export const saveCachedTransactions = (connectedAccount: string, selectedNetworkType: NetworkType, transactions: TransactionRecord[]) => {
  localStorage.setItem(
    `bridge-${connectedAccount}-transactions-${selectedNetworkType}`,
    JSON.stringify(transactions)
  )
}

export const getAmount = async (transactionHash: string, rpcUrl: string) => {
  const provider = new providers.JsonRpcProvider(rpcUrl)
  try {
    // Retrieve the transaction details
    const transaction = await provider.getTransaction(transactionHash)

    if (!transaction) {
      console.log('Transaction not found')
      return null
    }

    const amount = ethers.utils.formatEther(transaction.value)

    return amount
  } catch (error) {
    console.error('Error retrieving transaction:', error)
    return null
  }
}

export const getTokenSymbol = (
  tx: TransactionRecord,
  connectedAccount: string
): string => {
  let chainId = tx.type === 'DEPOSIT' ? tx.lowNetworkChainId : tx.highNetworkChainId
  let tokens = getTokensForNetwork(chainId, connectedAccount)
  let token = tokens.find(t => t.address.toLowerCase() === tx?.tokenAddress?.toLowerCase())
  if (token === undefined) {
    let chainId = tx.type === 'DEPOSIT' ? tx.highNetworkChainId : tx.lowNetworkChainId
    let tokens = getTokensForNetwork(chainId, connectedAccount)
    token = tokens.find(t => t.address.toLowerCase() === tx?.destinationTokenAddress?.toLowerCase())
  }
  return token?.symbol || tx?.symbol || 'N/A'
}

export const isUSDC = (tokenAddress: string): boolean => {
  const normalizedTokenAddress = tokenAddress.toLowerCase()
  const addressToChainId = Object.fromEntries([
    ...Object.entries(USDC).map(([chainId, address]) => [address.toLowerCase(), chainId]),
    ...Object.entries(USDC_MAINNET).map(([chainId, address]) => [address.toLowerCase(), chainId])
  ])


  return !!addressToChainId[normalizedTokenAddress]
}

export const returnSymbol = (direction: 'DEPOSIT' | 'WITHDRAW', selectedHighChain: NetworkInterface, selectedLowChain: NetworkInterface, tokenSymbol: string) => {
  if (tokenSymbol.startsWith('USDC')) {
    if (direction === 'DEPOSIT' && (selectedHighChain.chainId === 13746 || selectedHighChain.chainId === 2187))
      return 'USDC.e'
    else if (direction === 'WITHDRAW' && (selectedLowChain.chainId === 421614 || selectedLowChain.chainId === 42161))
      return 'USDC'
  }
  return tokenSymbol
}

export const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return formatter.format(value)
}

export const getChallengePeriod = (
  networkType: string,
  tokenSymbol: string,
  chainId: number
): number => {
  if (networkType === 'Testnet') {
    return 60 * 60
  }

  if (chainId === 42161) {
    if (tokenSymbol === 'USDC') {
      return 60 * 15
    }
    return 60 * 60 * 24 * 7
  }

  return 60 * 60
}

export const getProcessingTimeString = (
  direction: DepositDirection,
  networkType: string,
  tokenSymbol: string,
  lowNetworkChainId: number,
  retryableCreationTimeout?: number
): string => {
  if (networkType === 'Mainnet') {
    if (direction === 'DEPOSIT') {
      return `~${Math.floor((retryableCreationTimeout ?? 0) / 60)} min`
    } else {
      if (tokenSymbol === 'USDC' && lowNetworkChainId === 1) {
        return '~15 min'
      } else if (lowNetworkChainId === 1) {
        return '~7 days'
      } else {
        return '~60 min'
      }
    }
  } else {
    if (direction === 'DEPOSIT') {
      return `~${Math.floor((retryableCreationTimeout ?? 0) / 60)} min`
    } else {
      return `~${tokenSymbol === 'USDC' && lowNetworkChainId === 1 ? '15 min' : '60 min'}`
    }
  }
}


export const getBridgeOperationLabel = (
  direction: DepositDirection,
  networkType: string,
  tokenSymbol: string,
  highNetworkChainId: number
): string => {
  if (direction === 'DEPOSIT') {
    return 'Gas requirements may change on the destination chain, requiring manual completion. Check the Activity tab for updates.'
  }

  if (tokenSymbol === 'USDC' && (highNetworkChainId === 42161 || highNetworkChainId === 421614)) {
    return 'Withdrawals available in 15 minutes under the CCTP protocol. Return to claim tokens via the Activity tab once available.'
  }

  const withdrawalTime = highNetworkChainId === 42161 ? '7 days' : '60 minutes'
  const relayText = networkType === 'Mainnet' ? ' or use Relay for immediate withdrawal.' : '.'
  return `Withdrawals available in ${withdrawalTime} due to the challenge period for security. Return to claim tokens via the Activity tab once available${relayText}`
}
