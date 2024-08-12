import React, { useEffect, useState } from 'react';
import { Modal, ModalProps } from 'summon-ui/mantine'; // assuming the path to your modal component
import styles from './EditPoolModal.module.css'
import ActionButton from '@/components/bridge/bridge/ActionButton';

interface EditPoolModalProps extends ModalProps {
    isOpen: boolean;
    onClose: () => void;
    poolData: {
        poolId: string;
        transferable: boolean;
        cooldownSeconds: string;
        lockdownSeconds: string;
    };
}

const EditPoolModal: React.FC<EditPoolModalProps> = ({ isOpen, onClose, poolData }) => {
    const poolId = poolData.poolId;
    const [transferable, setTransferable] = useState(poolData.transferable);
    const [cooldownSeconds, setCooldownSeconds] = useState(poolData.cooldownSeconds);
    const [lockupSeconds, setLockdownSeconds] = useState(poolData.lockdownSeconds);
    const [changeTransferability, setChangeTransferability] = useState(true);
    const [changeLockup, setChangeLockup] = useState(true);
    const [changeCooldown, setChangeCooldown] = useState(true);
    const [inputErrorMessage, setInputErrorMessage] = useState('')
    const [networkErrorMessage, setNetworkErrorMessage] = useState('')

    useEffect(() => {
        console.log(poolId.toString());
    }, [])

    return (
        <Modal opened={isOpen} onClose={onClose}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>Edit Pool</div>
                    <div className={styles.modalSubtitle}>Modify pool settings</div>
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Is Transferable</label>
                    <select
                        className={styles.input}
                        value={String(transferable)}
                        onChange={(e) => setTransferable(e.target.value === 'true')}
                    >
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Cooldown Seconds</label>
                    <input
                        type="string"
                        className={styles.input}
                        value={cooldownSeconds}
                        onChange={(e) => setCooldownSeconds(e.target.value)}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Lockdown Seconds</label>
                    <input
                        type="string"
                        className={styles.input}
                        value={lockupSeconds}
                        onChange={(e) => setLockdownSeconds(e.target.value)}
                    />
                </div>
                <ActionButton
                    direction={"EDITPOOL"}
                    params={{ poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds }}
                    isDisabled={!!inputErrorMessage}
                    setErrorMessage={setNetworkErrorMessage}
                />
            </div>
        </Modal>
    );
};

export default EditPoolModal;
