# PWA 完整實作指南

本文件提供 travel-planner v1.2.0 產生 PWA 所需的所有範本檔案。

---

## 1. manifest.json 範本

```json
{
  "name": "Tokyo 自由行指南",
  "short_name": "Tokyo",
  "description": "2026 東京 6 日行程",
  "start_url": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#f0f2f5",
  "theme_color": "#1e293b",
  "lang": "zh-TW",
  "dir": "ltr",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["travel", "lifestyle"],
  "shortcuts": [
    {
      "name": "今日行程",
      "url": "./#today",
      "icons": [{ "src": "icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "交通攻略",
      "url": "./#transport",
      "icons": [{ "src": "icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

**欄位說明**：

| 欄位 | 作用 |
|------|------|
| `name` | 完整 App 名稱（安裝畫面顯示）|
| `short_name` | 桌面圖示下方的短名稱（最多 12 字元）|
| `display` | `standalone` = 全螢幕無瀏覽器 UI |
| `background_color` | App 啟動畫面底色 |
| `theme_color` | Android 狀態列顏色 |
| `icons.purpose` | `any` 一般用途、`maskable` 允許 Android 裁切成各種形狀 |
| `shortcuts` | Android 長按圖示的快捷選單（iOS 不支援但無害）|

---

## 2. Service Worker 範本（sw.js）

使用 **Cache First 策略**——優先用快取，背景更新。適合旅遊 App 這種內容變動不頻繁的情境。

```javascript
// sw.js - Service Worker for Travel Planner PWA

const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = `travel-planner-${CACHE_VERSION}`;

// 必須預快取的核心檔案
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// 可接受的第三方資源（React CDN 等）
const RUNTIME_CACHE_URLS = [
  'https://unpkg.com/react@18',
  'https://unpkg.com/react-dom@18',
  'https://unpkg.com/@babel/standalone',
];

// ── Install 階段：預快取核心檔案 ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 預快取核心檔案');
      return cache.addAll(CORE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate 階段：清除舊版快取 ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] 刪除舊快取:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch 階段：Cache First + 網路 Fallback ──
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只處理 GET 請求
  if (request.method !== 'GET') return;

  // 天氣 API 請求：Network First（優先拿最新資料，失敗用快取）
  if (request.url.includes('open-meteo.com')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 其他：Cache First
  event.respondWith(cacheFirst(request));
});

// ── Cache First 策略 ──
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // 成功就快取起來（僅快取同源 + 允許的 CDN）
    if (response.ok && shouldCache(request.url)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // 離線且快取裡沒有，給一個降級回應
    console.warn('[SW] 離線且無快取:', request.url);
    if (request.destination === 'document') {
      return caches.match('./index.html');
    }
    return new Response('離線模式無法取得', { status: 503 });
  }
}

// ── Network First 策略（適合 API 請求）──
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // 網路失敗，用快取
    const cached = await caches.match(request);
    if (cached) return cached;
    // 連快取都沒有，返回空資料
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ── 判斷是否該快取此 URL ──
function shouldCache(url) {
  // 同源
  if (url.startsWith(self.location.origin)) return true;
  // 允許的 CDN
  return RUNTIME_CACHE_URLS.some((allowed) => url.startsWith(allowed));
}

// ── 接收前端訊息（可用於手動清除快取等）──
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
  }
});
```

**快取策略說明**：

- **核心檔案**（HTML、manifest、圖示）→ Cache First，離線優先
- **React CDN 資源** → Cache First（載入過一次就永遠快取）
- **天氣 API** → Network First（有網路拿最新，沒網路用快取）

---

## 3. PWA 圖示產生

### 建議規格

| 檔名 | 尺寸 | 用途 |
|------|------|------|
| `icon-192.png` | 192×192 | 必須，各平台通用 |
| `icon-512.png` | 512×512 | 必須，啟動畫面、高解析螢幕 |
| `icon-maskable.png` | 512×512 | 建議，Android 自適應圖示 |
| `apple-touch-icon.png` | 180×180 | iOS Safari 特別支援 |

### Maskable 圖示設計要點

Android 會把圖示裁切成不同形狀（圓形、方形、水滴），所以**圖示主體要在中央 80% 安全區**內，
外圍 20% 當作「可裁切的背景」。

```
┌─────────────────┐
│    [背景色]     │  ← 外圍 20%（可能被裁切）
│  ┌───────────┐  │
│  │           │  │
│  │  [主體]   │  │  ← 中央 80%（永遠可見）
│  │           │  │
│  └───────────┘  │
│                 │
└─────────────────┘
```

### 生成方式（推薦工具）

**選項 A：使用 skywork-design Skill 生成**

Claude 可在生成 PWA 時，順便用 skywork-design 產生符合旅遊主題的圖示。例如：

```
提示詞範例：
「極簡風格的東京鐵塔與櫻花圖示，背景深藍色 #1e293b，
 方形 512x512，中央留 80% 主體安全區」
