# Travel Planner Skill — Changelog

## v1.2.0（2026-04-20）— PWA 版本

### 🆕 新增功能

#### PWA 可安裝應用
- 新增 `manifest.json` 支援「加到主畫面」
- 新增 Service Worker (`sw.js`) 實現離線快取
- 產出 PWA 圖示（192、512、maskable 三組）
- HTML `<head>` 加入完整 PWA meta 標籤（含 iOS Safari 支援）

#### 離線優先體驗
- 天氣資料預快取到 HTML（`INITIAL_WEATHER_DATA`），離線也能看
- React CDN 資源首次載入後永久快取
- 天氣 API 採 Network First 策略，有網路拿最新、無網路用快取

#### 景點互動功能
- 🗺️ **Google Maps 一鍵導航**：每個景點旁加按鈕，點擊跳轉原生地圖
- ✅ **行程進度追蹤**：用 localStorage 記住去過哪些景點，打勾後半透明
- 📊 **進度條**：頁首顯示「已完成 N/M 個景點」

#### 安裝引導
- 偵測 `beforeinstallprompt` 事件，顯示「📱 安裝到桌面」浮動按鈕
- 點擊觸發原生安裝提示
- 安裝後自動隱藏按鈕

### 📝 文件更新
- 新增 `references/pwa-guide.md`（完整 PWA 實作指南）
- `SKILL.md` 新增 Step 4（PWA 資源生成）與 Step 6（部署指南）
- 更新使用者安裝流程說明（iOS / Android 分別說明）

### 🔧 技術細節
- Service Worker 使用 Cache First + stale-while-revalidate 策略
- 支援 `env(safe-area-inset-*)` 避開 iPhone 瀏海
- `viewport-fit=cover` 設定全螢幕體驗
- 快取版本號管理，升級時自動清除舊快取

### ⚠️ 升級注意事項
- PWA 必須透過 HTTPS 或 localhost 才能運作（GitHub Pages 已自動支援）
- iOS Safari 的 PWA 功能相對受限（無推播、無 beforeinstallprompt）
- 更新 App 版本時記得改 `sw.js` 裡的 `CACHE_VERSION`

---

## v1.1.0（之前版本）

### 新增
- 天氣模組（Open-Meteo API 整合）
- WMO 天氣代碼 → Emoji 對照
- 穿衣建議邏輯（依溫度、溫差、降雨）
- WeatherCard React 元件
- 歷史 vs 預報 API 端點自動選擇（bug fix）

---

## v1.0.0（初版）

### 新增
- 單一 HTML 檔產出（React + Babel CDN）
- 中英雙語切換
- 日程 Tab 導航
- 路線卡片（彩色交通線）
- 交通票種比價
- 美食/購物清單
- 全球城市支援
