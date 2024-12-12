import { BigNumber, ethers, Overrides } from 'ethers';
import { BridgeNetworkConfig } from './networks';
import { TokenAddressMap } from './types';
import { SignerOrProvider } from './bridgeNetwork';
import { Bridger, GasAndFeeEstimation, TransferParams } from './bridger';
import {ERC20_ABI} from "./abi/ERC20_ABI";
import {CCTPSupportedChainId, fetchPerMessageBurnLimit, getCctpContracts} from "./utils/cctp";
import {TokenMessengerAbi} from "./abi/TokenMessagerABI";

export class CctpBridger extends Bridger {


    /**
     * Estimates gas and fees for a token transfer operation.
     * @override
     */
    async getGasAndFeeEstimation(
        amount: BigNumber,
        provider: SignerOrProvider,
        _from: string,
        destinationProvider?: SignerOrProvider
    ): Promise<GasAndFeeEstimation> {
        try {
            const {
                usdcContractAddress,
                tokenMessengerContractAddress,
                targetChainDomain
            } = getCctpContracts({
                originChainId: this.originNetwork.chainId
            })

            if (typeof provider === 'string') {
                provider = new ethers.providers.JsonRpcProvider(provider);
            }

            const contract = new ethers.Contract(
                tokenMessengerContractAddress,
                TokenMessengerAbi,
                provider
            );


            // burn token on the selected chain to be transferred from cctp contracts to the other chain

            // CCTP uses 32 bytes addresses, while EVEM uses 20 bytes addresses
            const mintRecipient = ethers.utils.hexlify(ethers.utils.zeroPad(_from, 32))

            // Estimate gas for the transaction
            const estimatedGas = await contract.estimateGas.depositForBurn(
                amount,
                targetChainDomain,
                mintRecipient,
                usdcContractAddress
            );

            // Fetch the current gas price
            const gasPrice = await provider.getGasPrice();

            // Calculate the estimated fee
            const estimatedFee = estimatedGas.mul(gasPrice);

            return { estimatedGas, gasPrice, estimatedFee };
        } catch (error) {
            console.error("Error estimating gas:", error);
            throw error;
        }    }

    /**
     * Estimates gas and fees for token approval.
     * @override
     */
    async getApprovalGasAndFeeEstimation(
        amount: BigNumber,
        _provider: SignerOrProvider,
        _from: string
    ): Promise<GasAndFeeEstimation> {
        throw new Error('getApprovalGasAndFeeEstimation is not implemented yet.');
    }

    /**
     * Gets the allowance for the deposit spender.
     * @override
     */
    public async getAllowance(
        provider: ethers.Signer | ethers.providers.Provider | string,
        account: string,
    ): Promise<BigNumber | null | undefined> {

        const { usdcContractAddress, tokenMessengerContractAddress } =
            getCctpContracts({ originChainId: this.originNetwork.chainId })

        if (typeof provider === 'string') {
            provider = new ethers.providers.JsonRpcProvider(provider);
        }

        const tokenContract = new ethers.Contract(usdcContractAddress, ERC20_ABI, provider);
        return await tokenContract.allowance(account, tokenMessengerContractAddress);
    }

    /**
     * Gets the allowance for native ETH.
     * @override
     */
    async getNativeAllowance(
        provider: ethers.Signer | ethers.providers.Provider | string,
        account: string
    ): Promise<BigNumber | null | undefined> {
        return null
    }

    /**
     * Approves a specified amount of ERC20 tokens for transfer.
     * @override
     */
    public async approve(
        amount: BigNumber,
        signer: ethers.Signer,
    ): Promise<ethers.ContractTransaction> {
        const { usdcContractAddress, tokenMessengerContractAddress } =
            getCctpContracts({ originChainId: this.originNetwork.chainId })

        const tokenContract = new ethers.Contract(usdcContractAddress, ERC20_ABI, signer);
        return tokenContract.approve(tokenMessengerContractAddress, amount);
    }

    /**
     * Approves a specified amount of native ETH for transfer.
     * @override
     */
    async approveNative(amount: BigNumber, signer: ethers.Signer): Promise<ethers.ContractTransaction> {
        throw new Error('native approval is not needed')
    }

    /**
     * Executes a token transfer between networks.
     * @override
     */
    async transfer(params: TransferParams): Promise<ethers.ContractTransaction> {
        const {signer, amount, destinationAddress } = params
        const originProvider = signer.provider
        const from = await signer.getAddress()
        if (!originProvider) {
            throw Error("Missing origin provider")
        }
        // cctp has an upper limit for transfer
        const burnLimit = await fetchPerMessageBurnLimit({
            originChainId: this.originNetwork.chainId as CCTPSupportedChainId, originProvider
        })
        if (amount.gt(burnLimit)) {
            throw Error(
                `The limit for transfers using CCTP is ${ethers.utils.formatUnits(burnLimit, 6)}. Please lower your amount and try again.`
            )
        }
        const recipient = destinationAddress ?? from
        // burn token on the selected chain to be transferred from cctp contracts to the other chain

        // CCTP uses 32 bytes addresses, while EVEM uses 20 bytes addresses
        const mintRecipient = ethers.utils.hexlify(ethers.utils.zeroPad(recipient, 32))

        const {
            usdcContractAddress,
            tokenMessengerContractAddress,
            targetChainDomain
        } = getCctpContracts({
            originChainId: this.originNetwork.chainId
        })


        const tokenMessengerContract = new ethers.Contract(
            tokenMessengerContractAddress,
            TokenMessengerAbi,
            signer
        );

        return tokenMessengerContract.depositForBurn(
            amount,
            targetChainDomain,
            mintRecipient,
            usdcContractAddress
        );

    }
}
