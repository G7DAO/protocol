import {BridgeTransferStatus, BridgeTransferType} from "../bridgeTransfer";
import {TokenAddressMap} from "../types";
import {ethers} from "ethers";
import {ERC20_ABI} from "../abi/ERC20_ABI";

export const bridgeTransferTypeMessages: Record<BridgeTransferType, string> = {
    [BridgeTransferType.WITHDRAW_ERC20]: "Withdraw ERC20 Token",
    [BridgeTransferType.WITHDRAW_GAS]: "Withdraw Gas",
    [BridgeTransferType.DEPOSIT_ERC20]: "Deposit ERC20 Token",
    [BridgeTransferType.DEPOSIT_GAS]: "Deposit Gas",
    [BridgeTransferType.DEPOSIT_ERC20_TO_GAS]: "Deposit ERC20 to Gas",
    [BridgeTransferType.DEPOSIT_CCTP]: "Deposit via CCTP",
    [BridgeTransferType.WITHDRAW_CCTP]: "Withdraw via CCTP"
};

export const BridgeTransferStatusToString: { [key in BridgeTransferStatus]: string } = {
    [BridgeTransferStatus.WITHDRAW_UNCONFIRMED]: "Withdraw Unconfirmed",
    [BridgeTransferStatus.WITHDRAW_CONFIRMED]: "Withdraw Confirmed",
    [BridgeTransferStatus.WITHDRAW_EXECUTED]: "Withdraw Executed",
    [BridgeTransferStatus.DEPOSIT_ERC20_NOT_YET_CREATED]: "Deposit ERC20 Not Yet Created",
    [BridgeTransferStatus.DEPOSIT_ERC20_CREATION_FAILED]: "Deposit ERC20 Creation Failed",
    [BridgeTransferStatus.DEPOSIT_ERC20_FUNDS_DEPOSITED_ON_CHILD]: "Deposit ERC20 Funds Deposited on Child",
    [BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED]: "Deposit ERC20 Redeemed",
    [BridgeTransferStatus.DEPOSIT_ERC20_EXPIRED]: "Deposit ERC20 Expired",
    [BridgeTransferStatus.DEPOSIT_GAS_PENDING]: "Deposit Gas Pending",
    [BridgeTransferStatus.DEPOSIT_GAS_DEPOSITED]: "Deposit Gas Deposited",
    [BridgeTransferStatus.CCTP_PENDING]: "CCTP Pending",
    [BridgeTransferStatus.CCTP_COMPLETE]: "CCTP Complete",
    [BridgeTransferStatus.CCTP_REDEEMED]: "CCTP Redeemed"
};

export const logBalance = async (token: TokenAddressMap, chainId: number, provider: ethers.providers.Provider, from, decimals: number, label: string) => {
    const tokenAddress = token[chainId]

    if (tokenAddress === ethers.constants.AddressZero) {
        const balance = await provider.getBalance(from);
        console.log(label, ethers.utils.formatUnits(balance, decimals))
    } else {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(from);
        console.log(label, ethers.utils.formatUnits(balance, decimals))
    }
}

export const getTypeMessage = (type: BridgeTransferType): string => {
    return bridgeTransferTypeMessages[type];
};


export const TG7T: TokenAddressMap = {
    13746: '0x0000000000000000000000000000000000000000',
    421614: '0x10adbf84548f923577be12146eac104c899d1e75',
    11155111: '0xe2ef69e4af84dbefb0a75f8491f27a52bf047b01'
}

export const ETH: TokenAddressMap = {
    421614: '0x0000000000000000000000000000000000000000',
    11155111: '0x0000000000000000000000000000000000000000'
}

export const ETH_MAINNET: TokenAddressMap = {
    42161: '0x0000000000000000000000000000000000000000',
    1: '0x0000000000000000000000000000000000000000'
}

export const TG7_MAINNET: TokenAddressMap = {
    1: '0x12c88a3C30A7AaBC1dd7f2c08a97145F5DCcD830',
    42161: '0xF18e4466F26B4cA55bbAb890b314a54976E45B17',
    2187: '0x0000000000000000000000000000000000000000',
}


export const USDC_MAINNET: TokenAddressMap = {
    2187: '0x401eCb1D350407f13ba348573E5630B83638E30D',
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
}

export const USDC: TokenAddressMap = {
    11155111: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
    421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    13746: '0xf2B58E3519C5b977a254993A4A6EaD581A8989A0',
}

export const rpcs: { [key: number]: string } = {
    42161: "https://nb.moonstream.to/nb/arbitrum-one/jsonrpc/7d3d4cb1-1228-48da-b5b6-ea3f37a43c90",
    1: "https://mainnet.infura.io/v3/0eddb9de2a4043c4b6728e160cfc7fa1",
    2187: "https://mainnet-rpc.game7.io",
    13746: "https://nb.moonstream.to/nb/game7-testnet/jsonrpc/7d3d4cb1-1228-48da-b5b6-ea3f37a43c90",
    11155111: "https://ethereum-sepolia-rpc.publicnode.com",
    421614: `${process.env.NB_JSON_RPC_URI}/arbitrum-sepolia/jsonrpc/${process.env.NB_WB_DASHBOARD_ACCESS_ID}`,
};







