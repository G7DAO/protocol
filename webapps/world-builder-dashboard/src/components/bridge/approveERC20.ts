import { ethers } from 'ethers'
import { NetworkInterface } from '@/components/bridge/BlockchainContext'
import { Signer } from '@ethersproject/abstract-signer'

export const approve = async (amount: string, signer: Signer, network: NetworkInterface) => {
  const erc20Abi = [
    {
      constant: false,
      inputs: [
        {
          name: '_spender',
          type: 'address'
        },
        {
          name: '_value',
          type: 'uint256'
        }
      ],
      name: 'approve',
      outputs: [
        {
          name: '',
          type: 'bool'
        }
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]

  const tokenAddress = network.g7TokenAddress
  const spender = network.routerSpender
  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer)
  const amountInWei = ethers.utils.parseUnits(amount.toString(), 18)

  try {
    const tx = await tokenContract.approve(spender, amountInWei)
    console.log('Transaction hash:', tx.hash)
    await tx.wait() // Wait for the transaction to be mined
    console.log('Transaction confirmed')
  } catch (error) {
    console.error('Transaction failed:', error)
  }
}
