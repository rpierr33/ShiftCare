const CACHE_KEY = "carecircle-v1";

const APP_SHELL = [
  "/",
  "/login",
  "/offline",
];

const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
];

// ─── Install: cache the app shell ─────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_KEY).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches ───────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_KEY)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: routing strategies ────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (but queue clock actions for background sync)
  if (request.method !== "GET") {
    if (url.pathname.startsWith("/api/clock")) {
      event.respondWith(
        fetch(request).catch(() => {
          // Queue failed clock-in/out for background sync
          return saveToSyncQueue(request.clone()).then(
            () =>
              new Response(
                JSON.stringify({ queued: true, message: "Action queued for sync" }),
                {
                  status: 202,
                  headers: { "Content-Type": "application/json" },
                }
              )
          );
        })
      );
      return;
    }
    return;
  }

  // Network-first for API and data routes
  if (url.pathname.startsWith("/api/") || url.pathname.includes("_next/data")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets
  const isStatic = STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
  if (isStatic || url.pathname.startsWith("/_next/static")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for navigation (HTML pages)
  event.respondWith(networkFirst(request));
});

// ─── Background sync for queued clock actions ─────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "clock-sync") {
    event.waitUntil(replayQueuedActions());
  }
});

// ─── Strategies ───────────────────────────────────────────────────

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_KEY);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // For navigation requests, show cached home page as fallback
    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }

    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_KEY);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

// ─── Offline queue helpers ────────────────────────────────────────

async function saveToSyncQueue(request) {
  const body = await request.text();
  const db = await openSyncDB();
  const tx = db.transaction("sync-queue", "readwrite");
  tx.objectStore("sync-queue").add({
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
  });
  await tx.complete;

  // Register for background sync if available
  if (self.registration.sync) {
    await self.registration.sync.register("clock-sync");
  }
}

async function replayQueuedActions() {
  const db = await openSyncDB();
  const tx = db.transaction("sync-queue", "readwrite");
  const store = tx.objectStore("sync-queue");
  const allKeys = await getAllKeys(store);

  for (const key of allKeys) {
    const item = await getItem(store, key);
    if (!item) continue;

    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body || undefined,
      });
      store.delete(key);
    } catch {
      // Will retry on next sync
      break;
    }
  }
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("carecircle-sync", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("sync-queue", { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllKeys(store) {
  return new Promise((resolve) => {
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });
}

function getItem(store, key) {
  return new Promise((resolve) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}
