# travel-planner v1.2.0 升級操作指引

## 📦 本次升級包含的檔案

```
travel-planner-v1.2.0/
├── SKILL.md                           ← 替換原本的
├── CHANGELOG.md                       ← 新增
├── references/
│   └── pwa-guide.md                   ← 新增
└── assets/                            ← 新增整個目錄
    ├── sw-template.js                 ← Service Worker 範本
    └── manifest-template.json         ← manifest 範本
```

**保留不動的檔案**（v1.1.0 既有）：
- `references/template-guide.md`
- `references/transport-db.md`

---

## 🚀 提交到 GitHub 的步驟

### 步驟 1：下載本次升級檔案

把本目錄 `travel-planner-v1.2.0/` 下的檔案複製到你本機的 `travel-planner-skill` repo。

### 步驟 2：更新檔案

```bash
cd ~/your-path/travel-planner-skill

# 備份舊版（保險起見）
cp SKILL.md SKILL.md.v1.1.0.bak

# 替換主檔
cp /path/to/travel-planner-v1.2.0/SKILL.md ./SKILL.md

# 新增 CHANGELOG
cp /path/to/travel-planner-v1.2.0/CHANGELOG.md ./CHANGELOG.md

# 新增 PWA 指南
cp /path/to/travel-planner-v1.2.0/references/pwa-guide.md ./references/

# 新增 assets 目錄
mkdir -p assets
cp /path/to/travel-planner-v1.2.0/assets/* ./assets/
```

### 步驟 3：確認目錄結構

```
travel-planner-skill/
├── SKILL.md                    ← v1.2.0
├── CHANGELOG.md                ← 🆕
├── README.md                   (原本就有)
├── LICENSE                     (原本就有)
├── references/
│   ├── template-guide.md       (保留)
│   ├── transport-db.md         (保留)
│   └── pwa-guide.md            ← 🆕
└── assets/
    ├── sw-template.js          ← 🆕
    └── manifest-template.json  ← 🆕
```

### 步驟 4：提交 Git

```bash
git add .
git commit -m "feat: upgrade to v1.2.0 - Add PWA support

- Add manifest.json generation
- Add Service Worker for offline caching
- Add Google Maps navigation buttons
- Add localStorage-based trip progress tracking
- Add weather data pre-caching
- Add install prompt for 'Add to Home Screen'
- New references/pwa-guide.md for detailed implementation
- New assets/ folder with templates"

git tag v1.2.0
git push origin main --tags
```

### 步驟 5：建立 GitHub Release

到你的 repo `sundaysketch/travel-planner-skill` 頁面：

1. 點 **Releases** > **Draft a new release**
2. Choose tag：`v1.2.0`
3. Release title：`v1.2.0 - PWA Support`
4. 把 `CHANGELOG.md` 裡 v1.2.0 的內容貼到 description
5. Publish release

---

## 🧪 測試升級後的 Skill

### 測試情境 1：基本觸發
```
你：幫我做一個首爾 3 日遊的旅遊網頁
預期：Claude 啟用 travel-planner v1.2.0，問你問卷，
      最後產出 6 個檔案（index.html + manifest.json + sw.js + 3 個圖示）
```

### 測試情境 2：PWA 安裝流程
```
1. 把產出的檔案放到一個資料夾
2. 用 Python 啟動本地伺服器：
   python -m http.server 8000
3. Chrome 打開 http://localhost:8000
4. 網址列右邊應該出現「安裝」圖示
5. 點擊安裝，桌面會出現 App 圖示
```

### 測試情境 3：離線模式
```
1. 安裝為 PWA
2. 開啟 App 確認一切正常
3. 關閉 WiFi + 行動網路
4. 重新打開 App → 應該仍然能看到所有行程與天氣
```

### 測試情境 4：Google Maps 導航
```
1. 打開某一天的行程
2. 點景點旁的「🗺️ 導航」按鈕
3. 應該跳轉到 Google Maps 並搜尋該地點
```

### 測試情境 5：進度追蹤
```
1. 點某個景點左邊的勾選框
2. 該景點變半透明 + 文字加刪除線
3. 重新整理頁面，狀態保持
4. 頁首進度條更新（例如 3/15）
```

---

## 💡 使用上的注意事項

### iOS Safari 的限制

- **沒有 `beforeinstallprompt`**：iOS 使用者必須手動點分享 > 加到主畫面
- **推播通知**：iOS 16.4+ 才支援，且要求 App 必須已安裝
- **快取上限**：約 50MB，旅遊 App 通常綽綽有餘

### 關於圖示生成

v1.2.0 會產出 6 個檔案，其中 3 個是圖示。如果你沒有自己的圖示素材：

**方案 A（懶人）**：讓 Claude 用 skywork-design 臨時生成
```
你：請用 skywork-design 幫我生成這趟旅遊的 App 圖示，
    主題是東京鐵塔 + 櫻花，深藍背景
```

**方案 B（精緻）**：用 https://maskable.app/editor 自己設計
- 先畫一個 512x512 PNG
- 上傳確認 maskable 安全區
- 下載各種尺寸

**方案 C（最快）**：用 Python PIL 產文字圖示
- 參考 `references/pwa-guide.md` 第 3 節的範例程式碼

---

## 🐛 已知問題

目前無已知重大問題。如果測試時發現問題，記得回來跟我說，我會在 v1.2.1 修正。

---

## 📊 v1.2.0 vs v1.1.0 比較

| 項目 | v1.1.0 | v1.2.0 |
|------|--------|--------|
| 產出檔案數 | 1 (index.html) | 6 (index + manifest + sw + 3 圖示) |
| 可安裝到桌面 | ❌ | ✅ |
| 離線使用 | ❌ | ✅ |
| Google Maps 導航 | ❌ | ✅ |
| 進度追蹤 | ❌ | ✅ |
| 天氣離線 | ❌ | ✅ |
| 中英雙語 | ✅ | ✅ |
| 交通比價 | ✅ | ✅ |
| 天氣預報 | ✅ | ✅ |

---

## 🔮 未來版本規劃（可參考，非承諾）

### v1.3.0（可能）
- 預算追蹤模組（每日花費記錄）
- 深色模式
- 字體大小調整（旅遊戶外使用）

### v1.4.0（可能）
- 離線地圖 SVG（不依賴 Google Maps）
- 交通時刻表即時查詢（日本 Jorudan / 台灣 TDX）
- 分享唯讀版 URL

### v2.0.0（遠期）
- React Native 版本（真正的 App Store 上架）
