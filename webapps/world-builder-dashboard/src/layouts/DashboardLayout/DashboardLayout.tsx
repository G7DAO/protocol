import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import styles from './DashboardLayout.module.css'
import { DashboardLayout as SummonUiDashboardLayout, Icon, IconName } from 'summon-ui'
import { Box, NavLink, Stack, Badge } from 'summon-ui/mantine'
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import withAuth from '@/hocs/withAuth'
import { useAppVersion, useIsDevMode } from '@/utils/utils'

const BOTTOM_MENU: { name: string; to: string; icon: IconName }[] = []
const NAVIGATION_MENU: {
  name: string
  icon: IconName
  to: string
  soon?: boolean
  description?: string
}[] = [
  {
    name: 'Bridge',
    icon: 'Wallet04' as IconName,
    to: '/bridge'
  },
  {
    name: 'Faucet',
    icon: 'Droplets02' as IconName,
    to: '/faucet'
  }
]

const renderNavigationMenu = ({
  isCollapsed,
  closeMobileMenu
}: {
  isCollapsed: boolean
  closeMobileMenu: () => void
}): ReactNode => {
  return (
    <Stack gap='xs' align={isCollapsed ? 'center' : 'stretch'} w='100%'>
      {NAVIGATION_MENU.map(({ icon, soon, description, ...link }, index) => (
        <NavLink
          leftSection={<Icon name={icon} />}
          fw='900'
          tt='uppercase'
          onClick={closeMobileMenu}
          className='overflow-visible'
          w={isCollapsed ? 50 : '98%'}
          active={index === 0}
          href={link.to}
          key={link.name}
          disabled={soon}
          {...(soon ? { rightSection: <Badge size='xs'>Soon</Badge> } : {})}
          {...(isCollapsed ? {} : { label: link.name, description })}
        />
      ))}
    </Stack>
  )
}

const renderBottomMenu = ({
  isCollapsed,
  closeMobileMenu
}: {
  isCollapsed: boolean
  closeMobileMenu: () => void
}): ReactNode => {
  const { connectedAccount } = useBlockchainContext()

  return (
    <>
      <Stack gap={4} align={isCollapsed ? 'center' : 'stretch'} w='100%' mb={42}>
        {BOTTOM_MENU.map(({ icon, ...link }, index) => (
          <NavLink
            leftSection={<Icon name={icon} />}
            fw='900'
            tt='uppercase'
            onClick={closeMobileMenu}
            active={index === 3}
            href={link.to}
            key={link.name}
            {...(isCollapsed ? {} : { label: link.name })}
          />
        ))}
        {connectedAccount && (
          <div className={styles.web3address}>{`${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`}</div>
        )}
      </Stack>
    </>
  )
}

const DashboardLayout = () => {
  const isDev = useIsDevMode()
  const appVersion = useAppVersion()
  return (
    <Box h='100%' mih='100vh' w='100%' className='overflow-y-scroll'>
      <SummonUiDashboardLayout
        renderNavigationMenu={renderNavigationMenu}
        renderBottomMenu={renderBottomMenu}
        render={({ offset }: { offset: number }) => (
          <>
            {isDev && (
              <Box w='100%' p='sm' bg='yellow.6' c='white' ta='right'>{`Development mode. version ${appVersion}`}</Box>
            )}
            <Outlet context={{ offset }} />
          </>
        )}
      />
    </Box>
  )
}

export default withAuth(DashboardLayout)
