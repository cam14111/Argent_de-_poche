import { useEffect, useState } from 'react'
import { resetServiceWorkerAndCaches } from '@/lib/pwa'

export function DevSwReset() {
  const [message, setMessage] = useState('Resetting service worker and caches...')

  useEffect(() => {
    if (!import.meta.env.DEV) {
      setMessage('This page is only available in development.')
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        await resetServiceWorkerAndCaches()
        if (cancelled) return
        setMessage('Reset complete. Redirecting to the app...')
        window.setTimeout(() => {
          window.location.replace('/')
        }, 300)
      } catch {
        if (cancelled) return
        setMessage('Reset failed. Check the console for details.')
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-lg font-semibold">SW reset</h1>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  )
}
