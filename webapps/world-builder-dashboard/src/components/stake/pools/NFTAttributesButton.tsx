import React, { useState } from 'react';
import styles from './NFTAttributesButton.module.css';
import NFTAttributesModal from './NFTAttributesModal';

interface NFTAttributesButtonProps {
    tokenId: number,
}

const NFTAttributesButton: React.FC<NFTAttributesButtonProps> = ({ tokenId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleModalClose = () => {
        setIsModalOpen(false);
    }

    return (
        <div className={styles.container} onClick={()=>{setIsModalOpen(!isModalOpen)}}>
            <span className={styles.label}>View Token details</span>
            {isModalOpen && (
                <NFTAttributesModal
                    opened={isModalOpen}
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    tokenId={tokenId}
                />
            )}
        </div>
    );
};

export default NFTAttributesButton;
