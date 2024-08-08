import { useState } from 'react';
import styles from './OptionsButton.module.css';

const OptionsButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        console.log(isOpen);
    };

    const handleOptionClick = (option: any) => {
        console.log(`${option} clicked`);
        setIsOpen(false); // Close dropdown after selection
    };


    return (
        <div className={styles.container} onClick={() => toggleDropdown()}>
            <span className={styles.label}>Options</span>
            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownItem} onClick={() => handleOptionClick('View Positions')}>View Positions</div>
                    <div className={styles.dropdownItem} onClick={() => handleOptionClick('Edit Pool')}>Edit Pool</div>
                </div>
            )}
        </div>
    );
};

export default OptionsButton;
