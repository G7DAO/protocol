import { createBrowserRouter } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundry'
//Layouts
import MainLayout from '@/layouts/MainLayout/MainLayout'
import BridgePage from '@/pages/BridgePage/BridgePage'
import FaucetPage from '@/pages/FaucetPage/FaucetPage'
//Pages
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'
import LandingPage from './pages/LandingPage/LandingPage'
import LegalPage from './pages/LegalPage/LegalPage'

const router = createBrowserRouter([
  {
    element: <LandingPage />,
    path: '/',
    errorElement: <ErrorBoundary />
  },
  {
    element: <LegalPage />,
    path: '/terms',
    errorElement: <ErrorBoundary />
  },
  {},
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
