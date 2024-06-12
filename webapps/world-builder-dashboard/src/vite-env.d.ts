/// <reference types="vite/client" />
// types/ethereum.d.ts

import { ExternalProvider } from '@ethersproject/providers';

export interface Ethereumish extends ExternalProvider {
    isMetaMask?: boolean;
    on?: (event: string, listener: (...args: any[]) => void) => void;
    removeListener?: (event: string, listener: (...args: any[]) => void) => void;
}

declare global {
    interface Window {
        ethereum?: Ethereumish;
    }
}