import { useQuery } from 'react-query'
import { L1_NETWORK } from '../../constants'
import { ethers } from 'ethers'

const ETH_USD_CONTRACT_ADDRESS = '0x694AA1769357215DE4FAC081bf1f309aDC325306'
const ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      {
        internalType: 'uint80',
        name: 'roundId',
        type: 'uint80'
      },
      {
        internalType: 'int256',
        name: 'answer',
        type: 'int256'
      },
      {
        internalType: 'uint256',
        name: 'startedAt',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'updatedAt',
        type: 'uint256'
      },
      {
        internalType: 'uint80',
        name: 'answeredInRound',
        type: 'uint80'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]

type LatestRoundData = {
  roundId: bigint
  answer: bigint
  startedAt: bigint
  updatedAt: bigint
  answeredInRound: bigint
} & [bigint, bigint, bigint, bigint, bigint]

const useEthUsdRate = () => {
  return useQuery('ethUsdRate', async () => {
    const provider = new ethers.providers.JsonRpcProvider(L1_NETWORK.rpcs[0])
    const contract = new ethers.Contract(ETH_USD_CONTRACT_ADDRESS, ABI, provider)
    return contract.latestRoundData().then((data: LatestRoundData) => Number(data.answer) / 1e8)
  })
}

export default useEthUsdRate
