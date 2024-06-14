// Libraries
import React, { useState } from 'react';
import { useQuery } from 'react-query';

// Styles and Icons
import styles from "./BridgeView.module.css";
import { Icon } from "summon-ui";

// Components
import NetworkSelector from "@/components/bridge/NetworkSelector";
import ValueToBridge from "@/components/bridge/ValueToBridge";
import TransactionSummary from "@/components/bridge/TransactionSummary";
import ActionButton from "@/components/bridge/ActionButton";

// Blockchain Context and Utility Functions
import { useBlockchainContext } from "@/components/bridge/BlockchainContext";
import { estimateDepositFee } from "@/components/bridge/depositERC20";
import { estimateWithdrawFee } from "@/components/bridge/withdrawNativeToken";

// Hooks and Constants
import useEthUsdRate from "@/hooks/useEthUsdRate";
import { L3_NETWORKS, L3NetworkConfiguration } from "@/components/bridge/l3Networks";
import useERC20Balance from "@/hooks/useERC20Balance";
import useNativeBalance from "@/hooks/useNativeBalance";

const SYMBOL = 'G7T';

const BridgeView: React.FC = () => {
    const [direction, setDirection] = useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT");
    const [value, setValue] = useState('0');
    const l2networks = ["Arbitrum Sepolia"];

    const [selectedNetwork, setSelectedNetwork] = useState<L3NetworkConfiguration>(L3_NETWORKS[0]);
    const g7tUsdRate = useQuery(["rate"], () => 31166.75);
    const { data: ethUsdRate } = useEthUsdRate();
    const { L2Provider, connectedAccount, tokenAddress, L2_RPC, L3_RPC } = useBlockchainContext();
    const {data: l2Balance} = useERC20Balance({tokenAddress, account: connectedAccount, rpc: L2_RPC});
    const {data: l3NativeBalance} = useNativeBalance({account: connectedAccount, rpc: L3_RPC});
    const {data: l2NativeBalance} = useNativeBalance({account: connectedAccount, rpc: L2_RPC});

    const estimatedFee = useQuery(["estimatedFee", value, direction], async () => {
        if (!connectedAccount) {
            return;
        }
        let est;
        if (direction === 'DEPOSIT') {
            est  = await estimateDepositFee(value, connectedAccount, selectedNetwork);
        } else {
            if (L2Provider) {
                est = await estimateWithdrawFee(value, connectedAccount, L2Provider);
            }
        }
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
          <ValueToBridge title={direction === 'DEPOSIT' ? 'Deposit' : 'Withdraw'} symbol={SYMBOL} value={value} setValue={setValue} balance={direction === 'DEPOSIT' ? (l2Balance ?? '0') : (l3NativeBalance ?? '0')} rate={g7tUsdRate.data ?? 0}/>
          <TransactionSummary direction={direction} ethBalance={Number(l2NativeBalance ?? 0)} address={connectedAccount ?? '0x'} transferTime={'< min'} fee={Number(estimatedFee.data ?? 0)} value={Number(value)} ethRate={ethUsdRate ?? 0} tokenSymbol={SYMBOL} tokenRate={g7tUsdRate.data ?? 0} />
          <ActionButton direction={direction} l3Network={selectedNetwork} amount={value}/>
      </div>
  );
};

export default BridgeView;
