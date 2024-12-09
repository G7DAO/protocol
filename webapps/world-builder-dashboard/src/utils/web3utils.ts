import { getHighNetworks, getLowNetworks, HIGH_NETWORKS, LOW_NETWORKS } from '../../constants'
import { ethers } from 'ethers'
import { NetworkType } from '@/contexts/BlockchainContext'
import { providers } from 'ethers'

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