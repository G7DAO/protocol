import { BigNumber, ethers } from 'ethers';
import Bridger from './bridger';
import { BridgeNetwork } from './bridgeNetwork';
import { TokenAddressMap } from './types';

/**
 * Represents a token within a blockchain network that can be used in bridging operations.
 */
export class BridgeToken {
  /**
   * A map of token addresses keyed by chain IDs.
   * @private
   */
  private readonly token: TokenAddressMap;

  /**
   * An array of `Bridger` instances associated with this token.
   */
  public bridgers: Bridger[];

  /**
   * The chain ID of the network to which this token belongs.
   */
  public readonly chainId: number;

  /**
   * Creates an instance of the `BridgeToken` class, which represents a specific token within a blockchain network.
   *
   * @param token - A `TokenAddressMap` object representing the token addresses associated with different chain IDs.
   * @param network - The `BridgeNetwork` instance to which this token belongs.
   */
  constructor(token: TokenAddressMap, network: BridgeNetwork);

  /**
   * Retrieves the balance of a specified address for a given network.
   *
   * This method checks the balance of either native or an ERC20 token for the specified address
   * on the configured network. If the token address corresponds to the native (i.e., `AddressZero`),
   * it fetches the native balance. Otherwise, it fetches the balance of the specified ERC20 token.
   *
   * @param provider - A signer, provider, or RPC URL for connecting to the Ethereum network.
   * @param address - The address for which to retrieve the balance.
   * @returns A promise that resolves to the balance of the native or ERC20 token.
   */
  public getBalance(
      provider: ethers.Signer | ethers.providers.Provider | string,
      address: string
  ): Promise<BigNumber>;

  /**
   * Retrieves the symbol of the token for display purposes.
   *
   * @param provider - An `ethers.Signer`, `ethers.providers.Provider`, or a string representing the RPC URL.
   * @returns A promise that resolves to a string representing the token symbol.
   */
  public getSymbol(
      provider: ethers.Signer | ethers.providers.Provider | string
  ): Promise<string>;

  /**
   * Retrieves a list of `Bridger` instances that can be used to bridge the token across different networks.
   *
   * @param chainIds - (Optional) An array of chain IDs to filter the bridgers by specific networks.
   * @returns An array of `Bridger` instances representing the available bridging options for this token.
   */
  public getBridgers(chainIds?: number[]): Bridger[];
}
