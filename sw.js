// ORCA Checklist service worker
// Bump VERSION whenever you change any file so devices pick up the update.
const VERSION = "orca-v69";
const ASSETS = [
  "./",
  "./index.html",
  "./navlog-ui.js",
  "./navlog-parser.js",
  "./vendor/pdf.min.js",
  "./vendor/pdf.worker.min.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first so the app opens instantly and works with no signal.
// Falls back to the network (and caches the result) for anything not precached.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          if (res && res.ok && new URL(e.request.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => (e.request.mode === "navigate" ? caches.match("./index.html") : undefined));
    })
  );
});
