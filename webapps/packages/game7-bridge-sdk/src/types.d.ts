import { BigNumber, ethers, Overrides } from 'ethers';

/**
 * Interface representing a dictionary of token addresses keyed by chain IDs.
 */
export interface TokenAddressMap {
  [chainId: number]: string; // The key is the chain ID (number), and the value is the token address (string).
}

/**
 * Represents the estimated gas and fees.
 */
export interface GasAndFeeEstimation {
  /**
   * The estimated amount of gas required to execute the transaction.
   */
  estimatedGas: BigNumber;

  /**
   * The estimated gas price for the transaction.
   */
  gasPrice: BigNumber;

  /**
   * The total estimated fee for the transaction.
   * This is calculated as the product of `estimatedGas` and `gasPrice`.
   */
  estimatedFee: BigNumber;
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

/**
 * Parameters required for a fund transfer operation.
 */
export interface TransferParams {
  /**
   * The amount of ETH or tokens to be transferred.
   */
  amount: BigNumber;

  /**
   * The signer instance for signing the transaction.
   */
  signer: ethers.Signer;

  /**
   * The network address of the entity receiving the funds. Defaults to the signer address.
   */
  destinationAddress?: string;

  /**
   * The maximum cost to be paid for submitting the transaction.
   */
  maxSubmissionCost?: BigNumber;

  /**
   * The address to return any gas that was not spent on fees.
   */
  excessFeeRefundAddress?: string;

  /**
   * The address to refund the call value to in the event the retryable is cancelled or expires.
   */
  callValueRefundAddress?: string;

  /**
   * Transaction overrides.
   */
  overrides?: Overrides;

  // TODO: Add `retryableGasOverrides` parameter for additional control over retryable tickets.
  // retryableGasOverrides?: GasOverrides;
}
