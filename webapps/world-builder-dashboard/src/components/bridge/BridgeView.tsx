// Libraries
import React, {useEffect, useState} from 'react';
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
import {L2_CHAIN} from "../../../constants";
import HistoryHeader from "@/components/bridge/HistoryHeader";
import {useL2ToL1MessagesStatus} from "@/hooks/useL2ToL1MessageStatus";
import ArbitrumOneIcon from "@/assets/ArbitrumOneIcon";


const getNetworkRPC = (chainId: number) => {
    const network = L3_NETWORKS.find((n) => n.chainInfo.chainId === chainId);
    return network?.chainInfo.rpcs[0];
}



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

    const txs = useQuery(["incomingMessages", connectedAccount], () => {
        const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`);

        // const oldTxs =  [
            // {txHash: "0x8f6dc2e0c892bb97465c5e72718519cb88879741f3b33b198053273708d5106b", chainId: 1398587, delay: 15 * 60 },
            // {txHash: "0xe7c19970aaded18b26f0d7f2dae3244cf7a09b4c0806c209dba812a3e051b932",  chainId: 1398587, delay: 15 * 60 },
            // {txHash: "0xed4a7149543497167d779789d8e79ef6155cf4640556cd5fe26917cbbfff920c", chainId: 1398587, delay: 15 * 60 },
            // {txHash: "0x0785921358d1af5f6423d05d0249e93b906aa82fad791d5fe575e715f3d3ffd1", chainId: 1398587, delay: 15 * 60 },
            // {txHash: "0x478107cfefc8e01c64098c922415f8a5af80c1f5db5d834ad45758ae754d4e74", chainId: 1398587, delay: 15 * 60 },
            // {txHash: "0x88d55459af84e1395a69e1eea281b887b390054950d8ebd23bc4f80fedaf3013", chainId: 1398587, delay: 15 * 60 },
            // {txHash: "0x2f6f305784ffff4dec4b96f9b9a4f8a9436ea7e436e0269bf9d6129de7a736ea", chainId: 1398587, delay: 15 * 60 },
            // {txHash: "0x2a24d4992cff92b526d27571a37448eeb536a6cf71466a78073452a11c899e6d", chainId: 1398587, delay: 15 * 60 },
            // // {txHash: "0x8e762b1f219fa5c571973c8d092792d68e602ffbd9aae9f3cc9c3df5d453fd61", chainId: 1398587, delay: 15 * 60 }, //INVALID TRANSACTION TODO: investigate
            // {txHash: "0x968a96df2454bd844d18db8bc7e60487266223ad031319a375e5c4b4c3688e69", chainId: 1398587, delay: 15 * 60 },
            // {txHash: "0x21fa998c08a0bbbf31a0743fc2a610c300d969ace68cc864aa34da166200bf5c", chainId: 1398587, delay: 15 * 60 },
            // {txHash: "0xbf120cfba34d2fcf6babecaace86d1a03f11f3fb8f8f1e0526a8ac8d42a170ee", chainId: 1398587, delay: 15 * 60 },
        // ];
        if (transactionsString) {
            return JSON.parse(transactionsString).map((tx: any) => ({...tx, l2RPC: L2_CHAIN.rpcs[0], l3RPC: getNetworkRPC(tx.chainId) ?? ''}));
        } else {
            return [];
        }
    }, {
        onSuccess: (data) => {
            console.log(data);
        }
    })

    const transactions = useL2ToL1MessagesStatus(txs.data);

    useEffect(() => {
        console.log(transactions);
    }, [transactions]);


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
                    <ArbitrumOneIcon />
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
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '100px'}}>
            <HistoryHeader messages={transactions ? transactions?.filter((t) => t).map((t) => t.data) : undefined}/>
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
                  <Icon name={"ArrowRight"} top={'12px'} color={'#667085'}/>
                  <div className={styles.networkSelect}>
                      <label htmlFor="network-select-to" className={styles.label}>To</label>
                      {renderNetworkSelect(false, direction)}
                  </div>
              </div>
              <ValueToBridge title={direction === 'DEPOSIT' ? 'Deposit' : 'Withdraw'} symbol={SYMBOL} value={value} setValue={setValue} balance={direction === 'DEPOSIT' ? (l2Balance ?? '0') : (l3NativeBalance ?? '0')} rate={g7tUsdRate.data ?? 0}/>
              <TransactionSummary direction={direction} gasBalance={Number((direction === "DEPOSIT" ? l2NativeBalance : l3NativeBalance) ?? 0)} address={connectedAccount ?? '0x'} transferTime={direction === 'DEPOSIT' ? '< min' : '~15 min'} fee={Number(estimatedFee.data ?? 0)} value={Number(value)} ethRate={ethUsdRate ?? 0} tokenSymbol={SYMBOL} tokenRate={g7tUsdRate.data ?? 0} />
              <ActionButton direction={direction} l3Network={selectedNetwork} amount={value}/>
          </div>
      </div>
  );
};

export default BridgeView;
