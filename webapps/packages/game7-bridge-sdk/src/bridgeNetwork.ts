// Third-Party Modules
import { BigNumber, ethers } from 'ethers';

// Internal Modules - Types
import { ChainInfo, TokenAddressMap } from './types';

// Internal Modules - Classes
import { BridgeToken } from './bridgeToken';

// Internal Modules - Networks
import { BridgeNetworkConfig, networks } from './networks';

// Internal Modules - Errors
import { BridgerError, UnsupportedNetworkError } from './errors';

/**
 * Represents a type that can be either a Signer, a Provider, or an RPC URL string.
 */
export type SignerOrProvider = ethers.Signer | ethers.providers.Provider | string;

/**
 * Represents a blockchain network within the bridge.
 */
export class BridgeNetwork {
  public readonly chainId: number;
  public readonly tokens: BridgeToken[];
  public readonly name: string;
  public readonly symbol: string;
  public readonly network: BridgeNetworkConfig;

  /**
   * Creates an instance of a network configuration for bridging operations.
   *
   * This constructor initializes the network configuration, token mappings, and other metadata
   * for a specified blockchain network. It verifies that the provided chain ID corresponds to a
   * valid network configuration, maps the token addresses, and sets the network name and symbol.
   *
   * @param {number} chainId - The chain ID of the network to be configured.
   * @param {TokenAddressMap[]} tokens - An array of `TokenAddressMap` objects representing token addresses for different chains.
   * @param {string} [name] - Optional. The name of the network. Defaults to the name defined in the network configuration.
   *
   * @throws {UnsupportedNetworkError} If the network configuration is missing for the specified chain ID.
   */
  constructor(chainId: number, tokens: TokenAddressMap[], name?: string) {
    const network = networks[chainId];
    if (!network) {
      throw new UnsupportedNetworkError(chainId);
    }
    this.network = network;
    this.chainId = chainId;
    this.tokens = tokens.map((tokenMap) => new BridgeToken(tokenMap, chainId));
    this.name = name || network.name;
    this.symbol = network.nativeCurrency?.symbol || '';
  }

  /**
   * Retrieves the gas balance for a given account on this blockchain network.
   *
   * @param provider - An `ethers.Signer` or `ethers.providers.Provider` instance used to interact with the blockchain.
   *                   The provider should be connected to the network specified by the `chainId`.
   * @param account - The account address for which to retrieve the gas balance.
   * @returns A promise that resolves to a `BigNumber` representing the gas balance of the specified account.
   */
  public async getGasBalance(
    provider: ethers.Signer | ethers.providers.Provider,
    account: string,
  ): Promise<BigNumber> {
    return await provider.getBalance(account);
  }
}
