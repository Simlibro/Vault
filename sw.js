const CACHE_NAME = "vault-shell-v16";

const APP_SHELL = [
  "/vault/",
  "/vault/app.html",
  "/vault/index.html",
  "/vault/manifest.webmanifest",

  "/vault/css/app.css",
  "/vault/css/search.css",
  "/vault/css/dialog.css",

  "/vault/js/state.js",
  "/vault/js/crypto.js",
  "/vault/js/storage.js",
  "/vault/js/icons.js",
  "/vault/js/vault-dialog-host.js",
  "/vault/js/dialog.js",
  "/vault/js/vault-entry.js",
  "/vault/js/autolock.js",
  "/vault/js/search.js",
  "/vault/js/reset.js",
  "/vault/js/app.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isPageRequest = request.mode === "navigate";
  const isAssetRequest =
    isSameOrigin &&
    (
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".html") ||
      url.pathname.endsWith(".webmanifest")
    );

  if (!isSameOrigin) return;

  if (isPageRequest || isAssetRequest) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (isPageRequest) {
          const fallback = await caches.match("/vault/app.html");
          if (fallback) return fallback;
        }

        throw err;
      }
    })());
  }
});