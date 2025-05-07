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
import { LEGAL } from './legal'
import RelayPage from './pages/RelayPage/RelayPage'

const router = createBrowserRouter([
  {
    element: <LandingPage />,
    path: '/',
    errorElement: <ErrorBoundary />
  },
  {
    element: <LegalPage legalContent={LEGAL.terms}/>,
    path: '/terms',
    errorElement: <ErrorBoundary />
  },
  {
    element: <LegalPage legalContent={LEGAL.privacy}/>,
    path: '/privacy',
    errorElement: <ErrorBoundary />
  },
  {
    element: <LegalPage legalContent={LEGAL.cookie}/>,
    path: '/cookie',
    errorElement: <ErrorBoundary />
  },
 /*  {
    element: <MainLayout />,
    children: [
      {
        path: '/bridge/*',
        element: <BridgePage />
      }
    ]
  }, */
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
    element: <MainLayout />,
    children: [
      {
        path: '/bridge/*',
        element: <RelayPage />
      }
    ]
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/relay/*',
        element: <RelayPage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
])

export default router
