// Third-Party Modules
import { BigNumber, ethers, Overrides } from 'ethers';

// Internal Modules - ABIs
import { arbSysABI } from './abi/ArbSysABI';
import { ERC20_ABI } from './abi/ERC20_ABI';
import { L2GatewayRouterABI } from './abi/L2GatewayRouterABI';

// Internal Modules - Actions
import {
  depositERC20,
  depositETH,
  depositNative, estimateDepositErc20, estimateDepositERC20ToEth, estimateDepositEth,
  estimateOutboundTransferGas,
} from './actions/deposit';
import { withdrawERC20, withdrawEth, withdrawNative } from './actions/withdraw';

// Internal Modules - Errors
import { BridgerError, GasEstimationError, UnsupportedNetworkError } from './errors';

// Internal Modules - Networks and Types
import { BridgeNetworkConfig, networks } from './networks';
import { TokenAddressMap } from './types';
import { SignerOrProvider } from './bridgeNetwork';
import { getProvider } from './bridgeTransfer';

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

  destinationProvider: ethers.providers.Provider;

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

/**
 * A class representing a Bridger that manages cross-network token transfers.
 */
export class Bridger {
  /**
   * The configuration of the origin network.
   * @type {BridgeNetworkConfig}
   */
  public readonly originNetwork: BridgeNetworkConfig;

  /**
   * The configuration of the destination network.
   * @type {BridgeNetworkConfig}
   */
  public readonly destinationNetwork: BridgeNetworkConfig;

  /**
   * Indicates whether the operation is a deposit.
   * `true` if the origin network is the parent of the destination network.
   * @type {boolean}
   */
  public readonly isDeposit: boolean;

  /**
   * A map of token addresses keyed by chain IDs.
   * @type {TokenAddressMap}
   */
  public readonly token: TokenAddressMap;

  /**
   * If true, uses local storage for caching data.
   * @type {boolean}
   * @private
   */
  private useLocalStorage: boolean;

  /**
   * If true, automatically approves deposit allowances.
   * @type {boolean}
   * @private
   */
  private approveDepositAllowance: boolean;

  /**
   * Initializes a bridge operation between two networks.
   *
   * @param {number} originNetworkChainId - The chain ID of the origin network.
   * @param {number} destinationNetworkChainId - The chain ID of the destination network.
   * @param {TokenAddressMap} token - A map of token addresses keyed by chain IDs.
   * @param {Object} [params] - Optional parameters for the bridge operation.
   * @param {boolean} [params.useLocalStorage=false] - If true, uses local storage for caching.
   * @param {boolean} [params.approveDepositAllowance=true] - If true, approves deposit allowance automatically.
   *
   * @throws {UnsupportedNetworkError} If either the origin or destination network is not supported.
   * @throws {BridgerError} If the bridge is not set up correctly or token addresses are missing.
   */
  constructor(
    originNetworkChainId: number,
    destinationNetworkChainId: number,
    token: TokenAddressMap,
    params?: { useLocalStorage?: boolean; approveDepositAllowance?: boolean },
  ) {
    // Ensure both networks exist
    const originNetwork = networks[originNetworkChainId];
    const destinationNetwork = networks[destinationNetworkChainId];

    if (!originNetwork) {
      throw new UnsupportedNetworkError(originNetworkChainId);
    }
    if (!destinationNetwork) {
      throw new UnsupportedNetworkError(destinationNetworkChainId);
    }

    // Validate that one network is a parent of the other
    if (
      !(
        originNetwork.parentChainId === destinationNetwork.chainId ||
        destinationNetwork.parentChainId === originNetwork.chainId
      )
    ) {
      throw new BridgerError(
        `Bridge is not set up correctly between the networks: ${originNetworkChainId} and ${destinationNetworkChainId}. One network must be a parent of the other.`,
      );
    }

    // Validate token addresses
    if (!token[originNetworkChainId]) {
      throw new BridgerError(
        `Token address missing for origin network chain ID ${originNetworkChainId}`,
      );
    }
    if (!token[destinationNetworkChainId]) {
      throw new BridgerError(
        `Token address missing for destination network chain ID ${destinationNetworkChainId}`,
      );
    }
    this.originNetwork = originNetwork;
    this.destinationNetwork = destinationNetwork;
    this.isDeposit = originNetwork.chainId === destinationNetwork.parentChainId;
    this.token = token;
    this.useLocalStorage = params?.useLocalStorage ?? false;
    this.approveDepositAllowance = params?.approveDepositAllowance ?? true;
  }

