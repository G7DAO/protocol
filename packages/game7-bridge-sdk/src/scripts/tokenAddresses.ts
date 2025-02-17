import { Erc20Bridger, getArbitrumNetwork } from '@arbitrum/sdk';
import { networks } from '../networks';
import { ethers } from 'ethers';

async function getTokenAddresses(chainId: number, parentChainId: number, tokenAddress: string)  {
  const arbitrumNetwork = getArbitrumNetwork(13746);

  const parentNetwork = networks[parentChainId];
  const parentProvider = new ethers.providers.JsonRpcProvider(parentNetwork.rpcs[0]);

  const childNetwork = networks[chainId];
  const childProvider = new ethers.providers.JsonRpcProvider(childNetwork.rpcs[0]);

  const erc20Bridger = new Erc20Bridger(arbitrumNetwork);

  // const childAddress = await erc20Bridger.getChildErc20Address(tokenAddress, parentProvider)
  // console.log(childAddress)
  // console.log('.............................')

  const parentAddress = await erc20Bridger.getParentErc20Address(tokenAddress, childProvider)
  console.log(parentAddress)
  console.log('.............................')

  // const l2Token = erc20Bridger.getL2TokenContract(
  //   l2Provider,
  //   await erc20Bridger.getL2ERC20Address(l1Erc20Address, l1Provider)
  // )

  // return childAddress
}


// const res = getTokenAddresses(, '0xE48e26A902565f15E9F3a63caf55d339c1b3d49E')
// getTokenAddresses(11155111, '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8')

// getTokenAddresses(421614, 11155111, '0xe2ef69e4af84dbefb0a75f8491f27a52bf047b01')
getTokenAddresses(421614, 11155111, '0xE48e26A902565f15E9F3a63caf55d339c1b3d49E')

//L2 0xE48e26A902565f15E9F3a63caf55d339c1b3d49E
//L3 0xE0F396Bf57adfdC8b876DB2c1903E0B4D90F0912

// async function getChildErc20Address(erc20ParentAddress, parentProvider) {
//   const parentGatewayRouter = L1GatewayRouter__factory_1.L1GatewayRouter__factory.connect(this.childNetwork.tokenBridge.parentGatewayRouter, parentProvider);
//   return await parentGatewayRouter.functions
//     .calculateL2TokenAddress(erc20ParentAddress)
//     .then(([res]) => res);
// }
