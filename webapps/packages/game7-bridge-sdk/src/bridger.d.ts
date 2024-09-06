import { BigNumber, ethers } from 'ethers';

// Import types from internal modules
import {
  GasAndFeeEstimation,
  SignerOrProvider,
  TokenAddressMap,
  TransferParams,
} from './types';
import { BridgeNetworkConfig } from './networks';

/**
 * A class representing a Bridger that manages cross-network token transfers.
 */
export default class Bridger {
  /**
   * The configuration of the origin network.
   */
  public readonly originNetwork: BridgeNetworkConfig;

  /**
   * The configuration of the destination network.
   */
  public readonly destinationNetwork: BridgeNetworkConfig;

  /**
   * Indicates whether the operation is a deposit.
   */
  public readonly isDeposit: boolean;

  /**
   * A map of token addresses keyed by chain IDs.
   */
  public readonly token: TokenAddressMap;

  /**
   * If true, uses local storage for caching data.
   * @private
   */
  private useLocalStorage: boolean;

  /**
   * If true, automatically approves deposit allowances.
   * @private
   */
  private approveDepositAllowance: boolean;

  /**
   * Initializes a bridge operation between two networks.
   * @throws {UnsupportedNetworkError} If either the origin or destination network is not supported.
   * @throws {BridgerError} If the bridge is not set up correctly or token addresses are missing.
   */
  constructor(
      originNetworkChainId: number,
      destinationNetworkChainId: number,
      token: TokenAddressMap,
      params?: { useLocalStorage?: boolean; approveDepositAllowance?: boolean },
  );

  /**
   * Estimates the gas and fees required for a token transfer operation.
   * @throws {GasEstimationError} If the gas estimation fails for any reason.
   */
  public getGasAndFeeEstimation(
      amount: BigNumber,
      provider: SignerOrProvider,
      from: string,
  ): Promise<GasAndFeeEstimation>;

  /**
   * Retrieves the current allowance for the deposit spender on the origin network.
   * @throws {Error} If the token address is not found for the specified network.
   */
  public getAllowance(
      provider: ethers.Signer | ethers.providers.Provider | string,
      account: string,
  ): Promise<BigNumber | null>;

  /**
   * Approves the specified amount of ERC20 tokens for the deposit spender.
   * @throws {BridgerError} If the token address is not found or if the approval transaction fails.
   */
  public approve(
      amount: BigNumber,
      signer: ethers.Signer,
  ): Promise<ethers.ContractTransaction>;

  /**
   * Executes a token transfer between networks.
   * @throws {BridgerError} If there is an issue with the transfer operation.
   */
  public transfer(params: TransferParams): Promise<ethers.ContractTransaction>;

}
