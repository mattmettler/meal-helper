import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { requestPersistence } from './storage/persistence'
import { App } from './ui/App'
import './ui/theme.css'

requestPersistence().then(granted => console.info('Persistent storage granted:', granted))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
