// Third-Party Modules
import { BigNumber, ethers } from 'ethers';

// Internal Modules - ABIs
import { ERC20_ABI } from './abi/ERC20_ABI';

// Internal Modules - Classes
import { Bridger } from './bridger';
import { BridgeNetwork } from './bridgeNetwork';

// Internal Modules - Types
import { TokenAddressMap } from './types';

// Internal Modules - Networks
import { networks } from './networks';
import {UnsupportedNetworkError} from "./errors";

/**
 * Represents a token within a blockchain network that can be used in bridging operations.
 */
export class BridgeToken {
  public readonly tokenAddresses: TokenAddressMap;
  public readonly address: string;
  public bridgers: Bridger[];
  public readonly chainId: number;

  /**
   * Creates an instance of the `BridgeToken` class, which represents a specific token within a blockchain network.
   *
   * @param tokenAddresses - A `TokenAddressMap` object representing the token addresses associated with different chain IDs.
   * @param chainId .
   */
  constructor(tokenAddresses: TokenAddressMap, chainId: number) {
    this.tokenAddresses = tokenAddresses;
    this.chainId = chainId;
    this.bridgers = this.getBridgers();
    this.address = tokenAddresses[chainId];
  }

  /**
   * Retrieves the balance of a specified address for a given network.
   *
   * This method checks the balance of either native or an ERC20 token for the specified address
   * on the configured network. If the token address corresponds to the native (i.e., `AddressZero`),
   * it fetches the native balance. Otherwise, it fetches the balance of the specified ERC20 token.
   *
   * @param {ethers.Signer | ethers.providers.Provider | string} provider - A signer, provider, or RPC URL for connecting to the Ethereum network.
   * @param {string} address - The address for which to retrieve the balance.
   * @returns {Promise<BigNumber>} A promise that resolves to the balance of the native or ERC20 token.
   *
   * @throws {Error} If the token address is not found for the specified network.
   */
  public async getBalance(
    provider: ethers.Signer | ethers.providers.Provider | string,
    address: string,
  ): Promise<BigNumber> {
    if (typeof provider === 'string') {
      provider = new ethers.providers.JsonRpcProvider(provider);
    }

    const tokenAddress = this.tokenAddresses[this.chainId];

    if (!tokenAddress) {
      throw new Error('Token address not found for the specified network');
    }
    if (tokenAddress === ethers.constants.AddressZero) {
      return await provider.getBalance(address);
    }
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return tokenContract.balanceOf(address);
  }

  /**
   * Retrieves the symbol of the token for display purposes.
   *
   * @param provider - An `ethers.Signer`, `ethers.providers.Provider`, or a string representing the RPC URL.
   *                   If a string is provided, a new `JsonRpcProvider` will be created using the RPC URL.
   * @returns A promise that resolves to a string representing the token symbol.
   * @throws An error if the token address is not found for the specified network.
   */
  public async getSymbol(
    provider: ethers.Signer | ethers.providers.Provider | string,
  ): Promise<string> {
    if (typeof provider === 'string') {
      provider = new ethers.providers.JsonRpcProvider(provider);
    }

    const tokenAddress = this.tokenAddresses[this.chainId];

    // Throw an error if the token address is not found for the specified network
    if (!tokenAddress) {
      throw new Error('Token address not found for the specified network');
    }

    if (tokenAddress === ethers.constants.AddressZero) {
      return networks[this.chainId]?.nativeCurrency?.symbol ?? '';
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return tokenContract.symbol();
  }


  /**
   * Retrieves the number of decimals used by the token.
   *
   * @param provider - An `ethers.Signer`, `ethers.providers.Provider`, or a string representing the RPC URL.
   *                   If a string is provided, a new `JsonRpcProvider` will be created using the RPC URL.
   * @returns A promise that resolves to a number representing the token's decimals.
   * @throws Error if the token address is not found for the specified network.
   */
  public async getDecimals(
    provider: ethers.Signer | ethers.providers.Provider | string,
  ): Promise<number> {
    if (typeof provider === 'string') {
      provider = new ethers.providers.JsonRpcProvider(provider);
    }

    const tokenAddress = this.tokenAddresses[this.chainId];

    // Throw an error if the token address is not found for the specified network
    if (!tokenAddress) {
      throw new Error('Token address not found for the specified network');
    }

    if (tokenAddress === ethers.constants.AddressZero) {
      return networks[this.chainId]?.nativeCurrency?.decimals ?? 18;
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return tokenContract.decimals();
  }

  /**
   * Retrieves a list of `Bridger` instances that can be used to bridge the token across different networks.
   *
   * @param chainIds - (Optional) An array of chain IDs to filter the bridgers by specific networks.
   *                   If not provided, all available bridgers for the token will be returned.
   * @returns An array of `Bridger` instances representing the available bridging options for this token.
   */
  public getBridgers(chainIds?: number[]): Bridger[] {
    const bridgers: Bridger[] = [];
    const availableChainIds = chainIds || Object.keys(this.tokenAddresses).map(Number);

    for (const chainId of availableChainIds) {
      if (chainId === this.chainId) {
        continue; // Skip if it's the same as the current network
      }

      try {
        const originNetwork = networks[this.chainId];
        const destinationNetwork = networks[chainId];
        if (originNetwork && destinationNetwork && (
            originNetwork.parentChainId === destinationNetwork.chainId ||
            destinationNetwork.parentChainId === originNetwork.chainId
        )) {
          const bridger = new Bridger(
            this.chainId, // originNetworkChainId
            chainId, // destinationNetworkChainId
            this.tokenAddresses, // token mapping
          );
          bridgers.push(bridger);
        }
      } catch (error: any) {
        console.warn(`Could not create Bridger for chainId ${chainId}: ${error.message}`);
      }
    }

    return bridgers;
  }
}
