---
name: travel-planner
description: >
  生成互動式自由行旅遊網頁（PWA 可安裝應用）。當使用者說「幫我做旅遊網頁」、「整理一下我的行程」、
  「排版我的旅遊計畫」、「做一個旅遊指南」、「幫我把行程做成網頁」、「出發前整理」，
  或提到任何目的地 + 行程規劃相關詞語時，立即啟用此 Skill。
  v1.2.0 新增 PWA 支援：可「加到主畫面」、離線使用、Google Maps 一鍵導航、行程進度追蹤。
  支援全球任何城市，中英雙語切換，內含進階交通票種比價與 Pass 建議，以及即時天氣預報與穿衣建議。
  只要使用者提到自由行、旅遊規劃、行程安排，都應優先詢問是否啟用此 Skill。
---

# 🌏 自由行旅遊網頁生成器 v1.2.0

產出物為**可安裝的 PWA 旅遊 App**（單一 HTML 檔 + manifest + Service Worker + 圖示），
可在瀏覽器直接開啟，使用者可選「加到主畫面」變成像原生 App 一樣的體驗。

## v1.2.0 升級重點

- 🏠 **PWA 支援**：使用者可「加到主畫面」，桌面出現 App 圖示，全螢幕無瀏覽器 UI
- 📴 **離線模式**：Service Worker 快取所有資源，出國無網路也能看行程
- 🗺️ **Google Maps 一鍵導航**：每個景點旁邊加按鈕，點擊跳轉導航
- ✅ **行程進度追蹤**：localStorage 記住去過哪些景點，打勾標記
- 💰 **預算追蹤（可選）**：每日花費記錄
- ☀️ **天氣快取**：天氣資料預先寫入 HTML，離線也能看預報

---

## Step 1：收集資訊（問卷）

啟用後，先向使用者收集以下資訊：

```
請提供以下資訊，我來幫你做旅遊 PWA App：

1. 🗺️ 目的地城市（可多個，例：大阪 + 京都）
2. 📅 出發 / 回程日期
3. 🏨 住宿地點或區域（用於交通起點計算）
4. 📋 行程內容（每天想去哪、已預訂的景點/餐廳清單）
5. 🎫 機場交通方式是否已確定？（若未確定，我會根據目的地推薦）
6. 🍜 有沒有美食或購物清單要收錄？（可貼 Google Maps 連結或店名）
7. 💰 要不要加預算追蹤功能？（可輸入每日預算上限）
```

若使用者只提供部分資訊，先用現有資訊產出網頁，缺少的部分用佔位符標示。

---

## Step 2：天氣預報與穿衣建議模組（含離線快取）

收到目的地與日期後，在網頁中嵌入 **Open-Meteo 即時天氣 API**（免費、無需 Key、CORS 友好）。

**v1.2.0 新做法**：
1. 產生 HTML 時先 **預先 fetch 天氣資料**，把結果寫入 HTML 的 `<script>` 區塊成為 `INITIAL_WEATHER_DATA` 常數
2. 網頁載入時先用這份快取資料即時渲染
3. 背景再呼叫 API 更新（若有網路）

這樣即使使用者在飛機上、或當地網路不穩，至少能看到出發前最新的天氣。

### ⚠️ API 選擇規則（依行程日期判斷）

| 行程日期 | 使用端點 | 天氣代碼欄位 |
|---------|---------|------------|
| **今天起未來 16 天內**（即將出發） | `api.open-meteo.com/v1/forecast` | `weathercode` |
| **今天之前**（歷史／回顧行程） | `archive-api.open-meteo.com/v1/archive` | `weather_code` |

> 兩端點欄位名稱不同！forecast 用 `weathercode`，archive 用 `weather_code`（含底線）。JS 讀取時對應為 `d.daily.weathercode` 或 `d.daily.weather_code`。

### API 規格

```javascript
// ── 即將出發行程（未來日期）──
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=35.6762&longitude=139.6503" +
  "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode" +
  "&timezone=Asia%2FTokyo" +
  "&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD";
// JS 讀取：d.daily.weathercode[i]

// ── 歷史回顧行程（過去日期）──
const WEATHER_URL =
  "https://archive-api.open-meteo.com/v1/archive" +
  "?latitude=35.6762&longitude=139.6503" +
  "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code" +
  "&timezone=Asia%2FTokyo" +
  "&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD";
// JS 讀取：d.daily.weather_code[i]
```

