import {TokenAddressMap} from "./types";
import {CctpBridger} from "./cctpBridger";
import {isNativeUSDC} from "./utils/cctp";
import {Bridger} from "./bridger";

export function getBridger(originNetworkChainId: number,
    destinationNetworkChainId: number,
    token: TokenAddressMap,
    params?: { useLocalStorage?: boolean; approveDepositAllowance?: boolean }) {
    if (isNativeUSDC(originNetworkChainId, token[originNetworkChainId])) {
        return new CctpBridger(originNetworkChainId, destinationNetworkChainId, token, params)
    }
    return new Bridger(originNetworkChainId, destinationNetworkChainId, token, params)
}
