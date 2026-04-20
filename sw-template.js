// ============================================================
// sw.js — Service Worker for Travel Planner PWA v1.2.0
// ============================================================
// 使用方式：與 index.html 放在同一目錄，透過 HTTPS 或 localhost 提供
// 更新策略：改 CACHE_VERSION 即自動清除舊快取
// ============================================================

const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = `travel-planner-${CACHE_VERSION}`;

// 核心檔案（Install 時預快取）
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// 允許快取的第三方 CDN
const RUNTIME_CACHE_URLS = [
  'https://unpkg.com/react',
  'https://unpkg.com/react-dom',
  'https://unpkg.com/@babel/standalone',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

// ── Install 階段 ──
self.addEventListener('install', (event) => {
  console.log('[SW] Installing', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Install failed:', err))
  );
});

// ── Activate 階段：清除舊快取 ──
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith('travel-planner-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch 階段 ──
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // 天氣 API → Network First
  if (request.url.includes('open-meteo.com')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Google Maps 連結 → 交給瀏覽器直接處理（不攔截）
  if (request.url.includes('google.com/maps')) return;

  // 其他 → Cache First
  event.respondWith(cacheFirst(request));
});

// ── Cache First 策略 ──
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // 背景更新（stale-while-revalidate）
    fetch(request).then((response) => {
      if (response.ok && shouldCache(request.url)) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
      }
    }).catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok && shouldCache(request.url)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // 離線 fallback
    if (request.destination === 'document') {
      return caches.match('./index.html');
    }
    return new Response('離線模式無法取得此資源', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// ── Network First 策略 ──
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] 網路失敗，使用快取:', request.url);
      return cached;
    }
    return new Response(JSON.stringify({ error: 'offline', cached: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ── 判斷是否快取 ──
function shouldCache(url) {
  if (url.startsWith(self.location.origin)) return true;
  return RUNTIME_CACHE_URLS.some((allowed) => url.startsWith(allowed));
}

// ── 接收前端訊息 ──
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0]?.postMessage({ cleared: true });
    });
  }
});
