import { useEffect, useState } from 'react'
import { useNavigate, useRouteError } from 'react-router-dom'
import { useTranslation } from 'summon-ui/intl'
import { Button, Text, Stack, Title, Box } from 'summon-ui/mantine'
import { useAuthState } from '@/providers/AuthProvider'

const INVALID_TOKEN_MESSAGE = "Cannot read properties of undefined (reading 'lastIndexOf')"

interface CustomError {
  message?: string
  statusText?: string
}

const ErrorBoundary = () => {
  const t = useTranslation()
  const rawError = useRouteError()
  const { logout } = useAuthState()
  const navigate = useNavigate()
  const [isNotAuthorized, setIsNotAuthorized] = useState(false)

  // Use type assertion to tell TypeScript about the shape of the error object
  const error = rawError as CustomError | undefined

  useEffect(() => {
    if (error?.message === INVALID_TOKEN_MESSAGE) {
      setIsNotAuthorized(true)
    }
  }, [error])

  if (isNotAuthorized && error) {
    error.message = 'It seems you are not authorized, please logout and try again'
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
    location.reload()
  }

  return (
    <Stack align='center' gap='sm'>
      <Title order={2}>{t('Oops! Something was wrong')}</Title>
      <Stack align='center' gap='xl'>
        <Box>
          <Text size='sm' ta='center' c='gray'>
            {error?.message || error?.statusText || t('We are working on a fix')}
          </Text>
          {isNotAuthorized && (
            <Text size='sm' c='gray' ta='center'>
              {t('Try login again and refreshing your browser before contacting support')}
            </Text>
          )}
        </Box>
        {isNotAuthorized && <Button onClick={handleLogout}>{t('Logout')}</Button>}
      </Stack>
    </Stack>
  )
}

export default ErrorBoundary