```

**選項 B：使用線上工具**

- https://maskable.app/editor - 專門產 maskable 圖示
- https://realfavicongenerator.net - 一次產出所有尺寸
- https://www.pwabuilder.com/imageGenerator - PWA 專用

**選項 C：用 Python 快速產生純色文字圖示（fallback）**

如果使用者沒有美術素材，先用 Python 產生基本圖示：

```python
from PIL import Image, ImageDraw, ImageFont

def make_icon(text, size, bg_color, fg_color, filename):
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    # 用系統字體
    font_size = size // 3
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc", font_size)
    except:
        font = ImageFont.load_default()
    # 置中
    bbox = draw.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - w) / 2, (size - h) / 2 - bbox[1]), text, font=font, fill=fg_color)
    img.save(filename)

make_icon("東京", 192, "#1e293b", "#ffffff", "icon-192.png")
make_icon("東京", 512, "#1e293b", "#ffffff", "icon-512.png")
make_icon("東京", 512, "#1e293b", "#ffffff", "icon-maskable.png")
```

---

## 4. HTML 整合範本

主 `index.html` 的 `<head>` 必須包含：

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Tokyo 自由行指南</title>

  <!-- PWA 核心 -->
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#1e293b">

  <!-- iOS Safari 支援 -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Tokyo Guide">
  <link rel="apple-touch-icon" href="icon-192.png">

  <!-- 防止使用者縮放（旅遊 App 建議鎖定）-->
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">

  <!-- React + Babel CDN -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    /* App 樣式 */
    body { margin: 0; font-family: "Noto Sans TC", sans-serif; background: #f0f2f5; }
    /* 避開 iPhone 瀏海 */
    .app-header { padding-top: env(safe-area-inset-top); }
    .app-footer { padding-bottom: env(safe-area-inset-bottom); }
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- 天氣預快取資料（Claude 生成時填入）-->
  <script>
    const INITIAL_WEATHER_DATA = { /* ... */ };
  </script>

  <!-- 主 App 邏輯 -->
  <script type="text/babel">
    // React 元件...
  </script>

  <!-- Service Worker 註冊 -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then(reg => console.log('[PWA] SW 已註冊'))
          .catch(err => console.warn('[PWA] SW 註冊失敗:', err));
      });
    }
  </script>
</body>
</html>
```

---

## 5. 部署檢查清單

部署前確認以下項目：

- [ ] `manifest.json` 的 `start_url` 與實際部署路徑相符
- [ ] 所有圖示檔案實際存在且可訪問
- [ ] Service Worker 的 `CORE_ASSETS` 列表涵蓋所有必要檔案
- [ ] `theme_color` 與 `background_color` 視覺一致
- [ ] 已在手機實測「加到主畫面」流程
- [ ] 已測試離線模式（開啟後關閉網路再開）
- [ ] HTTPS 已啟用（GitHub Pages / Netlify / Cloudflare 自動有）

### Lighthouse 檢測

在 Chrome DevTools 中執行 Lighthouse > PWA 檢測，目標分數：

- Installable（可安裝）：**100**
- PWA Optimized：**90+**

常見失分原因：
- 缺少 `maskable` 圖示
- `manifest.json` 的 `short_name` 超過 12 字元
- 沒有設定 `theme_color`

---

## 6. 常見問題

**Q: iOS Safari 會支援 Service Worker 嗎？**
A: iOS 11.3+ 開始支援，但有一些限制：
- 沒有 `beforeinstallprompt` 事件（必須手動教使用者「加到主畫面」）
- 推播通知要 iOS 16.4+ 才支援
- 快取上限約 50MB

**Q: 更新 App 怎麼辦？**
A: Service Worker 的 `CACHE_VERSION` 改版號即可。`activate` 階段會自動清除舊快取。

**Q: 使用者抱怨看到的是舊版？**
A: 讓使用者完全關閉 App 再打開一次。或在 App 內加個「重新整理快取」按鈕，發送 `CLEAR_CACHE` 訊息到 SW。

**Q: 可以上架到 App Store 嗎？**
A: 可以，用 **PWABuilder** (https://www.pwabuilder.com) 把 PWA 包裝成 iOS/Android 原生 App，
但需要 Apple 開發者帳號（$99/年）。這已經超出 PWA 本身的範圍。

---

## 版本

- v1.0（2026-04-20）：配合 travel-planner v1.2.0 建立
