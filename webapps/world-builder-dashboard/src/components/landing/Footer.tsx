import React, { useState } from 'react'
import styles from './Footer.module.css'
import IconDiscord from '@/assets/IconDiscord'
import IconX from '@/assets/IconX'
import IconGitHub from '@/assets/IconGitHub'
import IconLinkedIn from '@/assets/IconLinkedIn'
import IconForkTheWorld from '@/assets/IconForkTheWorld'
import { useNavigate } from 'react-router-dom'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useMediaQuery } from 'summon-ui/mantine'
import IconChevronDown from '@/assets/IconChevronDown'


const Footer: React.FC = () => {
    const navigate = useNavigate()
    const smallView = useMediaQuery('(max-width: 750px)')
    const { setSelectedNetworkType } = useBlockchainContext()
    const footerIcons = [
        { component: <IconDiscord />, navigate: () => window.open('https://discord.com/invite/g7dao', '_blank') },
        { component: <IconX />, navigate: () => window.open('https://x.com/g7_dao', '_blank') },
        { component: <IconGitHub />, navigate: () => window.open('https://github.com/G7DAO', '_blank') },
        { component: <IconLinkedIn />, navigate: () => window.open('https://www.linkedin.com/company/g7dao', '_blank') },
    ];
    const [collapsedSections, setCollapsedSections] = useState<{ [key: number]: boolean }>({ 0: true, 1: true, 2: true })

    const toggleSection = (index: number) => {
        setCollapsedSections(prev => ({ ...prev, [index]: !prev[index] }))
    }

    const footerSections = [
        {
            header: 'DevHub',
            links: [
                { name: 'Faucet', url: '/faucet' },
                { name: 'Bridge', url: '/bridge' },
                { name: 'Documentation', url: 'https://docs.game7.io/' },
                { name: 'Explorer', url: 'https://mainnet.game7.io/' },
            ],
        },
        {
            header: 'Media',
            links: [
                { name: 'Community', url: 'https://discord.com/invite/g7dao' },
            ],
        },
        {
            header: 'Legal',
            links: [
                { name: 'Terms', url: '/terms' },
                { name: 'Privacy', url: '/privacy' },
                { name: 'Cookie', url: '/cookie' },
            ],
        },
    ]

    const navigateLink = (item: any) => {
        if (item.name === 'Faucet') {
            setSelectedNetworkType('Testnet')
            navigate(item.url)
        } else if (item.name === "Bridge") {
            setSelectedNetworkType('Testnet')
            navigate(item.url)
        } else {
            window.open(item.url, '_blank')
        }
    }

    return (
        <>
            {!smallView && (
                <div className={styles.layoutFooter}>
                    <div className={styles.footer}>
                        <div className={styles.footerContent}>
                            <IconForkTheWorld />
                            <div className={styles.footerLinks}>
                                {footerSections.map((section, index) => (
                                    <div className={styles.footerSection} key={index}>
                                        <div className={styles.footerSectionHeader}>{section.header}</div>
                                        {section.links.map((link, linkIndex) => (
                                            <div onClick={() => navigateLink(link)} className={styles.footerSectionLink} key={linkIndex}>
                                                {link.name}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className={styles.footerIcons}>
                                {footerIcons.map((icon, index) => (
                                    <div key={index} onClick={icon.navigate} className={styles.footerIcon}>
                                        {icon.component}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {smallView && (
                <div className={styles.layoutFooter}>
                    <div className={styles.footerMobile}>
                        <div className={styles.footerContentMobile}>
                            <IconForkTheWorld />
                            <div className={styles.footerLinksMobile}>
                                {footerSections.map((section, index) => (
                                    <div className={styles.footerSection} key={index}>
                                        <div className={styles.footerSectionHeaderContainer} onClick={() => toggleSection(index)}>
                                            <div className={styles.footerSectionHeader}>{section.header}</div>
                                            <IconChevronDown 
                                                stroke='white' 
                                                style={{ transform: collapsedSections[index] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} 
                                            />
                                        </div>
                                        {!collapsedSections[index] && ( // Show links only if not collapsed
                                            section.links.map((link, linkIndex) => (
                                                <div onClick={() => navigateLink(link)} className={styles.footerSectionLink} key={linkIndex}>
                                                    {link.name}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className={styles.footerIcons}>
                                {footerIcons.map((icon, index) => (
                                    <div key={index} onClick={icon.navigate} className={styles.footerIcon}>
                                        {icon.component}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Footer