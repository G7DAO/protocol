import { Navigate, createBrowserRouter } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundry'
//Layouts
import MainLayout from '@/layouts/MainLayout/MainLayout'
import BridgePage from '@/pages/BridgePage/BridgePage'
import FaucetPage from '@/pages/FaucetPage/FaucetPage'
//Pages
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'
import StakingPage from './pages/StakingPage/StakingPage'

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    path: '/',
    children: [
      {
        path: '/',
        element: <Navigate to='/bridge' />,
        errorElement: <ErrorBoundary />
      }
    ]
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/bridge/*',
        element: <BridgePage />
      }
    ]
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/faucet/*',
        element: <FaucetPage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
])

export default router
