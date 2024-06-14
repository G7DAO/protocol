import React, {useState} from 'react';
import styles from "./BridgeView.module.css";
import {Icon} from "summon-ui";
import NetworkSelector from "@/components/bridge/NetworkSelector";
import {L3_NETWORKS, L3NetworkConfiguration} from "@/components/bridge/l3Networks";
import ValueToBridge from "@/components/bridge/ValueToBridge";
import {useQuery} from "react-query";
import TransactionSummary from "@/components/bridge/TransactionSummary";
import ActionButton from "@/components/bridge/ActionButton";
import {useBlockchainContext} from "@/components/bridge/BlockchainContext";
import {ethers} from "ethers";
import {estimateDepositFee} from "@/components/bridge/depositERC20";
import {estimateWithdrawFee} from "@/components/bridge/withdrawNativeToken";
const SYMBOL = 'G7T';
interface BridgeViewProps {
}
const BridgeView: React.FC<BridgeViewProps> = ({}) => {
    const [direction, setDirection] = useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT");
    const [value, setValue] = useState('0');
    const l2networks = ["Arbitrum Sepolia"];
    // const l2balance = useQuery(["l2Balance"], () => 9.81);

    const [selectedNetwork, setSelectedNetwork] = useState<L3NetworkConfiguration>(L3_NETWORKS[0]);
    const g7tUsdRate = useQuery(["rate"], () => 31166.75);
    const ethUsdRate = useQuery(["ethUsdRate"], () => 3572.09);
    const { L2Provider, L3Provider, connectedAccount, tokenAddress } = useBlockchainContext();

    const l2Balance = useQuery(
        ["l2Balance", connectedAccount],
        async () => {
            if (!L2Provider || !connectedAccount) {
                return "0";
            }
            console.log("fetching l2 balance")
            const ERC20Contract = new ethers.Contract(
                tokenAddress,
                [
                    {
                        "constant": true,
                        "inputs": [{"name": "_owner", "type": "address"}],
                        "name": "balanceOf",
                        "outputs": [{"name": "balance", "type": "uint256"}],
                        "type": "function"
                    },],
                L2Provider
            );

            return ERC20Contract.balanceOf(connectedAccount).then((balance: any) =>
                ethers.utils.formatEther(balance)
            );
        },
        {
            refetchInterval: 50000,
            enabled: !!connectedAccount
        }
    );

    const l3Balance = useQuery(
        ["l3Balance", connectedAccount],
        async () => {
            if (!L3Provider || !connectedAccount) {
                return "0";
            }
            const balance =  await L3Provider.getBalance(connectedAccount).then(balance =>
                ethers.utils.formatEther(balance)
            );
            console.log(balance);
            return balance;
        },
        {
            enabled: !!connectedAccount, // Only fetch when an account is connected
            refetchInterval: 50000, // Refetch every 5 seconds
        }
    );

    const estimatedFee = useQuery(["estimatedFee", value, direction], async () => {
        if (!connectedAccount) {
            return;
        }
        let est;
        console.log(value, connectedAccount, L2Provider, direction)
        if (direction === 'DEPOSIT') {
            est  = await estimateDepositFee(value, connectedAccount, selectedNetwork);
        } else {
        if (L2Provider) {
            est = await estimateWithdrawFee(value, connectedAccount, L2Provider);
        }
        }

        console.log(est);
        return est;
    })

    const renderNetworkSelect = (isSource: boolean, direction: "DEPOSIT" | "WITHDRAW") => {
        if ((isSource && direction === 'DEPOSIT') || (!isSource && direction === "WITHDRAW")) {
            return (
                <div className={styles.network}>
                    {l2networks[0]}
                </div>
            )
        } else {
            return (
                <NetworkSelector networks={L3_NETWORKS} selectedNetwork={selectedNetwork} onChange={setSelectedNetwork} />
            )
        }
    }


    return (
        <div className={styles.container}>
            <div className={styles.directionContainer}>
              <button className={direction === "DEPOSIT" ? styles.selectedDirectionButton : styles.directionButton}
                      onClick={() => setDirection("DEPOSIT")}>Deposit
              </button>
              <button className={direction === "WITHDRAW" ? styles.selectedDirectionButton : styles.directionButton}
                      onClick={() => setDirection("WITHDRAW")}>Withdraw
              </button>

          </div>
          <div className={styles.networksContainer}>
              <div className={styles.networkSelect}>
                  <label htmlFor="network-select-from" className={styles.label}>From</label>
                  {renderNetworkSelect(true, direction)}
              </div>
              <Icon name={"ArrowRight"} top={'29px'} color={'#667085'}/>
              <div className={styles.networkSelect}>
                  <label htmlFor="network-select-to" className={styles.label}>To</label>
                  {renderNetworkSelect(false, direction)}
              </div>
          </div>
          <ValueToBridge title={direction === 'DEPOSIT' ? 'Deposit' : 'Withdraw'} symbol={SYMBOL} value={value} setValue={setValue} balance={direction === 'DEPOSIT' ? (l2Balance.data ?? '0') : (l3Balance.data ?? '0')} rate={g7tUsdRate.data ?? 0}/>
          <TransactionSummary direction={direction} ethBalance={Number(l3Balance.data ?? 0)} address={connectedAccount ?? '0x'} transferTime={'< min'} fee={Number(estimatedFee.data ?? 0)} value={Number(value)} ethRate={ethUsdRate.data ?? 0} tokenSymbol={SYMBOL} tokenRate={g7tUsdRate.data ?? 0} />
          <ActionButton direction={direction} l3Network={selectedNetwork} amount={value}/>
      </div>
  );
};

export default BridgeView;
