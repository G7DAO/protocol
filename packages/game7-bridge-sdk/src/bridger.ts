// Third-Party Modules
import { BigNumber, ethers, Overrides } from 'ethers';

// Internal Modules - ABIs
import { arbSysABI } from './abi/ArbSysABI';
import { ERC20_ABI } from './abi/ERC20_ABI';
import { L2GatewayRouterABI } from './abi/L2GatewayRouterABI';
import { Erc20Bridger, getArbitrumNetwork } from '@arbitrum/sdk';

// Internal Modules - Actions
import {
  depositERC20,
  depositETH,
  depositNative,
  estimateApproval,
  estimateDepositERC20ToEth,
  estimateDepositEth,
  getDepositGasEstimation,
} from './actions/deposit';
import { withdrawERC20, withdrawEth, withdrawNative } from './actions/withdraw';

// Internal Modules - Errors
import { BridgerError, GasEstimationError, UnsupportedNetworkError } from './errors';

// Internal Modules - Networks and Types
import {BridgeNetworkConfig, networks} from './networks';
import { TokenAddressMap } from './types';
import { SignerOrProvider } from './bridgeNetwork';
import {getProvider, percentIncrease, scaleFrom18DecimalsToNativeTokenDecimals} from './utils/web3Utils';
import { SignerOrProviderOrRpc } from './bridgeTransfer';


export const DEFAULT_GAS_PRICE_PERCENT_INCREASE = BigNumber.from(500)

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

  childNetworkEstimation?: GasAndFeeEstimation
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
 * Represents a bridging operation between two networks for token transfers.
 * Handles deposits and withdrawals of both native currencies and ERC20 tokens
 * across supported networks.
 */
export class Bridger {
  /**
   * The configuration of the source/origin network where the transfer initiates.
   */
  public readonly originNetwork: BridgeNetworkConfig;

  /**
   * The configuration of the target/destination network where funds will be received.
   */
  public readonly destinationNetwork: BridgeNetworkConfig;

  /**
   * Indicates if this is a deposit operation (transfer from parent to child network).
   * True if origin network is the parent of the destination network.
   */
  public readonly isDeposit: boolean;

  /**
   * Maps chain IDs to their corresponding token addresses for both networks.
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
   * Creates a new Bridger instance to manage token transfers between networks.
   * 
   * @param originNetworkChainId - Chain ID of the source network
   * @param destinationNetworkChainId - Chain ID of the target network
   * @param token - Mapping of chain IDs to token addresses for both networks
   * @param params - Optional configuration parameters
   * @param params.useLocalStorage - Whether to cache data in localStorage
   * @param params.approveDepositAllowance - Whether to auto-approve token deposits
   * 
   * @throws {UnsupportedNetworkError} If either network is not supported
   * @throws {BridgerError} If networks are not properly connected (parent/child relationship)
   *                        or if token addresses are missing
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
   * Checks if this bridge uses the Cross-Chain Transfer Protocol (CCTP).
   * 
   * @returns {boolean} False for base Bridger implementation
   */
  public isCctp(): boolean  {
    return false
  }

