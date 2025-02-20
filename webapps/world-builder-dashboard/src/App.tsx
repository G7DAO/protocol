import '@reservoir0x/relay-kit-ui/styles.css'
import './styles/global.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { FIVE_MINUTES } from '../constants'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { MantineProvider } from '@mantine/core'
import { IntlProvider as ReactIntlProvider } from 'react-intl'
import { Notifications } from '@mantine/notifications'
import { BlockchainProvider } from '@/contexts/BlockchainContext'
import { BridgeNotificationsProvider } from '@/contexts/BridgeNotificationsContext'
import { UISettingsProvider } from '@/contexts/UISettingsContext'
import { TransactionProvider } from './contexts/TransactionsContext'
import en from '@/lang/en.json'
import ja from '@/lang/ja.json'
import { AuthProvider } from '@/providers/AuthProvider'
import router from '@/router'

// relay stuff
import { RelayKitProvider } from '@reservoir0x/relay-kit-ui'
import { WagmiProvider } from 'wagmi'
import { MAINNET_RELAY_API } from '@reservoir0x/relay-sdk'
import { theme } from './utils/relayTheme'
import '@reservoir0x/relay-kit-ui/styles.css'
import { wagmiConfig, chains } from './utils/relayConfig'

dayjs.extend(utc)
dayjs.extend(timezone)

//@Todo remove when summon-ui/intl exports the type
type LangKey = 'en' | 'ja'

const NOTIFICATIONS_SPACING = '30px'
const NOTIFICATIONS_STYLES = {
  root: { top: NOTIFICATIONS_SPACING, right: NOTIFICATIONS_SPACING }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: FIVE_MINUTES
    }
  }
})


//@TODO we need to set this dynamically
const TENANT_CONFIG: { name: string, lang: string, uiTheme: string } = {
  name: 'Game7',
  lang: 'en',
  uiTheme: 'light'
}
const { lang } = TENANT_CONFIG

type MessagesConf = {
  en: Record<string, string>
  ja?: Record<string, string>
}


const mergeMessages = (messages: MessagesConf): MessagesConf => {
  return {
    en: { ...en, ...messages.en },
    ja: { ...ja, ...messages.ja }
  }
}

const currentMessages = mergeMessages({ en, ja })


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BlockchainProvider>
        <UISettingsProvider>
          <ReactIntlProvider
            locale={lang as LangKey}
            defaultLocale='en'
            messages={currentMessages['en']}
          >
            <MantineProvider>
              <BridgeNotificationsProvider>
                <Notifications position='top-right' zIndex={1000} styles={NOTIFICATIONS_STYLES} />
                <TransactionProvider>
                  <AuthProvider>
                    <RelayKitProvider
                      theme={theme}
                      options={{
                        appName: 'DevHub Relay Bridge',
                        appFees: [
                          {
                            recipient: '0xE2f669A23f83Aaa69Cc8C918bF4397E4eddA4B01',
                            fee: '175' // 1.75%
                          }
                        ],
                        chains,
                        baseApiUrl: MAINNET_RELAY_API
                      }}>
                      <WagmiProvider config={wagmiConfig}>
                        <RouterProvider router={router} />
                      </WagmiProvider>
                    </RelayKitProvider>
                  </AuthProvider>
                </TransactionProvider>
              </BridgeNotificationsProvider>
            </MantineProvider>
          </ReactIntlProvider>
        </UISettingsProvider>
      </BlockchainProvider>
    </QueryClientProvider >
  )
}
