import utc from "dayjs/plugin/utc";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { QueryClient, QueryClientProvider } from "react-query";
import { ThemeProvider, AssetsProvider, Tenant } from "summon-ui";
import { IntlProvider } from "summon-ui/intl";
import { Notifications } from "summon-ui/mantine";
import { AuthProvider } from "@/providers/AuthProvider";
import router from "@/router";
import en from "@/lang/en.json";
import { RouterProvider } from "react-router-dom";

dayjs.extend(utc);
dayjs.extend(timezone);

//@Todo remove when summon-ui/intl exports the type
type LangKey = "en" | "ja";

const NOTIFICATIONS_SPACING = "30px";
const NOTIFICATIONS_STYLES = {
  root: { top: NOTIFICATIONS_SPACING, right: NOTIFICATIONS_SPACING },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: 1000 * 60 * 5, //5 minutes,
    },
  },
});

const enMessages = { en };

//@TODO we need to set this dynamically
const TENANT_CONFIG = {
  name: "Game7",
  lang: "en",
  uiTheme: "light",
};
const { name, lang, uiTheme } = TENANT_CONFIG;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AssetsProvider tenant={name as Tenant}>
        <IntlProvider
          intlConf={{
            currentLang: lang as LangKey,
            messagesConf: {
              ...enMessages,
            },
          }}
        >
          <ThemeProvider uiTheme={uiTheme}>
            <Notifications
              position="top-right"
              zIndex={1000}
              styles={NOTIFICATIONS_STYLES}
            />
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </ThemeProvider>
        </IntlProvider>
      </AssetsProvider>
    </QueryClientProvider>
  );
}
