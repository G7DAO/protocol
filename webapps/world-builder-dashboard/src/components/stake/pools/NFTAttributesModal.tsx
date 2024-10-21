import React from 'react';
import { Modal, ModalProps } from 'summon-ui/mantine'; // assuming the path to your modal component
import styles from './NFTAttributesButton.module.css'

interface NFTAttributesModalProps extends ModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokenId: number;
}

const NFTAttributesModal: React.FC<NFTAttributesModalProps> = ({ isOpen, onClose, tokenId}) => {
    return (
        <Modal opened={isOpen} onClose={onClose}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>Token Attributes</div>
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Token ID</label>
                    <div>{tokenId}</div>
                </div>
            </div>
        </Modal>
    );
};

export default NFTAttributesModal;
