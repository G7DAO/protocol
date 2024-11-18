import { getHighNetworks, getLowNetworks } from '../../constants'
import { ethers } from 'ethers'

export const convertToBigNumber = (numberString: string, precision = 18) => {
  const [integerPart, decimalPart] = numberString.split('.')
  const decimalPartPadded = (decimalPart || '').padEnd(precision, '0')
  const bigNumberString = integerPart + decimalPartPadded
  return ethers.BigNumber.from(bigNumberString)
}

export const getBlockExplorerUrl = (chainId: number | undefined) => {
  const network = [...getLowNetworks(), ...getHighNetworks()].find((n) => n.chainId === chainId)
  if (network?.blockExplorerUrls) {
    return network.blockExplorerUrls[0]
  }
}

export const getNetwork = (chainId: number) => {
  return [...getLowNetworks(), ...getHighNetworks()].find((n) => n.chainId === chainId)
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

  return `${firstDigit}.${remainingDigits}e+${exponent}`
}

export const parseUntilDelimiter = (input: any) => {
  const match = input.match(/^[^\(\[]+/)
  return match ? match[0] : input
}
