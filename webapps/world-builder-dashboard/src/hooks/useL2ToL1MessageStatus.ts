import {useQuery} from "react-query";
import {ethers} from "ethers";
import {L2ToL1MessageReader, L2ToL1MessageStatus, L2TransactionReceipt} from "@arbitrum/sdk";

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

const useL2ToL1MessageStatus = (txHash: string, l2RPC: string, l3RPC: string) => {
    return useQuery(
        ["withdrawalStatus", txHash, l2RPC, l3RPC],
        async () => {
            console.log("checking status", txHash.slice(0, 6), l2RPC, l3RPC);
            const l3Provider = new ethers.providers.JsonRpcProvider(l3RPC);
            const l2Provider =  new ethers.providers.JsonRpcProvider(l2RPC);
            const receipt = await l3Provider.getTransactionReceipt(txHash);
            const l2Receipt = new L2TransactionReceipt(receipt);
            const log = receipt.logs.find((l) => l.data !== "0x");
            let decodedLog;

            if (log) {
                try {
                    const iface = new ethers.utils.Interface(eventABI);
                    decodedLog = iface.parseLog(log);
                } catch (e) {
                    console.log(log, e);
                }
            }


            const messages: L2ToL1MessageReader[] = (await l2Receipt.getL2ToL1Messages(l2Provider)) as L2ToL1MessageReader[];
            const l2ToL1Msg: L2ToL1MessageReader = messages[0];
            const status: L2ToL1MessageStatus = await l2ToL1Msg.status(l3Provider);

            return {
                from: decodedLog?.args?.caller,
                to: decodedLog?.args?.destination,
                value: ethers.utils.formatEther(decodedLog?.args?.callvalue ?? "0"),
                timestamp: decodedLog?.args?.timestamp,
                confirmations: receipt.confirmations,
                status,
                l2Receipt,
            };
        },
        {
            refetchInterval: 60000 * 3,
        }
    );
};

export default useL2ToL1MessageStatus;