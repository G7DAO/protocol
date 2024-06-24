import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'
import 'summon-ui/styles/mantine/mantine-core.css'
import 'summon-ui/styles/mantine/mantine-notifications.css'
import 'summon-ui/styles/mantine/mantine-tiptap.css'
import 'summon-ui/styles/summon-ui.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
