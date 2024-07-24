import { HIGH_NETWORKS, LOW_NETWORKS } from '../../constants'
import { ethers } from 'ethers'

export const convertToBigNumber = (numberString: string, precision = 18) => {
  const [integerPart, decimalPart] = numberString.split('.')
  const decimalPartPadded = (decimalPart || '').padEnd(precision, '0')
  const bigNumberString = integerPart + decimalPartPadded
  return ethers.BigNumber.from(bigNumberString)
}

export const getBlockExplorerUrl = (chainId: number) => {
  const network = [...LOW_NETWORKS, ...HIGH_NETWORKS].find((n) => n.chainId === chainId)
  if (network?.blockExplorerUrls) {
    return network.blockExplorerUrls[0]
  }
}

export const getNetwork = (chainId: number) => {
  return [...LOW_NETWORKS, ...HIGH_NETWORKS].find((n) => n.chainId === chainId)
}