> **多城市行程**：依各城市的日期範圍分別呼叫，結果合併進對應 Day Tab。

### WMO 天氣代碼 → Emoji 對照

```javascript
function wmoToEmoji(code) {
  if (code === 0)           return { icon: "☀️", zh: "晴天",   en: "Sunny" };
  if (code <= 3)            return { icon: "⛅", zh: "多雲",   en: "Cloudy" };
  if (code <= 49)           return { icon: "🌫️", zh: "霧/薄霧", en: "Foggy" };
  if (code <= 67)           return { icon: "🌧️", zh: "降雨",   en: "Rain" };
  if (code <= 77)           return { icon: "❄️", zh: "降雪",   en: "Snow" };
  if (code <= 82)           return { icon: "🌦️", zh: "陣雨",   en: "Showers" };
  if (code <= 99)           return { icon: "⛈️", zh: "雷陣雨", en: "Thunderstorm" };
  return { icon: "🌡️", zh: "未知", en: "Unknown" };
}
```

### 穿衣建議邏輯

```javascript
function getClothingTip(maxC, minC, precipMm, lang) {
  const diff = maxC - minC;
  let base = maxC >= 28 ? (lang==="zh" ? "輕薄短袖" : "Light T-shirt")
           : maxC >= 22 ? (lang==="zh" ? "短袖 + 薄外套" : "T-shirt + light jacket")
           : maxC >= 16 ? (lang==="zh" ? "長袖 + 薄外套" : "Long sleeve + jacket")
           : maxC >= 10 ? (lang==="zh" ? "毛衣 + 厚外套" : "Sweater + coat")
           :              (lang==="zh" ? "羽絨衣 + 圍巾" : "Down jacket + scarf");
  const tips = [base];
  if (diff >= 10) tips.push(lang==="zh" ? "日夜溫差大，建議洋蔥穿搭" : "Big temp swing—layer up");
  if (precipMm >= 1) tips.push(lang==="zh" ? `預計降雨 ${precipMm.toFixed(1)}mm，帶摺疊傘` : `Rain ${precipMm.toFixed(1)}mm expected—bring umbrella`);
  return tips.join("，");
}
```

### 天氣預快取策略（v1.2.0 新增）

在產生 HTML 前，Claude 需先呼叫一次 Open-Meteo API（使用 web_fetch 工具），
把結果嵌入 HTML 作為 `INITIAL_WEATHER_DATA`：

```html
<script>
  // 由 Claude 在生成時填入（離線可看）
  const INITIAL_WEATHER_DATA = {
    "2026-04-14": { icon:"☀️", max:22, min:14, precip:0, wmoZh:"晴天", wmoEn:"Sunny", ... },
    "2026-04-15": { ... },
    // ...
  };
</script>
```

React State 初始值就用這份資料：

```jsx
const [weather, setWeather] = React.useState(INITIAL_WEATHER_DATA);

React.useEffect(() => {
  // 嘗試更新（有網路才會成功，失敗保持初始快取）
  async function refreshWeather() {
    try {
      const res = await fetch(WEATHER_URL);
      const d = await res.json();
      // ... 處理並 setWeather(map)
    } catch(e) {
      console.warn("離線模式，使用快取天氣");
    }
  }
  refreshWeather();
}, []);
```

### 天氣卡片元件（WeatherCard）

```jsx
function WeatherCard({ weather, lang }) {
  if (!weather) return (
    <div style={{ background:"#f8fafc", border:"1px dashed #cbd5e1", borderRadius:12,
                  padding:"12px 14px", marginBottom:12, fontSize:12, color:"#94a3b8", textAlign:"center" }}>
      {lang==="zh" ? "☁️ 天氣資料載入中..." : "☁️ Loading weather..."}
    </div>
  );
  const { icon, max, min, precip, wmoZh, wmoEn, clothing } = weather;
  return (
    <div style={{ background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"1.5px solid #bfdbfe",
                  borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
      <div style={{ fontWeight:700, fontSize:13, color:"#1d4ed8", marginBottom:8 }}>
        {icon} {lang==="zh" ? "今日天氣" : "Today's Weather"}
        <span style={{ fontSize:11, fontWeight:500, color:"#3b82f6", marginLeft:8 }}>
          {lang==="zh" ? wmoZh : wmoEn}
        </span>
      </div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:13 }}>
        <span>🌡️ <b>{max}°C</b> / {min}°C</span>
        <span>🌂 {lang==="zh" ? `降雨 ${precip}mm` : `Rain ${precip}mm`}</span>
      </div>
      <div style={{ marginTop:8, fontSize:12, color:"#1e40af", fontWeight:500 }}>
        👕 {lang==="zh" ? `穿搭建議：${clothing.zh}` : `Outfit: ${clothing.en}`}
      </div>
    </div>
  );
}
```

