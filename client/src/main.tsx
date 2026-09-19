import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from "@react-oauth/google";
import { env } from './configs/env.config.ts'



createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <GoogleOAuthProvider clientId={env.googleClientId}>
    <BrowserRouter>
        <App />    
    </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
)
