import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import '@progress/kendo-theme-default/dist/all.css'
import './index.css'
import App from './App.tsx'
import { SharePage } from './pages/SharePage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/fortune/:sessionId" element={<SharePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
