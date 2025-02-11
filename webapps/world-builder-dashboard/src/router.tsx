import { createBrowserRouter } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundry'
//Pages
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'
import StatusPage from './pages/LegalPage/StatusPage'
import { LEGAL } from './legal'

const router = createBrowserRouter([
  {
    element: <StatusPage legalContent={LEGAL.privacy}/>,
    path: '/',
    errorElement: <ErrorBoundary />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
])

export default router
