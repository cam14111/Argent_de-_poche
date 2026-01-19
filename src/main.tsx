import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { AuthProvider } from './contexts/AuthContext'
import { SyncProvider } from './contexts/SyncContext'
import { seedDatabase } from './db/seed'
import { resetServiceWorkerAndCaches } from './lib/pwa'
import './index.css'

seedDatabase().then((seeded) => {
  if (seeded) {
    console.log('Base de données initialisée avec les données par défaut')
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SyncProvider>
        <RouterProvider router={router} />
      </SyncProvider>
    </AuthProvider>
  </StrictMode>
)

if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    resetServiceWorkerAndCaches()
      .then((result) => {
        const hasController =
          'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller)
        const shouldReload = result.hadRegistrations || hasController
        if (shouldReload) {
          window.location.reload()
        }
      })
      .catch(() => undefined)
  })
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Echec enregistrement service worker:', error)
    })
  })
}
