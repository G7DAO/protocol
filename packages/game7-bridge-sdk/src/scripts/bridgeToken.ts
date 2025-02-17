import { Erc20Bridger, getArbitrumNetwork } from '@arbitrum/sdk';
import { networks } from '../networks';
import { ethers } from 'ethers';
import { TokenAddressMap } from '../types';
import { BridgeToken } from '../bridgeToken';
const ACCOUNT = '0xea9035a97722C1fDE906a17184f558794E4a9141';

async function getTokenInfo(tokensAddresses: TokenAddressMap[]) {
  for (const tokenAddresses of tokensAddresses) {
    console.log('_____________________________-')
    for (const chainId of Object.keys(tokenAddresses).map(Number)) {
      const bridgeToken = new BridgeToken(tokenAddresses, chainId);

      const network = networks[chainId];
      if (!network) {
        console.error(`Network not found for chainId: ${chainId}`);
        continue;
      }

      const provider = new ethers.providers.JsonRpcProvider(network.rpcs[0]);

      let balance: any;
      let symbol: string | undefined;
      let decimals: number | undefined;

      console.log(`Fetching token info for chainId: ${chainId}...`);

      try {
        balance = await bridgeToken.getBalance(provider, ACCOUNT);
      } catch (error: any) {
        console.error(`Failed to get balance for chainId ${chainId}`);
      }

      try {
        symbol = await bridgeToken.getSymbol(provider);
        console.log(`Symbol for chainId ${chainId}:`, symbol);
      } catch (error: any) {
        console.error(`Failed to get symbol for chainId ${chainId}`);
      }

      try {
        decimals = await bridgeToken.getDecimals(provider);
      } catch (error: any) {
        console.error(`Failed to get decimals for chainId ${chainId}:`);
      }

      console.log({ chainId, balance, symbol, decimals });
      console.log('.............................');
    }
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

export const F5: TokenAddressMap = {
  11155111: '0x8A0e3350fFAEb5DCcAca6045B3c07646FE9b46e7',
  421614: '0xE48e26A902565f15E9F3a63caf55d339c1b3d49E',
  13746: '0xE0F396Bf57adfdC8b876DB2c1903E0B4D90F0912',
}

export const USDC: TokenAddressMap = {
  11155111: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
  421614: '0x119f0E6303BEc7021B295EcaB27A4a1A5b37ECf0',
  13746: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
}


getTokenInfo([USDC, TG7T, ETH, F5])




