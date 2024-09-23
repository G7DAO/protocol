import { useState } from 'react'
import { ValueSelect } from '../valueSelector/ValueSelector'
import styles from './AccountSelector.module.css'
import IconChevronDown from '@/assets/IconChevronDown'

type AccountSelectorProps = {
    values: ValueSelect[]
    selectedValue: ValueSelect
    onChange: (value: ValueSelect) => void
}

const AccountSelector = ({ values, onChange, selectedValue }: AccountSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false); // State to control dropdown visibility

    const handleSelect = (value: ValueSelect) => {
        onChange(value);
        setIsOpen(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.selector} onClick={() => setIsOpen(!isOpen)}>
                <div className={styles.text}>
                    {selectedValue.displayName} {/* Display the currently selected value */}
                </div>
                {/* <IconChevronDown className={styles.chevron} /> */}
            </div>
            {isOpen && (
                <div className={styles.dropdown}>
                    {values.map((value) => (
                        <div
                            key={value.valueId}
                            className={`${styles.option} ${value.valueId === selectedValue.valueId ? styles.selected : ''}`}
                            onClick={() => handleSelect(value)}
                        >
                            {value.displayName}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AccountSelector;