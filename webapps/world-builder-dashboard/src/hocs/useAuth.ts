import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from '@/providers/AuthProvider'

const useAuth = () => {
  const { logout, isAuthenticated, user } = useAuthState()
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) setIsLoading(false)
    if ((!user || !isAuthenticated) && !isLoading) {
      logout()
      navigate('/')
    }
  }, [isAuthenticated, user, isLoading])

  const finishedAuthenticating = isAuthenticated && user && !isLoading

  return {
    finishedAuthenticating
  }
}

export default useAuth
