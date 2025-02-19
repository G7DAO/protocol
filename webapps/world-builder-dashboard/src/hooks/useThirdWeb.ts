import { createThirdwebClient } from "thirdweb"
import { useMemo } from "react"
import { createWallet } from "thirdweb/wallets"

export function useThirdWeb() {
    const wallets = [
        createWallet("io.metamask"),
        createWallet("com.coinbase.wallet"),
        createWallet("me.rainbow"),
        createWallet("io.rabby"),
        createWallet("io.zerion.wallet"),
        createWallet("com.trustwallet.app"),
        createWallet("com.bitget.web3"),
        createWallet("org.uniswap"),
        createWallet("com.okex.wallet"),
        createWallet("com.binance"),
    ];

    const client = useMemo(
        () =>
            createThirdwebClient({
                clientId: '--',
                secretKey: '--',
            }),
        []
    );

    return { client, wallets }
}