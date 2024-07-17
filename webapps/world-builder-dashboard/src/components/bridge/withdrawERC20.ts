import { L1_NETWORK } from '../../../constants'
import { ethers } from 'ethers'

const L2GatewayRouterABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_l1Token',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256'
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes'
      }
    ],
    name: 'outboundTransfer',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  }
]

const L2GatewayRouterAddress = '0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7'
export const sendWithdrawERC20Transaction = async (amountInNative: string, destination: string) => {
  try {
    if (!window.ethereum) {
      throw new Error('no provider')
    }
    const amountInWei = ethers.utils.parseEther(amountInNative.toString())
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()

    const routerContract = new ethers.Contract(L2GatewayRouterAddress, L2GatewayRouterABI, signer)

    const txRequest = await routerContract.populateTransaction.outboundTransfer(
      L1_NETWORK.g7TokenAddress,
      destination,
      amountInWei,
      '0x'
    )

    const txResponse = await signer.sendTransaction(txRequest)
    console.log('Transaction response:', txResponse)

    // Wait for the transaction to be mined
    const receipt = await txResponse.wait()
    console.log('Transaction receipt:', receipt)
    console.log('Transaction hash:', receipt.transactionHash)

    return receipt
  } catch (error) {
    console.error('Transaction failed:', error)
    throw error
  }
}
