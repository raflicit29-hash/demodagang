const CACHE_NAME = "mr-all-v6";
const APP_FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const file of APP_FILES) {
      try { const r = await fetch(file, {cache: "no-store"}); if (r.ok) await cache.put(file, r.clone()); } catch (_) {}
    }
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => { const keys = await caches.keys(); await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))); await self.clients.claim(); })());
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith((async () => {
    try {
      const r = await fetch(event.request, {cache: "no-store"});
      if (r && r.ok) { const c = await caches.open(CACHE_NAME); c.put(event.request, r.clone()); }
      return r;
    } catch (_) {
      if (event.request.mode === "navigate") return (await caches.match("./index.html")) || (await caches.match("./"));
      return (await caches.match(event.request)) || Response.error();
    }
  })());
});