---

## Step 3：交通票種分析

收到目的地後，讀取 `references/transport-db.md` 取得對應城市的票種資料，然後：

1. **計算使用者行程的交通需求**（幾天？市區為主 or 跨城？需要機場接駁？）
2. **比較各票種總費用**（散票 vs Pass vs IC卡）
3. **給出明確建議**（哪張最划算，附省多少日圓/韓圓/歐元）
4. 將建議整合進網頁的「交通攻略」分頁

---

## Step 4：產生 PWA 資源（v1.2.0 新增）

除了主 HTML 檔外，額外產生以下檔案。詳細規格見 `references/pwa-guide.md`。

### 必備檔案清單

| 檔案 | 用途 |
|------|------|
| `index.html` | 主 App（內含 manifest link 與 SW 註冊）|
| `manifest.json` | PWA 宣告檔（App 名稱、圖示、主題色）|
| `sw.js` | Service Worker（離線快取邏輯）|
| `icon-192.png` | App 圖示 192x192（必須）|
| `icon-512.png` | App 圖示 512x512（必須）|
| `icon-maskable.png` | Android 自適應圖示（建議）|

### HTML `<head>` 必要標籤

```html
<!-- PWA manifest -->
<link rel="manifest" href="manifest.json">

<!-- iOS Safari 特別支援 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Tokyo Guide">
<link rel="apple-touch-icon" href="icon-192.png">

<!-- 主題色（影響 Android 狀態列）-->
<meta name="theme-color" content="#1e293b">

<!-- Viewport 要加 viewport-fit=cover 才能用到瀏海區 -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### Service Worker 註冊

HTML 底部加入：

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW registration failed:', err));
    });
  }
</script>
```

### 安裝引導 UI（可選但推薦）

顯示一個 **「📱 安裝到桌面」** 的浮動按鈕，點擊觸發安裝提示：

```jsx
function InstallButton({ lang }) {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;
  return (
    <button onClick={install} style={{
      position:"fixed", bottom:20, right:20, zIndex:1000,
      background:"#1e293b", color:"white", border:"none", borderRadius:24,
      padding:"12px 20px", fontSize:14, fontWeight:600, cursor:"pointer",
      boxShadow:"0 4px 12px rgba(0,0,0,0.2)"
    }}>
      📱 {lang==="zh" ? "安裝到桌面" : "Install App"}
    </button>
  );
}
```

### Google Maps 一鍵導航按鈕

每個景點/餐廳卡片加入：

```jsx
function MapNavButton({ placeName, lang }) {
  const query = encodeURIComponent(placeName);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  return (
    <a href={url} target="_blank" rel="noopener" style={{
      display:"inline-flex", alignItems:"center", gap:4,
      background:"#1a73e8", color:"white", textDecoration:"none",
      padding:"6px 12px", borderRadius:6, fontSize:12, fontWeight:600
    }}>
      🗺️ {lang==="zh" ? "導航" : "Navigate"}
    </a>
  );
}
```

### 行程進度追蹤（localStorage）

每個景點卡片左側加入 checkbox，狀態存 localStorage：

```jsx
function PlaceCard({ place, lang }) {
  const storageKey = `visited:${place.id}`;
  const [visited, setVisited] = React.useState(
    () => localStorage.getItem(storageKey) === 'true'
  );

  const toggle = () => {
    const next = !visited;
    setVisited(next);
    localStorage.setItem(storageKey, String(next));
  };

  return (
    <div style={{ opacity: visited ? 0.5 : 1, ...etc }}>
      <input type="checkbox" checked={visited} onChange={toggle} />
      <span style={{ textDecoration: visited ? "line-through" : "none" }}>
        {place.name}
      </span>
      <MapNavButton placeName={place.name} lang={lang} />
    </div>
  );
}
```

---

## Step 5：產生主 HTML 網頁

讀取 `references/template-guide.md` 了解網頁骨架規格，然後生成完整 HTML。

