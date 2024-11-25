import { Bridger } from '../bridger';
import { TokenAddressMap } from '../types';
import { ethers } from 'ethers';
import { networks } from '../networks';
import { BridgeNetwork } from '../bridgeNetwork';
import { BridgeToken } from '../bridgeToken';

async function estimateGas(directions: Array<{destinationNetworkChainId: number; originNetworkChainId: number; token: TokenAddressMap }>) {
  const from = '0xea9035a97722C1fDE906a17184f558794E4a9141'
  for (const direction  of directions) {
    console.log('.........................')
    const originNetwork = networks[direction.originNetworkChainId];
    const originProvider = new ethers.providers.JsonRpcProvider(originNetwork.rpcs[0]);

    const bridgeNetwork = new BridgeNetwork(direction.originNetworkChainId, [])
    const bridgeToken = new BridgeToken(direction.token, direction.originNetworkChainId)
    const tokenSymbol = await bridgeToken.getSymbol(originProvider)
    const destinationNetwork = networks[direction.destinationNetworkChainId]
    console.log(`${originNetwork.name} -> ${destinationNetwork.name} ${tokenSymbol}`)

    const bridger = new Bridger(direction.originNetworkChainId, direction.destinationNetworkChainId, direction.token)
    // const res = await bridger.getGasAndFeeEstimation(ethers.utils.parseEther("0.1"), originProvider, from)
    const approvalRes = await bridger.getApprovalGasAndFeeEstimation(ethers.utils.parseEther("0.1"), originProvider, from)
    // console.log(res);
    console.log("approval: ", approvalRes, approvalRes ? ethers.utils.formatEther(approvalRes.estimatedFee) : 'not needed')
    console.log('.........................')
  }
}

export const TG7T: TokenAddressMap = {
  13746: '0x0000000000000000000000000000000000000000',
  421614: '0x10adbf84548f923577be12146eac104c899d1e75',
  11155111: '0xe2ef69e4af84dbefb0a75f8491f27a52bf047b01'
}

export const ETH: TokenAddressMap = {
  421614: '0x0000000000000000000000000000000000000000',
  11155111: '0x0000000000000000000000000000000000000000'
}

const directions = [
  // { originNetworkChainId: 11155111, destinationNetworkChainId: 421614, token: TG7T },
  // { originNetworkChainId: 11155111, destinationNetworkChainId: 421614, token: ETH },
  // { originNetworkChainId: 421614, destinationNetworkChainId: 11155111, token: TG7T },
  // { originNetworkChainId: 421614, destinationNetworkChainId: 11155111, token: ETH },
  { originNetworkChainId: 421614, destinationNetworkChainId: 13746, token: TG7T },
  // { originNetworkChainId: 13746, destinationNetworkChainId: 421614, token: TG7T },
]
// Run the script
estimateGas(directions);


// L1->L2 TG7 .000016   MM: 0.00035   F: .00033
// L1->L2 ETH .000004   MM: .00013    F: .00013       ARB BRIDGE: < 0.00001
// L2->L3 TG7 .000012   MM: .000016   F: .000014
// L2->L1 TG7 .000018   MM: .0000019  F: .000018
// L2->L1 ETH .0000069  MM: .0000069  F: .0000068371
// L3->L2 TG7 .00000069 MM: .00000069 F: .00000068371
