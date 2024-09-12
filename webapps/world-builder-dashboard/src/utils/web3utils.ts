import { HIGH_NETWORKS, LOW_NETWORKS } from '../../constants'
import { ethers } from 'ethers'

export const convertToBigNumber = (numberString: string, precision = 18) => {
  const [integerPart, decimalPart] = numberString.split('.')
  const decimalPartPadded = (decimalPart || '').padEnd(precision, '0')
  const bigNumberString = integerPart + decimalPartPadded
  return ethers.BigNumber.from(bigNumberString)
}

export const getBlockExplorerUrl = (chainId: number | undefined) => {
  const network = [...LOW_NETWORKS, ...HIGH_NETWORKS].find((n) => n.chainId === chainId)
  if (network?.blockExplorerUrls) {
    return network.blockExplorerUrls[0]
  }
}

export const getNetwork = (chainId: number) => {
  return [...LOW_NETWORKS, ...HIGH_NETWORKS].find((n) => n.chainId === chainId)
}

export const tokenTypes = [
  { valueId: '1', displayName: 'Native' },
  { valueId: '20', displayName: 'ERC20' },
  { valueId: '721', displayName: 'ERC721' },
  { valueId: '1155', displayName: 'ERC1155' }
]

export const epochTimes = [
  { valueId: "0", displayName: 'Second(s)', value: 1 },
  { valueId: "1", displayName: 'Minute(s)', value: 60 },
  { valueId: "2", displayName: 'Hour(s)', value: 3600 },
  { valueId: "3", displayName: 'Day(s)', value: 86400 },
  { valueId: "4", displayName: 'Week(s)', value: 608400 },
  { valueId: "5", displayName: 'Month(s) (30 days)', value: 2592000 }
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

  return `${firstDigit}.${remainingDigits}e+${exponent}`
}