### 網頁必備功能

**頁首區塊**
- 旅行標題（城市名 + 旅遊天數）
- 日期 & 住宿地點
- 適用地鐵/交通線路標籤
- **🆕 進度條**：顯示「已完成 N/M 個景點」

**Tab 導航**（橫向可滑動）
- Day 1 ~ Day N（每天一個 Tab）
- 🚇 交通攻略（票種比價、Pass 建議）
- 🍜 美食清單（若有提供）
- 🛍️ 購物清單（若有提供）

**每日行程 DayPanel**
- 行程摘要（Summary badge）
- 路線卡片（Route Card）
- 景點/活動列表（**🆕 每個帶勾選 + 導航按鈕**）
- 天氣卡片（WeatherCard）
- 當日小提示（Tips）

**交通攻略 Tab**
- 票種比價表
- 推薦票種及省錢金額
- 哪裡購買
- 注意事項

**美食/購物清單**
- 依區域分組
- 每個地點帶 Google Maps 連結按鈕
- **🆕 勾選已去過**

### 設計規格

```
色系：深色 header (#1e293b ~ #334155)，白色卡片，柔和背景 (#f0f2f5)
字體：Noto Sans TC（繁中主力）
Tab：sticky top，底線 active 指示
卡片：白底，圓角 12px，陰影
交通線路：使用各城市官方線路色（見 transport-db.md）
Google Maps 按鈕：藍色 #1a73e8，小型 icon-btn 樣式
動畫：fadeSlide（opacity + translateY 8px）
```

### 中英雙語切換

- 頁首右上角放語言切換按鈕（中文 / EN）
- 切換後：頁籤名稱、景點說明、Tips 等文字同步替換
- 景點/餐廳名稱維持原文，附中文說明
- 實作方式：用 `lang` state，文字內容存成 `{zh: "...", en: "..."}` 物件

---

## Step 6：輸出與部署建議

產出 6 個檔案（放在同一目錄）：

1. `index.html`
2. `manifest.json`
3. `sw.js`
4. `icon-192.png`
5. `icon-512.png`
6. `icon-maskable.png`（可選）

### 部署選項

**選項 A：本機使用**
- 直接用 Live Server 或 `python -m http.server` 啟動（PWA 需 HTTPS 或 localhost）
- 手機連同 WiFi 就能用 IP 訪問

**選項 B：GitHub Pages（推薦）**
```bash
git init
git add .
git commit -m "v1.2.0 PWA release"
git push origin main
# 到 GitHub repo 的 Settings > Pages 啟用
```
會得到類似 `https://sundaysketch.github.io/tokyo-trip/` 的網址。

**選項 C：Cloudflare Pages / Netlify**
- 拖拉資料夾即可部署，自動 HTTPS

### 使用者安裝流程

告訴使用者：
```
📱 如何安裝到手機桌面：

iPhone (Safari):
1. 開啟網址
2. 點下方分享按鈕 ↑
3. 選「加入主畫面」

Android (Chrome):
1. 開啟網址
2. 右上角選單 ⋮
3. 選「安裝應用程式」

安裝後桌面會出現 App 圖示，點開就是全螢幕體驗，
網路斷線也能看行程！
```

---

## 特殊情境處理

**多城市行程**（如大阪 + 京都 + 奈良）
- Day Tab 照日期排，城市切換在 Summary 標示
- 城市間交通（新幹線/巴士）單獨做一段路線卡片
- 交通攻略需比較跨城 Pass（如 JR Pass vs 散票）

**日歸一日遊**（如東京出發→箱根）
- 做成單獨 Day Tab
- 來回路線分開標示

**使用者提供 Google Maps 連結**
- 直接套用連結到美食/購物清單的地圖按鈕
- 萃取店名顯示

---

## 參考資料

- `references/transport-db.md`：全球主要城市交通票種資料庫
- `references/template-guide.md`：HTML 骨架詳細規格 & 程式碼片段
- `references/pwa-guide.md`：🆕 PWA 完整實作指南（manifest, SW, 圖示產生）

---

## 版本歷史

- **v1.2.0**（2026-04-20）：加入 PWA 支援、離線模式、Google Maps 導航、行程進度追蹤
- v1.1.0：加入天氣模組（Open-Meteo API、WMO 代碼、穿衣建議）
- v1.0.0：初版，中英雙語、交通票種比價
