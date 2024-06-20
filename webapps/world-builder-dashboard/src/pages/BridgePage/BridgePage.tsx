import { ContentHeader } from "summon-ui";
import { Box } from "summon-ui/mantine";
import {useLocation} from "react-router-dom";
import BridgeView from "@/components/bridge/BridgeView";
import {BlockchainProvider} from "@/components/bridge/BlockchainContext";
import WithdrawTransactions from "@/components/bridge/WithdrawTransactions";


const BridgePage = () => {
    const location = useLocation();

    return (
        <BlockchainProvider>
            <Box px="md" bg={'#FFF'} h={'100vh'}>
                <ContentHeader name='' tabs={{ list: [], value: location.pathname }}>
                </ContentHeader>
                {location.pathname === '/bridge' && <BridgeView />}
                {location.pathname === '/bridge/transactions' && <WithdrawTransactions />}
            </Box>
        </BlockchainProvider>
    );
};

export default BridgePage;
