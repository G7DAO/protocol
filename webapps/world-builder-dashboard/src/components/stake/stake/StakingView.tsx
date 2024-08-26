// Libraries
import { useEffect, useState } from 'react'
// Styles and Icons
import styles from './StakingView.module.css'
import { doesContractExist, tokenTypes, ZERO_ADDRESS } from '@/utils/web3utils';
import { ethers } from 'ethers';
import ActionButtonStake from '../ActionButtonStake';

const StakingView = () => {
    const [tokenAddress, setTokenAddress] = useState<string>(ZERO_ADDRESS)
    const [tokenId, setTokenId] = useState<string>('0');
    const [tokenType, setTokenType] = useState<string>(tokenTypes[0].value)
    const [lockupSeconds, setLockupSeconds] = useState<string>("0")
    const [cooldownSeconds, setCooldownSeconds] = useState<string>("0")
    const [transferable, setTransferable] = useState<boolean>(false)
    const [inputErrorMessage, setInputErrorMessage] = useState<string[]>([])
    const [networkErrorMessage, setNetworkErrorMessage] = useState<string>('')
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

    const arrayOfErrors: any[] = []

    useEffect(() => {
        if (window.ethereum) {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
        } else {
            addErrorMessage("Ethereum provider not found. Please install a wallet.");
        }
    }, [window.ethereum]);

    const addErrorMessage = (message: string) => {
        if (arrayOfErrors.includes(message) || inputErrorMessage.includes(message)) return
        setInputErrorMessage((prevMessages) => [...prevMessages, message]);
        arrayOfErrors.push(message)
    };

    const removeErrorMessage = (message: string) => {
        setInputErrorMessage((prevMessages) =>
            prevMessages.filter((msg) => msg !== message)
        );
        const index = arrayOfErrors.indexOf(message);
        if (index > -1) { // only splice array when item is found
            arrayOfErrors.splice(index, 1); // 2nd parameter means remove one item only
        }
    };

    const handleTokenSelect = (tokenValue: string) => {
        setTokenType(tokenValue)
        handleAddressChange(tokenAddress, tokenValue)
        if (tokenValue === "1") {
            setTokenAddress(ZERO_ADDRESS)
            removeErrorMessage("Token address is not an address!")
            removeErrorMessage("Token address cannot be a zero address")
            removeErrorMessage("Token contract does not exist!")
            return
        }
        if (tokenValue !== "1155") {
            setTokenId('0')
            return
        }
    }

    const handleAddressChange = async (address: string, tokenType?: string) => {
        if (tokenType === "1") {
            setTokenAddress(ZERO_ADDRESS);
            removeErrorMessage("Token address is not an address!")
            removeErrorMessage("Token address cannot be a zero address")
            removeErrorMessage("Token contract does not exist!")
            return;
        }

        setTokenAddress(address);
        // Conditions
        if (!ethers.utils.isAddress(address))
            addErrorMessage("Token address is not an address!")
        else
            removeErrorMessage("Token address is not an address!")

        if (address === ZERO_ADDRESS && tokenType !== "1")
            addErrorMessage("Token address cannot be a zero address")
        else
            removeErrorMessage("Token address cannot be a zero address")

        const contractExists = await doesContractExist(address, provider)
        if (!contractExists)
            addErrorMessage("Token contract does not exist!")
        else
            removeErrorMessage("Token contract does not exist!")

    }

    const preventNegative = (value: any) => {
        {
            if (value.key === '-' || value.key === 'e')
                value.preventDefault(); // Prevent the minus sign or 'e' from being entered
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerContainer}>
                <div className={styles.title}>Create a Pool</div>
                <div className={styles.subtitle}>Set your pool parameters</div>
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Token Type</div>
                <select className={styles.input} onChange={(e) => handleTokenSelect(e.target.value)}>
                    <option disabled>Please choose one option</option>
                    {tokenTypes.map((tokenType) => {
                        return (
                            <option key={tokenType.value} value={tokenType.value}>
                                {tokenType.label}
                            </option>
                        );
                    })}
                </select>
            </div>
            {tokenType !== "1" && (
                <div className={styles.addressContainer}>
                    <div className={styles.label}>Token Address</div>
                    <input value={tokenAddress} onChange={(e) => handleAddressChange(e.target.value, "")} />
                </div>
            )}
            {tokenType === "1155" && (
                <div className={styles.addressContainer}>
                    <div className={styles.label}>Token ID</div>
                    <input type="number" min="0" className={styles.input} value={tokenId} onChange={(e) => setTokenId(e.target.value)} onKeyDown={preventNegative} />
                </div>)}
            <div className={styles.addressContainer}>
                <div className={styles.label}>Lockdown period (in seconds)</div>
                <input type="number" min="0" className={styles.input} value={lockupSeconds} onChange={(e) => setLockupSeconds(e.target.value)} onKeyDown={preventNegative} />
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Cooldown period (in seconds)</div>
                <input type="number" min="0" className={styles.input} value={cooldownSeconds} onChange={(e) => setCooldownSeconds(e.target.value)} onKeyDown={preventNegative} />
            </div>
            <div>
                <input type="checkbox" id="horns" name="horns" checked={transferable} onChange={(e) => setTransferable(e.target.checked)} />
                <label>Can transfer NFT?</label>
            </div>
            <div>
                <input type="checkbox" id="horns" name="horns" />
                <label>Is Immutable?</label>
            </div>
            {networkErrorMessage && <div className={styles.networkErrorMessage}>{networkErrorMessage}</div>}
            {inputErrorMessage.length > 0 && <div className={styles.networkErrorMessage}>{inputErrorMessage.map((message, index) => (<p key={index}>{message}</p>))}</div>}
            <ActionButtonStake
                actionType={"CREATEPOOL"}
                params={{ tokenType, tokenAddress, tokenID: tokenId, lockupSeconds, cooldownSeconds, transferable }}
                isDisabled={inputErrorMessage.length !== 0}
                setErrorMessage={setNetworkErrorMessage}
            />
        </div>
    )
}

export default StakingView
