import { createBrowserRouter } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundry'
//Pages
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'
import LegalPage from './pages/LegalPage/LegalPage'
import { LEGAL } from './legal'

const router = createBrowserRouter([
  {
    element: <LegalPage legalContent={LEGAL.privacy}/>,
    path: '/',
    errorElement: <ErrorBoundary />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
])

export default router
