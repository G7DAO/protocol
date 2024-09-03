import { BigNumber, ethers, Overrides } from 'ethers';
import {SignerOrProvider} from "@arbitrum/sdk/dist/lib/dataEntities/signerOrProvider";
import {GasOverrides} from "@arbitrum/sdk/dist/lib/message/ParentToChildMessageGasEstimator";

export interface TransferParams {
    /**
     * The amount of ETH or tokens to be transferred
     */
    amount: BigNumber;

    /**
     * A signer
     */
    signer: ethers.Signer;

    /**
     * Network address of the entity receiving the funds. Defaults to the signer address
     */
    destinationAddress?: string;
    /**
     * The maximum cost to be paid for submitting the transaction
     */
    maxSubmissionCost?: BigNumber;
    /**
     * The address to return any gas that was not spent on fees
     */
    excessFeeRefundAddress?: string;
    /**
     * The address to refund the call value to in the event the retryable is cancelled, or expires
     */
    callValueRefundAddress?: string;
    /**
     * Overrides for the retryable ticket parameters
     */
    retryableGasOverrides?: GasOverrides;
    /**
     * Transaction overrides
     */
    overrides?: Overrides;
}

/**
 * Represents the estimated gas and fees
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
     * The balance of tokens held by the address specified in the constructor's `from` parameter on this blockchain network.
     */
    tokenBalance?: BigNumber;

    /**
     * The symbol representing the token held on this blockchain network.
     */
    tokenSymbol?: string;

    /**
     * The allowance granted for the bridge contract to transfer tokens on behalf of the address specified in the constructor (if needed).
     */
    bridgeAllowance?: BigNumber;

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
 * Interface representing a dictionary of token addresses keyed by chain IDs.
 */
export interface TokenAddressMap {
    [chainId: number]: string;  // The key is the chain ID (number), and the value is the token address (string).
}

/**
 * Bridger for moving tokens back and forth between parent-to-child
 */
export declare class Bridger {
    /**
     * Minimum custom deposit gas limit required for transactions.
     * This constant represents the minimum amount of gas required for custom deposit transactions between networks.
     */
    static MIN_CUSTOM_DEPOSIT_GAS_LIMIT: BigNumber;

    /**
     * Creates an instance of the `Bridger` class, which facilitates token transfers between different Ethereum layers or networks.
     *
     * @param originNetworkChainId - The chain ID of the Ethereum network where the tokens are currently located.
     * @param destinationNetworkChainId - The chain ID of the Ethereum network to which the tokens will be transferred.
     * @param token - A `TokenAddressMap` object where each key is a chain ID, and each value is the token address on that chain.
     * @param from - The address initiating the transfer.
     * @param params - Optional parameters for additional configuration:
     *                 - `useLocalStorage`: If `true`, local storage is used to cache blockchain data to improve performance and reduce repeated data fetching. Default is `false`.
     *                 - `approveDepositAllowance`: If `true`, automatically approves the allowance for the token deposit. Default is `true`.
     *                   Set to `false` if the user prefers to manually manage the deposit flow and allowances.
     * @throws BridgerError if the token addresses for the provided chain IDs are missing or the bridge isn't set up for the specified networks.
     *
     */
    constructor(
        originNetworkChainId: number,
        destinationNetworkChainId: number,
        token: TokenAddressMap,
        from: string,
        params?: { useLocalStorage?: boolean, approveDepositAllowance?: boolean }
    );

    /**
     * Estimates the gas and fees required for transferring a specified amount of tokens between networks.
     *
     * @param amount - The amount of tokens to be transferred, represented as a `BigNumber`.
     * @param provider - A `SignerOrProvider` instance used to interact with the blockchain.
     *                   The provider should be connected to the source network for the estimation.
     * @param from - (Optional) The address from which estimate should be made. If provided, this
     *               address will override the `from` address specified in the constructor for this
     * @returns A promise that resolves to an object containing:
     *          - `estimatedGas`: The estimated amount of gas required for the transaction.
     *          - `gasPrice`: The current gas price.
     *          - `estimatedFee`: The estimated fee for the transaction, calculated as `estimatedGas * gasPrice`.
     *          The `estimatedFee` is calculated in Wei.
     */
    getGasAndFeeEstimation(
        amount: BigNumber,
        provider: SignerOrProvider,
        from?: string
    ): Promise<GasAndFeeEstimation>;

