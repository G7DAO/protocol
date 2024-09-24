import { NetworkInterface } from '@/contexts/BlockchainContext'

export interface User {
  firstName: string
  lastName: string
  email: string
}

export interface LoginData {
  email: string
  password: string
}

export interface ERC20AllowanceProps {
  network: NetworkInterface
  spender: string | undefined
  tokenAddress: string
}
