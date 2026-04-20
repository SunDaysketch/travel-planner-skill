# Travel Planner Skill — Changelog

## v1.1.0-stable（2026-04-20）— 穩定版還原

### 🔄 版本策略調整

經過實際測試，**v1.2.0 的 PWA 功能對一般使用者學習曲線過高**（需理解 manifest、Service Worker、離線快取、圖示生成等概念）。
為了讓 Skill 更貼近初學者與一般使用者，**決定退回 v1.1.0 作為正式推薦版本**。

### ✅ 本次還原保留的功能

- 單一 HTML 檔產出（零依賴）
- 中英雙語切換
- 交通票種智能比價（支援全球多城市）
- **即時天氣預報與穿衣建議**（v1.1.0 的精華）
- 歷史/預報 API 自動切換（bug fix 保留）

### ❌ 本次移除的功能（v1.2.0 新增）

- PWA manifest.json 與 Service Worker
- 離線快取機制
- PWA 圖示生成（192/512/maskable）
- Google Maps 一鍵導航按鈕
- localStorage 行程進度追蹤
- 「📱 安裝到桌面」引導按鈕

### 💾 v1.2.0 檔案保留策略

- v1.2.0 Release **不刪除**，保留供進階使用者下載
- v1.1.0-stable 設為 Latest，一般使用者預設下載此版本
- 若未來重新評估 PWA 的簡化做法，可作為 v1.3.0 的起點

---

## v1.2.0（已封存，不建議一般使用者）

新增 PWA 支援、離線模式、Google Maps 導航、行程進度追蹤。
對初學者複雜度過高，現已退回 v1.1.0-stable。

---

## v1.1.0

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
