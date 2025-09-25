// Sentinel SPWA Service Worker
// Implements caching strategy for optimal performance and offline capability

const CACHE_NAME = 'sentinel-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Dynamic imports and chunks will be cached on demand
]

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension://')) {
    return
  }

  event.respondWith(
    caches.match(request).then(response => {
      // Return cached version if available
      if (response) {
        return response
      }

      // Otherwise fetch from network
      return fetch(request)
        .then(networkResponse => {
          // Don't cache non-2xx responses or opaque responses
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse
          }

          // Cache the response for future use (static assets only)
          if (
            request.url.includes('.js') ||
            request.url.includes('.css') ||
            request.url.includes('.png') ||
            request.url.includes('.svg')
          ) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache)
            })
          }

          return networkResponse
        })
        .catch(() => {
          // Offline fallback for HTML requests
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/')
          }
          return new Response('Offline', { status: 503 })
        })
    })
  )
})

// Message handling for cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CACHE_VIDEO') {
    // Video files are NOT cached as they are local user files
    // and would consume too much storage
    event.ports[0]?.postMessage({
      type: 'CACHE_VIDEO_RESPONSE',
      success: false,
      reason: 'Video files are not cached by design',
    })
  }
})
