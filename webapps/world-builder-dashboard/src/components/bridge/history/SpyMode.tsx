import React, {ChangeEvent, useEffect, useState} from 'react';
import {ethers} from "ethers";
import styles from "./SpyMode.module.css";

interface SpyModeProps {
    isSpyMode: boolean;
    setIsSpyMode: (arg0: boolean) => void;
    onSpyAddress: (address: string) => void;
}
const SpyMode: React.FC<SpyModeProps> = ({isSpyMode, setIsSpyMode, onSpyAddress}) => {
    const [cheatCode, setCheatCode] = useState('')
    const [address, setAddress] = useState('')
    const [isValid, setIsValid] = useState(false)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newAddress = e.target.value
        const isNewAddressValid = ethers.utils.isAddress(newAddress)
        setAddress(newAddress)
        setIsValid(isNewAddressValid)
        onSpyAddress(isNewAddressValid ? newAddress : '')
    }

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            setCheatCode((prev) => (prev + event.key).slice(-10));
        };

        window.addEventListener("keydown", handleKeyPress);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    }, []);

    useEffect(() => {
        if (cheatCode === "idspispopd" || cheatCode.slice(-3) === 'spy') {
            setIsSpyMode(!isSpyMode);
            setCheatCode("");
        }
    }, [cheatCode]);

    if (!isSpyMode) {
        return <></>
    }


  return (
  <div className={styles.container}>
    <input value={address} onChange={handleChange} className={styles.address} spellCheck={'false'}/>
      {!isValid && <div className={styles.error}>Address is not valid</div> }
  </div>
  );
};

export default SpyMode;
