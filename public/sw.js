const CACHE_NAME = 'argent-de-poche-v3'
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './piggy-bank.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/icon-180.png',
  './splash/splash-640x1136.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        const base = self.registration.scope
        const urls = STATIC_ASSETS.map((asset) => new URL(asset, base).href)
        return cache.addAll(urls)
      })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

// Stratégies :
// - Navigations (index.html) : réseau d'abord, cache en secours.
//   Garantit que chaque déploiement est récupéré dès que l'appareil est en ligne,
//   tout en gardant le mode hors-ligne fonctionnel.
// - Autres ressources (assets hashés, icônes) : cache d'abord, réseau en secours.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          if (cached) return cached
          const indexUrl = new URL('./index.html', self.registration.scope).href
          const index = await caches.match(indexUrl)
          if (index) return index
          return Response.error()
        })
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
        }
        return response
      })
    })
  )
})
