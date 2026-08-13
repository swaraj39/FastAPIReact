// ============================================================
// Entry point: wires React to the DOM.
//
// 1. createRoot targets the #root div in index.html.
// 2. <StrictMode> enables extra dev-time checks.
// 3. <BrowserRouter> gives the app URL-based routing.
// 4. <AuthProvider> supplies the global auth context to everything.
// 5. <App> renders the actual UI.
// ============================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import './index.css'

// `!` tells TypeScript "this element definitely exists" (it's in index.html).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
