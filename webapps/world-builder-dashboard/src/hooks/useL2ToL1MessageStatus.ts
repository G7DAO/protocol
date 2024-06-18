import {useQuery} from "react-query";
import {ethers} from "ethers";
import {L2ToL1MessageStatus, L2ToL1MessageWriter, L2TransactionReceipt} from "@arbitrum/sdk";
import {L3_NETWORKS} from "@/components/bridge/l3Networks";

const eventABI = [{
    anonymous: false,
    inputs: [
        { indexed: false, internalType: "address", name: "caller", type: "address" },
        { indexed: true, internalType: "address", name: "destination", type: "address" },
        { indexed: true, internalType: "uint256", name: "hash", type: "uint256" },
        { indexed: true, internalType: "uint256", name: "position", type: "uint256" },
        { indexed: false, internalType: "uint256", name: "arbBlockNum", type: "uint256" },
        { indexed: false, internalType: "uint256", name: "ethBlockNum", type: "uint256" },
        { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
        { indexed: false, internalType: "uint256", name: "callvalue", type: "uint256" },
        { indexed: false, internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "L2ToL1Tx",
    type: "event",
}];

const useL2ToL1MessageStatus = (txHash: string, chainId: number) => {
    return useQuery(
        ["withdrawalStatus", txHash, chainId],
        async () => {
            console.log("checking status", txHash.slice(0, 6));
            const l3Network = L3_NETWORKS.find((n) => n.chainInfo.chainId === chainId);
            const l3Provider = new ethers.providers.JsonRpcProvider(l3Network?.chainInfo.rpcs[0]);
            const receipt = await l3Provider.getTransactionReceipt(txHash);
            const l2Receipt = new L2TransactionReceipt(receipt);
            const log = receipt.logs.find((l) => l.data !== "0x");
            let decodedLog;
            let ethProvider;

            if (log) {
                try {
                    const iface = new ethers.utils.Interface(eventABI);
                    decodedLog = iface.parseLog(log);
                } catch (e) {
                    console.log(log, e);
                }
            }

            if (typeof window.ethereum !== "undefined") {
                ethProvider = new ethers.providers.Web3Provider(window.ethereum);
            } else {
                console.log("Please install MetaMask!");
                return;
            }

            if (!ethProvider) {
                console.log("!ethProvider");
                return;
            }

            const signer = ethProvider.getSigner();
            const messages: L2ToL1MessageWriter[] = await l2Receipt.getL2ToL1Messages(signer) as L2ToL1MessageWriter[];
            const l2ToL1Msg: L2ToL1MessageWriter = messages[0];
            const status: L2ToL1MessageStatus = await l2ToL1Msg.status(l3Provider);

            return {
                from: decodedLog?.args?.caller,
                to: decodedLog?.args?.destination,
                value: ethers.utils.formatEther(decodedLog?.args?.callvalue ?? "0"),
                timestamp: decodedLog?.args?.timestamp,
                confirmations: receipt.confirmations,
                status,
            };
        },
        {
            refetchInterval: 60000 * 3,
        }
    );
};

export default useL2ToL1MessageStatus;