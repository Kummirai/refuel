const CACHE_NAME = "kapuka-v3";
const OFFLINE_URL = "/";

const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            console.warn("[SW] Failed to cache", url);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok) {
    const clone = response.clone();
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.put(OFFLINE_URL, clone))
      .catch(() => {});
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Local development rebuilds chunk URLs in place; caching them hides edits.
  if (["localhost", "127.0.0.1", "[::1]"].includes(self.location.hostname)) return;

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Never cache API traffic: auth sessions and user data must always be live.
  if (url.pathname.startsWith("/api/")) return;

  // Next.js RSC/prefetch payloads are per-route data; keep them off the cache.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  // Navigations: always try the network so a new deployment (and freshly
  // hashed build assets) are picked up. A cached shell is only used when the
  // network request actually fails, never just because it is slow.
  if (request.mode === "navigate") {
    event.respondWith(
      fetchAndCache(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached || Response.error())
      )
    );
    return;
  }

  // Immutable hashed build assets: cache first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, clone))
                .catch(() => {});
            }
            return response;
          })
      )
    );
    return;
  }

  // Everything else (images, fonts): serve cached copy, refresh in background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    })
  );
});