  /**
   * Estimates gas costs and fees for a token transfer operation.
   * Supports both deposits and withdrawals of native currencies and ERC20 tokens.
   * 
   * For deposits of ERC20 tokens, also estimates the gas required on the destination chain.
   * 
   * @param amount - Amount of tokens/currency to transfer
   * @param provider - Provider/signer for the origin network (can be RPC URL)
   * @param _from - Address initiating the transfer
   * @param destinationProvider - Provider for destination network (required for ERC20 deposits)
   * 
   * @returns Promise resolving to gas and fee estimates for both networks where applicable
   * @throws {GasEstimationError} If estimation fails or required parameters are missing
   */
  public getGasAndFeeEstimation(
    amount: BigNumber,
    provider: SignerOrProvider,
    _from: string,
    destinationProvider?: SignerOrProvider,
  ): Promise<GasAndFeeEstimation> {
    const originToken = this.token[this.originNetwork.chainId];
    const destinationToken = this.token[this.destinationNetwork.chainId];
    const from = _from ?? '';
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
        if (destinationProvider) {
          const parentProvider = getProvider(provider)
          const childProvider = getProvider(destinationProvider)
          return this.estimateDepositERC20(amount, parentProvider, childProvider, from, this.destinationNetwork.nativeCurrency?.decimals ?? 18);
        } else {
          throw new GasEstimationError('ERC20 deposit gas estimation requires destination network provider')
        }
      }
    }
  }

  /**
   * Estimates gas costs for approving token transfers.
   * Only applicable for ERC20 deposits where allowance is needed.
   * 
   * @param amount - Amount of tokens requiring approval
   * @param _provider - Provider/signer for checking allowance (can be RPC URL)
   * @param _from - Address that needs to approve the tokens
   * 
   * @returns Promise resolving to gas estimates if approval is needed, null otherwise
   * @throws {Error} If token configuration is invalid
   */
  public async getApprovalGasAndFeeEstimation(
    amount: BigNumber,
    _provider: SignerOrProvider,
    _from: string,
  ): Promise<GasAndFeeEstimation | null> {
    if (!this.isDeposit) {
      return null
    }
    const tokenAddress = this.token[this.originNetwork.chainId];

    if (!tokenAddress) {
      throw new Error("Token address not found for the specified network");
    }

    const spender = this.getDepositSpender();
    if (!spender) {
      return null
    }

    const provider = getProvider(_provider)
    const allowance = await this.getAllowance(provider, _from)
    if (!allowance) { //allowance is a BigNumber, zero is not falsy
      return null
    }
    if (allowance.gte(amount)) {
      return null
    }

    return estimateApproval(amount, provider, tokenAddress, spender, _from)
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
   * an ERC20 token using the Gateway Router contract's outboundTransfer function.
   *
   * @param {BigNumber} amount - The amount of ERC20 tokens to withdraw
   * @param {ethers.Signer | ethers.providers.Provider} signerOrProvider - Provider or signer for the origin network
   * @param {string} from - The address initiating the withdrawal
   * @returns {Promise<GasAndFeeEstimation>} Gas and fee estimates including:
   *   - estimatedGas: Expected gas units required
   *   - gasPrice: Current gas price
   *   - estimatedFee: Total estimated fee (gas * gasPrice)
   * @throws {GasEstimationError} If estimation fails due to invalid address or missing router contract
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

  /**
   * Estimates gas and fees for depositing ETH from the origin network to the destination network.
   * 
   * @param {BigNumber} amount - Amount of ETH to deposit
   * @param {SignerOrProvider} _provider - Provider or signer for the origin network
   * @param {string} from - Address initiating the deposit
   * @returns {Promise<GasAndFeeEstimation>} Gas and fee estimates
   * @throws {GasEstimationError} If inbox contract address is not configured
   */
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

  /**
   * Estimates gas and fees for depositing ERC20 tokens that will be received as ETH on the destination network.
   *
   * @param {BigNumber} amount - Amount of ERC20 tokens to deposit
   * @param {SignerOrProvider} _provider - Provider or signer for the origin network  
   * @param {string} from - Address initiating the deposit
   * @returns {Promise<GasAndFeeEstimation>} Gas and fee estimates
   * @throws {GasEstimationError} If inbox contract address is not configured
   */
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
    return estimateDepositERC20ToEth(amount, provider, contractAddress, from)
  }

  /**
   * Estimates gas and fees for depositing ERC20 tokens from parent chain to child chain.
   * Includes gas estimates for both chains since token deposits require transactions on both networks.
   *
   * @param {BigNumber} amount - Amount of ERC20 tokens to deposit
   * @param {ethers.providers.Provider} parentProvider - Provider for the parent chain
   * @param {ethers.providers.Provider} childProvider - Provider for the child chain
   * @param {string} from - Address initiating the deposit
   * @param {number} childNativeCurrencyDecimals - Decimal places of child chain's native currency
   * @returns {Promise<GasAndFeeEstimation>} Gas and fee estimates for both chains including:
   *   - Parent chain estimates (estimatedGas, gasPrice, estimatedFee)
   *   - Child chain estimates (childNetworkEstimation)
   * @throws {GasEstimationError} If parent gateway router contract is not configured
   */
  private async estimateDepositERC20(
    amount: BigNumber,
    parentProvider: ethers.providers.Provider,
    childProvider: ethers.providers.Provider,
    from: string,
    childNativeCurrencyDecimals: number,
  ): Promise<GasAndFeeEstimation> {
    const contractAddress = this.destinationNetwork.tokenBridge?.parentGatewayRouter;

    if (!contractAddress) {
      throw new GasEstimationError("parentGatewayRouter contract isn't set")
    }

    const tokenAddress = this.token[this.originNetwork.chainId];
    const gasEstimation = await getDepositGasEstimation(amount, parentProvider, childProvider, from, tokenAddress)
    const parentGasPrice = await parentProvider.getGasPrice();
    const parentEstimatedFee =  gasEstimation.estimatedParentChainGas.mul(parentGasPrice);
    const childGasPrice = await childProvider.getGasPrice();

    const estimatedDestinationChainGasFeeEth = parseFloat(
        ethers.utils.formatEther(
            gasEstimation.estimatedChildChainGas
                .mul(
                    percentIncrease(
                        childGasPrice,
                        DEFAULT_GAS_PRICE_PERCENT_INCREASE
                    )
                )
                .add(gasEstimation.estimatedChildChainSubmissionCost)
        )
    )

    const estimatedDestinationChainGasFee =
        scaleFrom18DecimalsToNativeTokenDecimals({
          amount: ethers.utils.parseEther(String(estimatedDestinationChainGasFeeEth)),
          decimals: childNativeCurrencyDecimals
        })

    const childNetworkEstimation: GasAndFeeEstimation = {
      gasPrice: childGasPrice,
      estimatedFee: estimatedDestinationChainGasFee,
      estimatedGas: gasEstimation.estimatedChildChainGas
    }
    return {gasPrice: parentGasPrice, estimatedFee: parentEstimatedFee, estimatedGas: gasEstimation.estimatedParentChainGas, childNetworkEstimation }
  }

  /**
   * Gets the appropriate spender address for token approvals based on the transfer type.
   * 
   * For deposits:
   * - USDC: Returns settlement layer gateway
   * - ETH: Returns inbox contract
   * - Other ERC20: Returns parent gateway
   * 
   * For withdrawals:
   * - Bridged USDC: Returns rollup gateway
   * - Other cases: Returns null
   *
   * @returns {string|null} The spender address or null if approval not needed
   */
  private getDepositSpender(): string | null {
    const tokenAddress = this.token[this.originNetwork.chainId];
    if (!this.isDeposit && this.originNetwork.usdcAddresses && tokenAddress === this.originNetwork.usdcAddresses.bridged) {
      return this.originNetwork.usdcAddresses.rollupGateway;
    }
    if (this.isDeposit) {
      if (this.destinationNetwork.usdcAddresses && this.token[this.destinationNetwork.chainId] === this.destinationNetwork.usdcAddresses.bridged) {
        return this.destinationNetwork.usdcAddresses.settlementLayerGateway;
      }
      if (this.token[this.destinationNetwork.chainId] === ethers.constants.AddressZero) {
        return this.destinationNetwork.ethBridge?.inbox ?? null;
      } else {
        return this.destinationNetwork.tokenBridge?.parentErc20Gateway ?? null;
      }
    }
    return null;
  }

  /**
   * Gets the current token allowance for the bridge spender.
   *
   * @param {ethers.Signer | ethers.providers.Provider | string} provider - Provider, signer or RPC URL
   * @param {string} account - Address to check allowance for
   * @returns {Promise<BigNumber | null>} Current allowance amount, null if native token/no approval needed
   * @throws {BridgerError} If token address not found for the network
   */
  public async getAllowance(
    provider: ethers.Signer | ethers.providers.Provider | string,
    account: string,
  ): Promise<BigNumber | null> {
    if (!ethers.utils.isAddress(account)) {
      throw new BridgerError('Invalid account address');
    }

    const tokenAddress = this.token[this.originNetwork.chainId];
    if (tokenAddress === ethers.constants.AddressZero) {
      return null;
    }

    if (typeof provider === 'string') {
      provider = new ethers.providers.JsonRpcProvider(provider);
    }
    if (!tokenAddress) {
      throw new BridgerError('Token address not found for the specified network');
    }

    const spender = this.getDepositSpender();
    if (spender === null) {
      return null;
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return await tokenContract.allowance(account, spender);
  }

  /**
   * Gets the current allowance for the native token on the destination network.
   * 
   * @param {ethers.Signer | ethers.providers.Provider | string} provider - Provider, signer or RPC URL
   * @param {string} account - Address to check allowance for
   * @returns {Promise<BigNumber | null | undefined>} Current allowance amount, null if no approval needed
   */
  public async getNativeAllowance(
      provider: ethers.Signer | ethers.providers.Provider | string,
      account: string,
  ): Promise<BigNumber | null | undefined> {


    if (typeof provider === 'string') {
      provider = new ethers.providers.JsonRpcProvider(provider);
    }

    const spender = this.getDepositSpender()
    if (spender === null || !this.destinationNetwork.nativeToken || this.token[this.destinationNetwork.chainId] === ethers.constants.AddressZero) {
      return null;
    }
    const tokenContract = new ethers.Contract(this.destinationNetwork.nativeToken, ERC20_ABI, provider);
    return await tokenContract.allowance(account, spender);
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
    const spender = this.getDepositSpender()
    if (!spender) {
      throw new Error("Approval is not needed or spender address is missed in the network configuration")
    }
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    return tokenContract.approve(spender, amount);
  }

  public async approveNative (
      amount: BigNumber,
      signer: ethers.Signer,
  ): Promise<ethers.ContractTransaction> {
    const spender = this.getDepositSpender()
    if (spender === null || !this.destinationNetwork.nativeToken) {
      throw new Error("Approval is not needed or spender address is missed in the network configuration");
    }

    const tokenContract = new ethers.Contract(this.destinationNetwork.nativeToken, ERC20_ABI, signer);
    return await tokenContract.approve(spender, amount);
  }

  /**
   * Executes a token transfer between networks.
   *
   * This method initiates a transfer of either native ETH or ERC20 tokens between the origin and destination networks.
   * The type of transfer (deposit or withdrawal) is determined based on the configuration of the `Bridger` instance.
   *
   * @param {TransferParams} params - An object containing the parameters for the transfer:
   * - `amount` (BigNumber): The amount of ETH or tokens to transfer
   * - `signer` (ethers.Signer): The signer performing the transfer
   * - `destinationProvider` (ethers.providers.Provider): Provider for the destination network (required for ERC20 deposits)
   * - `destinationAddress` (string): The address receiving the funds. Defaults to the signer's address
   * - `overrides` (ethers.Overrides): Transaction overrides (optional)
   *
   * @returns {Promise<ethers.ContractTransaction>} A promise that resolves to the transaction object
   * @throws {BridgerError} If there is an issue with the transfer operation
   * @throws {Error} If required parameters are missing for specific transfer types
   */
  async transfer(params: TransferParams): Promise<ethers.ContractTransaction> {
    const { amount, signer, destinationAddress, overrides, destinationProvider } = params;

    // Validate amount
    if (amount.lte(0)) {
      throw new BridgerError('Transfer amount must be greater than 0');
    }

    const destination = destinationAddress ?? (await signer.getAddress());
    const originToken = this.token[this.originNetwork.chainId];
    const destinationToken = this.token[this.destinationNetwork.chainId];

    // Validate destination provider for ERC20 deposits
    if (this.isDeposit && destinationToken !== ethers.constants.AddressZero && !destinationProvider) {
      throw new BridgerError('Destination provider is required for ERC20 deposits');
    }

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

  static async completeTokenAddressMap(
    _tokenMap: TokenAddressMap,
    originNetworkChainId: number,
    destinationNetworkChainId: number,
    _originProvider: SignerOrProviderOrRpc,
    _destinationProvider: SignerOrProviderOrRpc
  ): Promise<TokenAddressMap> {
    const arbitrumOriginNetwork = getArbitrumNetwork(originNetworkChainId)
    const arbitrumDestinationNetwork = getArbitrumNetwork(destinationNetworkChainId)
    const originProvider = getProvider(_originProvider)
    const destinationProvider = getProvider(_destinationProvider)
    if (arbitrumOriginNetwork.parentChainId !== arbitrumDestinationNetwork.chainId && arbitrumDestinationNetwork.parentChainId !== arbitrumOriginNetwork.chainId) {
      throw new Error('Invalid network chain ids')
    }
    const isDeposit = arbitrumDestinationNetwork.parentChainId === arbitrumOriginNetwork.chainId
    const childNetwork = isDeposit ? arbitrumDestinationNetwork : arbitrumOriginNetwork
    const parentNetwork = isDeposit ? arbitrumOriginNetwork : arbitrumDestinationNetwork
    const childProvider = isDeposit ? destinationProvider : originProvider
    const parentProvider = isDeposit ? originProvider : destinationProvider
  
    const tokenMap = Object.fromEntries(
      Object.entries(_tokenMap).filter(
        ([chainId, _]: [string, string]) =>
          Number(chainId) === originNetworkChainId || Number(chainId) === destinationNetworkChainId
      )
    );
  
    if (!tokenMap[originNetworkChainId] && !tokenMap[destinationNetworkChainId]) {
      throw new Error('Token not found in token map')
    }
  
    let completeTokenMap = tokenMap
    if (!tokenMap[parentNetwork.chainId]) {
      const erc20Bridger = new Erc20Bridger(childNetwork)
      const parentAddress = await erc20Bridger.getParentErc20Address(tokenMap[childNetwork.chainId], childProvider)
      completeTokenMap = {
          [parentNetwork.chainId]: parentAddress,
          [childNetwork.chainId]: tokenMap[childNetwork.chainId],
      }
    }
    if (!tokenMap[childNetwork.chainId]) {
      const erc20Bridger = new Erc20Bridger(childNetwork)
      const childAddress = await erc20Bridger.getChildErc20Address(tokenMap[parentNetwork.chainId], parentProvider)
      completeTokenMap = {
          [childNetwork.chainId]: childAddress,
          [parentNetwork.chainId]: tokenMap[parentNetwork.chainId],
      }
    }
  
    return completeTokenMap;
  }
}
