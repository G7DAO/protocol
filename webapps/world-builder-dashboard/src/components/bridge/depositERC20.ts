import {ethers, providers, utils} from "ethers";
import { NODE_INTERFACE_ADDRESS } from "@arbitrum/sdk/dist/lib/dataEntities/constants";
import { NodeInterface__factory } from "@arbitrum/sdk/dist/lib/abi/factories/NodeInterface__factory";
import {L3NetworkConfiguration} from "@/components/bridge/l3Networks";
import {convertToBigNumber} from "@/utils/web3utils";

const L2_RPC = "https://sepolia-rollup.arbitrum.io/rpc";
const l2Provider = new providers.JsonRpcProvider(L2_RPC);

const ERC20_INBOX_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "depositERC20",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export const estimateDepositFee = async (
    amount: string,
    account: string,
    l3Network: L3NetworkConfiguration,
) => {
    const destinationAddress = l3Network.coreContracts.inbox;

    const ethAmount = convertToBigNumber(amount);
    const ERC20InboxContract = new ethers.Contract(
        l3Network.coreContracts.inbox,
        ERC20_INBOX_ABI,
        l2Provider
    );
    const tx = await ERC20InboxContract.populateTransaction.depositERC20(ethAmount);
    const data = tx.data;

    const nodeInterface = NodeInterface__factory.connect(NODE_INTERFACE_ADDRESS, l2Provider);
    if (data) {
        const gasEstimateComponents = await nodeInterface.callStatic.gasEstimateComponents(
            destinationAddress,
            false,
            data,
            {
                from: account,
            }
        );
        // Getting useful values for calculating the formula
        const l1GasEstimated = gasEstimateComponents.gasEstimateForL1;
        const l2GasUsed = gasEstimateComponents.gasEstimate.sub(gasEstimateComponents.gasEstimateForL1);
        const l2EstimatedPrice = gasEstimateComponents.baseFee;
        const l1EstimatedPrice = gasEstimateComponents.l1BaseFeeEstimate.mul(16);

        // Calculating some extra values to be able to apply all variables of the formula
        // -------------------------------------------------------------------------------
        // NOTE: This one might be a bit confusing, but l1GasEstimated (B in the formula) is calculated based on l2 gas fees
        const l1Cost = l1GasEstimated.mul(l2EstimatedPrice);
        // NOTE: This is similar to 140 + utils.hexDataLength(txData);
        const l1Size = l1Cost.div(l1EstimatedPrice);

        // Getting the result of the formula
        // ---------------------------------
        // Setting the basic variables of the formula
        const P = l2EstimatedPrice;
        const L2G = l2GasUsed;
        const L1P = l1EstimatedPrice;
        const L1S = l1Size;

        // L1C (L1 Cost) = L1P * L1S
        const L1C = L1P.mul(L1S);

        // B (Extra Buffer) = L1C / P
        const B = L1C.div(P);

        // G (Gas Limit) = L2G + B
        const G = L2G.add(B);

        // TXFEES (Transaction fees) = P * G
        const TXFEES = P.mul(G);

        console.log("Gas estimation components");
        console.log("-------------------");
        console.log(`Full gas estimation = ${gasEstimateComponents.gasEstimate.toNumber()} units`);
        console.log(`L2 Gas (L2G) = ${L2G.toNumber()} units`);
        console.log(`L1 estimated Gas (L1G) = ${l1GasEstimated.toNumber()} units`);

        console.log(`P (L2 Gas Price) = ${utils.formatUnits(P, "gwei")} gwei`);
        console.log(
            `L1P (L1 estimated calldata price per byte) = ${utils.formatUnits(L1P, "gwei")} gwei`,
        );
        console.log(`L1S (L1 Calldata size in bytes) = ${L1S} bytes`);

        console.log("-------------------");
        console.log(`Transaction estimated fees to pay = ${utils.formatEther(TXFEES)} ETH`);
        return utils.formatEther(TXFEES);
    }
};

export const sendDepositTransaction = async (
    amount: string,
    account: string,
    l3Network: L3NetworkConfiguration,
    l2Provider: ethers.providers.Web3Provider
) => {
    const destinationAddress = l3Network.coreContracts.inbox;
    const ethAmount = convertToBigNumber(amount);
    const ERC20InboxContract = new ethers.Contract(
        destinationAddress,
        ERC20_INBOX_ABI,
        l2Provider.getSigner(account),
    );

    const txRequest = await ERC20InboxContract.populateTransaction.depositERC20(ethAmount);

    const txResponse = await l2Provider.getSigner(account).sendTransaction(txRequest);

    console.log('Transaction hash:', txResponse.hash);

    // Wait for the transaction to be mined
    const receipt = await txResponse.wait();
    console.log('Transaction was mined in block', receipt.blockNumber);

    return receipt;
};