    /**
     * Estimates the time of arrival (ETA) for a transaction.
     *
     * @param txHash - Optional. The hash of the transaction for which the ETA is to be calculated.
     *                 If not provided, the method will estimate the ETA based on the current time
     *                 and typical transaction processing times.
     *
     * @returns A promise that resolves to a JavaScript timestamp (in milliseconds since January 1, 1970),
     *          representing the estimated time when the transaction is expected to be confirmed.
    */
    getETA(txHash?: string): Promise<number>;




    /**
     * Checks whether an allowance is needed for the specified amount of tokens before transfer.
     *
     * @param amount - The amount of tokens for which approval might be needed, represented as a `BigNumber`.
     * @param provider - A `SignerOrProvider` instance used to interact with the blockchain.
     *                   The provider should be connected to the source network where the allowance status is checked.
     * @returns A promise that resolves to:
     *          - `true` if approval is needed for the specified amount,
     *          - `false` if approval is not needed.
     */
    isApprovalRequired(
        amount: BigNumber,
        provider: SignerOrProvider
    ): Promise<boolean>;

    /**
     * Retrieves the current allowance for transferring tokens.
     *
     * @param provider - A `SignerOrProvider` instance used to interact with the blockchain.
     *                   The provider should be connected to the source network where the allowance is checked.
     * @returns A promise that resolves to a `BigNumber` representing the current allowance for token transfers.
     *          If allowance is not needed, returns `null`.
     */
    getAllowance(provider: SignerOrProvider): Promise<BigNumber | null>;

    /**
     * Fetches information about multiple blockchain networks.
     *
     * @param providers - An array of `SignerOrProvider` instances representing the networks to query.
     *
     * @returns An array of `ChainInfo` objects, each containing details about a specific blockchain network:
     *          - `chainId`: The ID of the network.
     *          - `tokenBalance`: The token balance of the address specified in the constructor's `from` parameter on the network (optional, may be omitted in case of errors).
     *          - `tokenSymbol`: The symbol of the token (optional, may be omitted in case of errors).
     *          - `bridgeAllowance`: The allowance set for the bridge contract to transfer tokens on behalf of the address specified in the constructor (null if not needed).
     *          - `gasBalance`: The gas balance of the address specified in the constructor on the network (optional, may be omitted in case of errors).
     *          - `gasSymbol`: The symbol of the gas token (optional, may be omitted in case of errors).
     */
    getChainsInfo(providers: SignerOrProvider[]): ChainInfo[];
    /**
     * Approves a specified amount of tokens for transfer.
     *
     * @param amount - The amount of tokens to approve, represented as a `BigNumber`.
     * @param signer - A `Signer` instance authorized to approve the token transfer.
     * @returns A promise that resolves to a `ContractTransaction` object representing the approval transaction.
     *          The approval transaction should be executed on the network where the tokens are held.
     */
    approve(
        amount: BigNumber,
        signer: ethers.Signer
    ): Promise<ethers.ContractTransaction>;

    /**
     * Initiates a token transfer between networks.
     *
     * @param params - A `TransferParams` object containing details for the transfer:
     *                 - `amount`: The amount of ETH or tokens to transfer.
     *                 - `signer`: The signer performing the transfer.
     *                 - `destinationAddress`: The address receiving the funds. If not provided, defaults to the `from` address specified in the constructor.
     *                 - `maxSubmissionCost`: The maximum cost for submitting the transaction (optional).
     *                 - `excessFeeRefundAddress`: Address to receive any unused gas (optional).
     *                 - `callValueRefundAddress`: Address to receive refunds if the retryable is cancelled or expires (optional).
     *                 - `retryableGasOverrides`: Overrides for retryable ticket parameters (optional).
     *                 - `overrides`: Transaction overrides (optional).
     * @returns A promise that resolves to a `ContractTransaction` object representing the transfer transaction.
     *          Ensure that the user's token balance and gas balance are sufficient for the transfer and fees.
     */
    transfer(
        params: TransferParams
    ): Promise<ethers.ContractTransaction>;
}

export {};
