---
name: travel-planner
description: >
  生成互動式自由行旅遊網頁（單一 HTML 檔）。當使用者說「幫我做旅遊網頁」、「整理一下我的行程」、
  「排版我的旅遊計畫」、「做一個旅遊指南」、「幫我把行程做成網頁」、「出發前整理」，
  或提到任何目的地 + 行程規劃相關詞語時，立即啟用此 Skill。
  支援全球任何城市，中英雙語切換，內含進階交通票種比價與 Pass 建議，以及即時天氣預報與穿衣建議。
  只要使用者提到自由行、旅遊規劃、行程安排，都應優先詢問是否啟用此 Skill。
---

# 🌏 自由行旅遊網頁生成器

產出物為**單一 HTML 檔**（React + Babel CDN，零依賴），可在瀏覽器直接開啟，也可分享給同行者。

---

## Step 1：收集資訊（問卷）

啟用後，先向使用者收集以下資訊（可一次問完）：

```
請提供以下資訊，我來幫你做旅遊網頁：

1. 🗺️ 目的地城市（可多個，例：大阪 + 京都）
2. 📅 出發 / 回程日期
3. 🏨 住宿地點或區域（用於交通起點計算）
4. 📋 行程內容（每天想去哪、已預訂的景點/餐廳清單）
5. 🎫 機場交通方式是否已確定？（若未確定，我會根據目的地推薦）
6. 🍜 有沒有美食或購物清單要收錄？（可貼 Google Maps 連結或店名）
```

若使用者只提供部分資訊，先用現有資訊產出網頁，缺少的部分用佔位符標示。

---

## Step 2：天氣預報與穿衣建議模組

收到目的地與日期後，在網頁中嵌入 **Open-Meteo 即時天氣 API**（免費、無需 Key、CORS 友好）。

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

### 天氣卡片元件（WeatherCard）

每個 DayPanel 底部加入此元件，與 Tips 卡片並列：

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

### React State 整合

在主 App 元件中新增 `weather` state，頁面載入時 fetch：

```jsx
const [weather, setWeather] = React.useState({});  // key: "YYYY-MM-DD"

React.useEffect(() => {
  async function fetchWeather() {
    try {
      const res = await fetch(WEATHER_URL);  // WEATHER_URL 由 Claude 填入
      const d = await res.json();
      const map = {};
      d.daily.time.forEach((date, i) => {
        const wmo = wmoToEmoji(d.daily.weathercode[i]);
        const maxC = Math.round(d.daily.temperature_2m_max[i]);
        const minC = Math.round(d.daily.temperature_2m_min[i]);
        const precip = +(d.daily.precipitation_sum[i] || 0).toFixed(1);
        map[date] = {
          icon: wmo.icon,
          wmoZh: wmo.zh, wmoEn: wmo.en,
          max: maxC, min: minC, precip,
          clothing: {
            zh: getClothingTip(maxC, minC, precip, "zh"),
            en: getClothingTip(maxC, minC, precip, "en"),
          }
        };
      });
      setWeather(map);
    } catch(e) { console.warn("Weather fetch failed", e); }
  }
  fetchWeather();
}, []);
```

在 DayPanel 呼叫時傳入對應日期的天氣：

```jsx
<DayPanel data={day} lang={lang} weatherData={weather[day.date]} />
```

DayPanel 內部在 Tips 卡片之前加入：

```jsx
<WeatherCard weather={weatherData} lang={lang} />
```

### 中英對照補充

在 T 物件新增：

```javascript
T.zh.weather = "今日天氣";
T.en.weather = "Today's Weather";
T.zh.outfit   = "穿搭建議";
T.en.outfit   = "Outfit";
```

### 預報超出範圍處理

Open-Meteo 免費版最多提供 **16 天預報**。超出範圍時 WeatherCard 顯示歷史均值備注：

```jsx
// 若 date 超過今日 + 16 天，顯示靜態氣候均值
<div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>
  ＊ {lang==="zh" ? "超出預報範圍，顯示歷史氣候均值" : "Beyond forecast range—showing climate average"}
</div>
```

---

## Step 3：交通票種分析

收到目的地後，讀取 `references/transport-db.md` 取得對應城市的票種資料，然後：

1. **計算使用者行程的交通需求**（幾天？市區為主 or 跨城？需要機場接駁？）
2. **比較各票種總費用**（散票 vs Pass vs IC卡）
3. **給出明確建議**（哪張最划算，附省多少日圓/韓圓/歐元）
4. 將建議整合進網頁的「交通攻略」分頁

---

## Step 4：產生 HTML 網頁

讀取 `references/template-guide.md` 了解網頁骨架規格，然後生成完整 HTML。

### 網頁必備功能

**頁首區塊**
- 旅行標題（城市名 + 旅遊天數）
- 日期 & 住宿地點
- 適用地鐵/交通線路標籤

**Tab 導航**（橫向可滑動）
- Day 1 ~ Day N（每天一個 Tab）
- 🚇 交通攻略（票種比價、Pass 建議）
- 🍜 美食清單（若有提供）
- 🛍️ 購物清單（若有提供）

**每日行程 DayPanel**
- 行程摘要（Summary badge）
- 路線卡片（Route Card）：
  - 每段路線：起站 → 終站，交通方式，時間，費用
  - 彩色線路點連線視覺（使用對應交通線路顏色）
  - Google Maps Transit 導航按鈕
- 景點/活動列表（帶 emoji 類型標示）
- 當日小提示（Tips）

**交通攻略 Tab**
- 票種比價表（散票 / IC卡 / Pass 費用對比）
- 推薦票種及省錢金額
- 哪裡購買（官網/Klook/便利商店）
- 注意事項

**美食/購物清單**
- 依區域分組
- 每個地點帶 Google Maps 連結按鈕
- 標示行程對應日期

### 設計規格（繼承自東京版）

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
- 景點/餐廳名稱維持原文（日文/韓文等保留），附中文說明
- 實作方式：用 `lang` state，文字內容存成 `{zh: "...", en: "..."}` 物件

---

## Step 5：輸出

- 輸出完整 HTML 原始碼（可直接存成 .html 開啟）
- 同時說明：「直接另存為 index.html，用瀏覽器開啟即可」
- 如需修改行程、新增景點，可直接告訴我

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
