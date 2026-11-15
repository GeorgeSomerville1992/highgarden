import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import App from './App.tsx'
import { applyTheme } from './lib/theme.ts'
import { getStored, subscribe } from './storage/storage.ts'

// Before the first render, so a manual theme never flashes the system one.
applyTheme(getStored('theme'))
subscribe(() => applyTheme(getStored('theme')))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
