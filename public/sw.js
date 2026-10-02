// Cache only public, immutable assets. Never store HTML, personal data or uploads.
const CACHE = "cubetto-public-v4";
const CORE_ASSETS = ["/pwa-icon-192.png", "/pwa-icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("cubetto-") && key !== CACHE)
        .map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const publicAsset = url.pathname.startsWith("/_next/static/") ||
    CORE_ASSETS.includes(url.pathname);
  if (!publicAsset || request.mode === "navigate" ||
      request.headers.get("rsc") === "1") return;
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  }));
});
