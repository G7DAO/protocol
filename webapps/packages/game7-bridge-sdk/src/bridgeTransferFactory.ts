import {CctpBridgeTransfer} from "./cctpBridgeTransfer";
import {networks} from "./networks";
import {getProvider} from "./utils/web3Utils";
import {isCctp} from "./utils/cctp";
import {BridgeTransfer, BridgeTransferInfo, BridgeTransferParams} from "./bridgeTransfer";

export async function getBridgeTransfer(params: BridgeTransferParams, isCctp: boolean | undefined): Promise<BridgeTransfer> {
    if (typeof isCctp !== 'boolean') {
        const { bridgeTransfer } = await getBridgerTransferAndInfo(params) //TODO cache .info
        return bridgeTransfer
    }
    if (isCctp) {
        return new CctpBridgeTransfer(params)
    }
    return new BridgeTransfer(params)
}

async function getBridgerTransferAndInfo(params: BridgeTransferParams): Promise<{bridgeTransfer: BridgeTransfer, info: BridgeTransferInfo}> {
    const originNetwork = networks[params.originNetworkChainId];
    const originProvider = getProvider(params.originSignerOrProviderOrRpc ?? originNetwork.rpcs[0]);
    const tx =  await originProvider.getTransaction(params.txHash);
    const bridgeTransfer = isCctp(originNetwork.chainId, tx.to ?? '') ?
        new CctpBridgeTransfer(params) :
        new BridgeTransfer(params)
    const info = await bridgeTransfer.getInfo(tx)
    return { bridgeTransfer, info }
}
