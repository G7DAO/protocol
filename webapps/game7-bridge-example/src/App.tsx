import './App.css'
import { WalletProvider } from './contexts/WalletContext.tsx'

import BridgeView from './components/BridgeView.tsx'
import { QueryClient, QueryClientProvider, useQueryClient } from 'react-query'

function App() {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <BridgeView />
      </WalletProvider>
    </QueryClientProvider>
  )
}

export default App
