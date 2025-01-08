import React from 'react'
import styles from './Footer.module.css'
import IconDiscord from '@/assets/IconDiscord'
import IconX from '@/assets/IconX'
import IconGitHub from '@/assets/IconGithub'
import IconLinkedIn from '@/assets/IconLinkedIn'
import IconForkTheWorld from '@/assets/IconForkTheWorld'
import { useNavigate } from 'react-router-dom'


const Footer: React.FC = () => {
    const navigate = useNavigate()
    const footerIcons = [
        { component: <IconDiscord />, navigate: () => window.open('/discord', '_blank') },
        { component: <IconX />, navigate: () => window.open('https://x.com/g7_dao', '_blank') },
        { component: <IconGitHub />, navigate: () => window.open('https://github.com/G7DAO', '_blank') },
        { component: <IconLinkedIn />, navigate: () => window.open('https://www.linkedin.com/company/g7dao', '_blank') },
    ];

    const footerSections = [
        {
            header: 'DevHub',
            links: [
                { name: 'Faucet', url: '/faucet' },
                { name: 'Bridge', url: '/bridge' },
                { name: 'Documentation', url: '/documentation' },
                { name: 'Explorer', url: '/explorer' },
            ],
        },
        {
            header: 'Media',
            links: [
                { name: 'Community', url: '/community' },
            ],
        },
        {
            header: 'Legal',
            links: [
                { name: 'Terms', url: '/terms' },
                { name: 'Privacy', url: '/privacy' },
            ],
        },
    ]

    return (
        <div className={styles.layoutFooter}>
            <div className={styles.footer}>
                <div className={styles.footerContent}>
                    <IconForkTheWorld />
                    <div className={styles.footerLinks}>
                        {footerSections.map((section, index) => (
                            <div className={styles.footerSection} key={index}>
                                <div className={styles.footerSectionHeader}>{section.header}</div>
                                {section.links.map((link, linkIndex) => (
                                    <div onClick={() => navigate(link.url)} className={styles.footerSectionLink} key={linkIndex}>
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
    )
}

export default Footer