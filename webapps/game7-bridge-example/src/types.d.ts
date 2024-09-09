import React from "react";

export interface NetworkInterface {
    chainId: number
    name: string
    displayName?: string
    rpcs: Array<string>
    ABIScan?: { name: string; url: string }
    nativeCurrency?: {
        decimals: number
        name: string
        symbol: string
    }
    blockExplorerUrls?: string[]
    g7TokenAddress: string
    l2Router?: string
    l1GatewayRouter?: string
    routerSpender?: string
    retryableCreationTimeout?: number //seconds
    challengePeriod?: number //seconds
    staker?: string
    inbox?: string
    icon?: React.FC
}
