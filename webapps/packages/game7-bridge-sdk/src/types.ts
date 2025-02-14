import { BigNumber, ethers, Overrides } from 'ethers';

/**
 * Interface representing a dictionary of token addresses keyed by chain IDs.
 */
export interface TokenAddressMap {
  [chainId: number]: string; // The key is the chain ID (number), and the value is the token address (string).
}

/**
 * Contains information about a blockchain network and its associated balances and allowances.
 */
export interface ChainInfo {
  /**
   * The unique identifier for the blockchain network.
   */
  chainId: number;

  /**
   * The balance of gas tokens available for transactions on this blockchain network.
   */
  gasBalance?: BigNumber;

  /**
   * The symbol representing the gas token used on this blockchain network.
   */
  gasSymbol?: string;
}


