import { useMediaQuery } from '@mantine/hooks'

export const useIsMobile = () => useMediaQuery('(max-width: 48rem)')
export const useIsDevMode = () => import.meta.env.VITE_ENV === 'development'
export const useAppVersion = () => import.meta.env.VITE_APP_VERSION