  /**
   * Estimates the gas and fees required for a token transfer operation.
   *
   * This method estimates the gas and fees for either a deposit or a withdrawal operation,
   * depending on the configuration of the bridge. It supports both native and ERC20 token transfers.
   *
   * @param {BigNumber} amount - The amount of the token to be transferred.
   * @param {SignerOrProvider} provider - A signer or provider for connecting to the Ethereum network. Can be an RPC URL string.
   * @param {string} _from - The address initiating the transfer.
   * @returns {Promise<GasAndFeeEstimation>} A promise that resolves to the estimated gas and fee details.
   *
   * @throws {GasEstimationError} If the gas estimation fails for any reason.
   */
  public getGasAndFeeEstimation(
    amount: BigNumber,
    provider: SignerOrProvider,
    _from: string,
  ): Promise<GasAndFeeEstimation> {
    const originToken = this.token[this.originNetwork.chainId];
    const destinationToken = this.token[this.destinationNetwork.chainId];
    const DEFAULT_ADDRESS = '0x5F9261B04033C294B22397A1e3F057E1a28D5fC8';
    const from = _from ?? DEFAULT_ADDRESS;
    if (typeof provider === 'string') {
      provider = new ethers.providers.JsonRpcProvider(provider);
    }
    if (!this.isDeposit) {
      if (originToken === ethers.constants.AddressZero) {
        return this.estimateWithdrawNative(amount, provider, from);
      } else {
        return this.estimateWithdrawERC20(amount, provider, from);
      }
    } else {
      if (destinationToken === ethers.constants.AddressZero) {
        if (originToken === ethers.constants.AddressZero) {
          return this.estimateDepositEth(amount, provider, from)
        }
        return this.estimateDepositERC20ToEth(amount, provider, from);
      } else {
        return this.estimateDepositERC20(amount, provider, from);
      }
    }
  }

  /**
   * Estimates the gas and fees required for withdrawing native ETH from the origin network.
   *
   * This method calculates the estimated gas usage, gas price, and total fee for withdrawing ETH
   * using the ArbSys contract on the origin network.
   *
   * @param {BigNumber} amount - The amount of ETH to withdraw.
   * @param {ethers.Signer | ethers.providers.Provider} provider - A signer or provider for connecting to the Ethereum network.
   * @param {string} from - The address from which the ETH is being withdrawn.
   * @returns {Promise<GasAndFeeEstimation>} A promise that resolves to the estimated gas and fee details.
   *
   * @throws {GasEstimationError} If the gas estimation fails or if the origin network lacks an ArbSys contract.
   */
  private estimateWithdrawNative = async (
    amount: BigNumber,
    provider: ethers.Signer | ethers.providers.Provider,
    from: string,
  ) => {
    try {
      const arbSysAddress = this.originNetwork.arbSys;
      if (!arbSysAddress) {
        throw new GasEstimationError("Origin network doesn't have ArbSys");
      }
      const arbSysContract = new ethers.Contract(arbSysAddress, arbSysABI, provider);

      const estimatedGas = await arbSysContract.estimateGas.withdrawEth(from, {
        value: amount,
        from,
      });

      const gasPrice = await provider.getGasPrice();
      const estimatedFee = gasPrice.mul(estimatedGas);
      return { estimatedFee, estimatedGas, gasPrice };
    } catch (error) {
      console.error('Fee estimation failed:', error);
      throw error;
    }
  };

