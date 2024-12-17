import { ZERO_ADDRESS } from "@/utils/web3utils";
import useERC20Balance from "./useERC20Balance";
import useNativeBalance from "./useNativeBalance";


const useTokenBalance = (tokenAddress: string, rpc: string, connectedAccount: string | undefined)=> {
    if (tokenAddress === ZERO_ADDRESS) {
        const { data: balance, isFetching } = useNativeBalance({
            account: connectedAccount,
            rpc,
        });
        return { balance, isFetching };
    } else {
        const { data: balance, isFetching } = useERC20Balance({
            tokenAddress: tokenAddress,
            account: connectedAccount,
            rpc,
        });
        const formattedBalance = balance?.formatted
        return { balance: formattedBalance, isFetching };
    }
};

export default useTokenBalance