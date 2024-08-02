import { ethers } from 'ethers'
import { NetworkInterface } from '@/contexts/BlockchainContext'
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
  const tx = await tokenContract.approve(spender, amountInWei)
  return tx.wait() // Wait for the transaction to be mined
}