  /**
   * Estimates the gas and fees required for withdrawing an ERC20 token from the origin network.
   *
   * This method calculates the estimated gas usage, gas price, and total fee for withdrawing
   * an ERC20 token using the Gateway Router contract on the origin network.
   *
   * @param {BigNumber} amount - The amount of ERC20 tokens to withdraw.
   * @param {ethers.Signer | ethers.providers.Provider} signerOrProvider - A signer or provider for connecting to the Ethereum network.
   * @param {string} from - The address from which the ERC20 tokens are being withdrawn.
   * @returns {Promise<GasAndFeeEstimation>} A promise that resolves to the estimated gas and fee details.
   *
   * @throws {GasEstimationError} If the gas estimation fails or if the input parameters are invalid.
   */
  private async estimateWithdrawERC20(
    amount: BigNumber,
    signerOrProvider: ethers.Signer | ethers.providers.Provider,
    from: string,
  ): Promise<GasAndFeeEstimation> {
    try {
      if (!ethers.utils.isAddress(from)) {
        throw new GasEstimationError('Invalid sender address');
      }

      const gatewayRouterAddress = this.originNetwork.tokenBridge?.childGatewayRouter;
      if (!gatewayRouterAddress) {
        throw new GasEstimationError("Origin network doesn't have GatewayRouter");
      }

      const routerContract = new ethers.Contract(
        gatewayRouterAddress,
        L2GatewayRouterABI,
        signerOrProvider,
      );
      const estimatedGas = await routerContract.estimateGas['outboundTransfer(address,address,uint256,bytes)'](
        this.token[this.destinationNetwork.chainId],
        from,
        amount,
        '0x',
        { from },
      );

      const gasPrice = await signerOrProvider.getGasPrice();
      const estimatedFee = estimatedGas.mul(gasPrice);

      return {
        estimatedGas,
        gasPrice,
        estimatedFee,
      };
    } catch (error: any) {
      console.error('Gas and fee estimation failed:', error);
      throw new GasEstimationError('Gas and fee estimation failed: ' + error.message);
    }
  }

  private async estimateDepositEth(
    amount: BigNumber,
    _provider: SignerOrProvider,
    from: string,
  ): Promise<GasAndFeeEstimation> {
    const provider = getProvider(_provider)
    const contractAddress = this.destinationNetwork.ethBridge?.inbox
    if (!contractAddress) {
      throw new GasEstimationError("inbox contract isn't set")
    }
    return estimateDepositEth(amount, provider, contractAddress, from)
  }

  private async estimateDepositERC20ToEth(
    amount: BigNumber,
    _provider: SignerOrProvider,
    from: string,
  ): Promise<GasAndFeeEstimation> {
    const provider = getProvider(_provider)
    const contractAddress = this.destinationNetwork.ethBridge?.inbox
    if (!contractAddress) {
      throw new GasEstimationError("inbox contract isn't set")
    }
    return estimateDepositERC20ToEth(amount, provider, contractAddress)
  }

  private async estimateDepositERC20(
    amount: BigNumber,
    _provider: SignerOrProvider,
    from: string,
  ): Promise<GasAndFeeEstimation> {
    const contractAddress = this.destinationNetwork.tokenBridge?.parentGatewayRouter;
    if (!contractAddress) {
      throw new GasEstimationError("parentGatewayRouter contract isn't set")
    }
    const tokenAddress = this.token[this.originNetwork.chainId];
    const provider = getProvider(_provider)
    return estimateDepositErc20(amount, provider as ethers.providers.Provider, contractAddress, from, tokenAddress)
  }

  /**
   * Retrieves the address of the spender for a deposit transaction.
   *
   * This method determines the correct spender address based on whether the deposit involves
   * native ETH or an ERC20 token. If native ETH is being deposited, the spender is set to the
   * `inbox` address of the origin network's ETH bridge. If an ERC20 token is being deposited,
   * the spender is set to the `parentErc20Gateway` address of the destination network's token bridge.
   *
   * @returns {string} The address of the spender for the deposit transaction.
   *
   * @throws {BridgerError} If the spender address cannot be determined.
   */
  private getDepositSpender() {
    let spenderAddress: string;
    if (this.token[this.destinationNetwork.chainId] === ethers.constants.AddressZero) {
      spenderAddress = this.destinationNetwork.ethBridge?.inbox ?? '';
    } else {
      spenderAddress = this.destinationNetwork.tokenBridge?.parentErc20Gateway ?? '';
    }
    if (!spenderAddress) {
      throw new BridgerError("Can't evaluate deposit spender");
    }
    return spenderAddress;
  }

