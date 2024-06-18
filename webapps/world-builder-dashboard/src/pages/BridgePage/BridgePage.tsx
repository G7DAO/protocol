import { ContentHeader } from "summon-ui";
import { Box } from "summon-ui/mantine";
import {useLocation, useNavigate} from "react-router-dom";
import BridgeView from "@/components/bridge/BridgeView";
import {BlockchainProvider} from "@/components/bridge/BlockchainContext";
import WithdrawTransactions from "@/components/bridge/WithdrawTransactions";

const BRIDGE_TABS = [
    {name: "Bridge", to: "/bridge"},
    {name: "Transaction history", to: "/bridge/transactions"}
]

const BridgePage = () => {
    const navigate = useNavigate()
    const location = useLocation();
    const list = BRIDGE_TABS.map((tab) => ({ name: tab.name, to: tab.to, action: () => navigate(tab.to) }))

    return (
        <BlockchainProvider>
            <Box px="md">
                <ContentHeader name='Bridge' tabs={{ list, value: location.pathname }}>
                </ContentHeader>
                {location.pathname === '/bridge' && <BridgeView />}
                {location.pathname === '/bridge/transactions' && <WithdrawTransactions />}
            </Box>
        </BlockchainProvider>
    );
};

export default BridgePage;
