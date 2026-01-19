export type ResetSwResult = {
  hadRegistrations: boolean
  cacheKeys: string[]
}

export async function resetServiceWorkerAndCaches(): Promise<ResetSwResult> {
  let registrations: readonly ServiceWorkerRegistration[] = []
  if ('serviceWorker' in navigator) {
    try {
      registrations = await navigator.serviceWorker.getRegistrations()
    } catch {
      registrations = []
    }
  }

  const hadRegistrations = registrations.length > 0
  await Promise.all(
    registrations.map((registration) => registration.unregister().catch(() => false))
  )

  let cacheKeys: string[] = []
  if ('caches' in window) {
    try {
      cacheKeys = await caches.keys()
    } catch {
      cacheKeys = []
    }

    await Promise.all(cacheKeys.map((key) => caches.delete(key).catch(() => false)))
  }

  return { hadRegistrations, cacheKeys }
}