  /**
   * Retrieves the current allowance for the deposit spender on the origin network.
   *
   * This method checks if the operation is a deposit and then queries the allowance of an
   * ERC20 token for the spender address. If the operation is not a deposit, it returns `null`.
   *
   * @param {ethers.Signer | ethers.providers.Provider | string} provider - A signer, provider, or RPC URL for connecting to the Ethereum network.
   * @param {string} account - The account address for which to check the allowance.
   * @returns {Promise<BigNumber | null>} A promise that resolves to the allowance of the ERC20 token or `null` if it's not a deposit.
   *
   * @throws {Error} If the token address is not found for the specified network.
   */
  public async getAllowance(
    provider: ethers.Signer | ethers.providers.Provider | string,
    account: string,
  ): Promise<BigNumber | null | undefined> {
    if (!this.isDeposit) {
      return null;
    }
    if (typeof provider === 'string') {
      provider = new ethers.providers.JsonRpcProvider(provider);
    }
    const tokenAddress = this.token[this.originNetwork.chainId];
    if (!tokenAddress) {
      throw new Error('Token address not found for the specified network');
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return await tokenContract.allowance(account, this.getDepositSpender());
  }

  /**
   * Approves the specified amount of ERC20 tokens for the deposit spender.
   *
   * This method sends a transaction to approve the transfer of a specified amount of ERC20 tokens
   * from the signer's account to the deposit spender. The spender is determined by the deposit
   * logic based on the configured networks.
   *
   * @param {BigNumber} amount - The amount of ERC20 tokens to approve for transfer.
   * @param {ethers.Signer} signer - The signer instance used to send the approval transaction.
   * @returns {Promise<ethers.ContractTransaction>} A promise that resolves to the transaction object of the approval.
   *
   * @throws {BridgerError} If the token address is not found or if the approval transaction fails.
   */
  public async approve(
    amount: BigNumber,
    signer: ethers.Signer,
  ): Promise<ethers.ContractTransaction> {
    const tokenAddress = this.token[this.originNetwork.chainId];

    if (!tokenAddress) {
      throw new Error('Token address not found for the specified network');
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

    try {
      return await tokenContract.approve(this.getDepositSpender(), amount);
    } catch (error: any) {
      console.error('Approval transaction failed:', error);
      throw new Error('Approval transaction failed: ' + error.message);
    }
  }

  /**
   * Executes a token transfer between networks.
   *
   * This method initiates a transfer of either native ETH or ERC20 tokens between the origin and destination networks.
   * The type of transfer (deposit or withdrawal) is determined based on the configuration of the `Bridger` instance.
   *
   * @param {TransferParams} params - An object containing the parameters for the transfer:
   * - `amount` (BigNumber): The amount of ETH or tokens to transfer.
   * - `signer` (ethers.Signer): The signer performing the transfer.
   * - `destinationAddress` (string): The address receiving the funds. Defaults to the `from` address if not provided.
   * - `overrides` (ethers.Overrides): Transaction overrides (optional).
   *
   * @returns {Promise<ethers.ContractTransaction>} A promise that resolves to the transaction object representing the transfer.
   *
   * @throws {BridgerError} If there is an issue with the transfer operation.
   */
  async transfer(params: TransferParams): Promise<ethers.ContractTransaction> {
    const { amount, signer, destinationAddress, overrides, destinationProvider } = params;

    const destination = destinationAddress ?? (await signer.getAddress());
    const originToken = this.token[this.originNetwork.chainId];
    const destinationToken = this.token[this.destinationNetwork.chainId];

    if (!this.isDeposit) {
      if (originToken === ethers.constants.AddressZero) {
        if (destinationToken === ethers.constants.AddressZero) {
          return withdrawEth(amount, destination, signer, overrides);
        }
        return withdrawNative(amount, destination, signer, this.originNetwork, overrides);
      } else {
        return withdrawERC20(destinationToken, amount, destination, signer, overrides);
      }
    } else {
      if (destinationToken === ethers.constants.AddressZero) {
        if (originToken === ethers.constants.AddressZero) {
          return depositETH(amount, this.destinationNetwork.chainId, signer);
        }
        return depositNative(amount, this.destinationNetwork, signer, overrides);
      } else {
        return depositERC20(
          amount,
          this.destinationNetwork.chainId,
          originToken,
          signer,
          destinationProvider,
          overrides,
        );
      }
    }
  }
}
