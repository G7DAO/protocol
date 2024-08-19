/// <reference types="vite/client" />
// types/ethereum.d.ts
import { ExternalProvider } from '@ethersproject/providers'

export interface Ethereumish extends ExternalProvider {
  request: (args: { method: string; params?: Array<any> }) => Promise<any>
  isMetaMask?: boolean
  on?: (event: string, listener: (...args: any[]) => void) => void
  removeListener?: (event: string, listener: (...args: any[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: Ethereumish
  }
}
