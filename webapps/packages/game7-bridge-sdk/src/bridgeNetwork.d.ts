import { BigNumber, ethers } from 'ethers';
import { ChainInfo, TokenAddressMap } from './types';
import { BridgeToken } from './bridgeToken';
import { BridgeNetworkConfig } from './networks';

/**
 * Represents a blockchain network within the bridge.
 */
export class BridgeNetwork {
  /**
   * The chain ID of the network.
   */
  public readonly chainId: number;

  /**
   * An array of `BridgeToken` instances representing tokens associated with this network.
   */
  public readonly tokens: BridgeToken[];

  /**
   * The name of the network.
   */
  public readonly name: string;

  /**
   * The symbol of the network's native currency.
   */
  public readonly symbol: string;

  /**
   * The configuration of the bridge network.
   * @private
   */
  private readonly network: BridgeNetworkConfig;

  /**
   * Creates an instance of a network configuration for bridging operations.
   *
   * @param chainId - The chain ID of the network to be configured.
   * @param tokens - An array of `TokenAddressMap` objects representing token addresses for different chains.
   * @param name - Optional. The name of the network. Defaults to the name defined in the network configuration.
   *
   * @throws {UnsupportedNetworkError} If the network configuration is missing for the specified chain ID.
   */
  constructor(chainId: number, tokens: TokenAddressMap[], name?: string);

  /**
   * Retrieves the gas balance for a given account on this blockchain network.
   *
   * @param provider - An `ethers.Signer` or `ethers.providers.Provider` instance used to interact with the blockchain.
   * @param account - The account address for which to retrieve the gas balance.
   * @returns A promise that resolves to a `BigNumber` representing the gas balance of the specified account.
   */
  public getGasBalance(
      provider: ethers.Signer | ethers.providers.Provider,
      account: string,
  ): Promise<BigNumber>;
}
