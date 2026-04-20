# HTML 網頁骨架規格 & 程式碼模板

> 此網頁採用 React 18（CDN）+ Babel Standalone，單一 HTML 檔案，零依賴，瀏覽器直接開啟。

---

## 基礎 HTML 殼層

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{城市名}自由行指南 | {City} Travel Guide</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>{目的地emoji}</text></svg>" />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  /* 基礎樣式 */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { height: 0; width: 0; }
  body { background: #f0f2f5; font-family: 'Noto Sans TC', 'Helvetica Neue', sans-serif; }
  @keyframes fadeSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  
  /* Google Maps 按鈕 */
  .gmaps-btn {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600; font-family: inherit;
    color: #fff; background: #1a73e8; border: none; border-radius: 8px;
    padding: 5px 10px; cursor: pointer; text-decoration: none;
    transition: background .15s, transform .1s; white-space: nowrap; margin-top: 4px;
  }
  .gmaps-btn:hover { background: #1557b0; }
  .gmaps-icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 8px; background: #1a73e8;
    color: #fff; text-decoration: none; flex-shrink: 0;
    transition: background .15s, transform .1s;
  }
  .gmaps-icon-btn:hover { background: #1557b0; }
  
  /* 交通票種卡片 */
  .transport-card { background: linear-gradient(135deg, #fdf4ff 0%, #faf5ff 100%); border: 1.5px solid #d8b4fe; }
  .savings-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; color: #fff; background: linear-gradient(90deg, #7c3aed, #a855f7); padding: 2px 8px; border-radius: 10px; }
</style>
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.9/babel.min.js"></script>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const { useState } = React;

/* ===== 資料區 ===== */
// 景點/美食/購物清單
var FOOD_SPOTS = [/* { n: 店名, u: Google Maps URL, a: 區域 } */];
var SHOP_SPOTS = [/* { n: 店名, u: URL, a: 區域 } */];

// 每日行程
const DAYS = [/* DayData objects */];

// 中英文字對照
const T = {
  zh: {
    title: "{城市}自由行路線指南",
    subtitle: "📍 {住宿地點} | {日期範圍}",
    tabs: { food: "美食", shop: "購物", transport: "交通攻略" },
    tips: "小提示",
    route: "路線",
    // ...其他文字
  },
  en: {
    title: "{City} Travel Guide",
    subtitle: "📍 {Hotel} | {Date Range}",
    tabs: { food: "Food", shop: "Shopping", transport: "Transport" },
    tips: "Tips",
    route: "Route",
  }
};

/* ===== 工具函式 ===== */
function buildGMapsTransitURL(from, to, city) {
  const origin = encodeURIComponent(from + " " + city);
  const dest = encodeURIComponent(to + " " + city);
  return "https://www.google.com/maps/dir/?api=1&origin=" + origin + "&destination=" + dest + "&travelmode=transit";
}

function buildGMapsPlaceURL(placeName, city) {
  return "https://www.google.com/maps/search/" + encodeURIComponent(placeName + " " + city);
}

/* ===== 元件 ===== */
// 地圖 Pin SVG
function MapPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#fff"/>
    </svg>
  );
}

// 路線步驟
function RouteStep({ step, isLast }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14 }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: step.lineColor, border: "2.5px solid #fff", boxShadow: "0 0 0 1.5px " + step.lineColor + "40", flexShrink: 0, marginTop: 4 }} />
        {!isLast && <div style={{ flex: 1, width: 3, borderRadius: 2, background: "linear-gradient(to bottom, " + step.lineColor + ", " + step.lineColor + "30)", marginTop: 2, marginBottom: 2, minHeight: 20 }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{step.from}</span>
          <span style={{ color: "#64748b", fontSize: 12 }}>→</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{step.to}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: step.lineColor, background: step.lineColor + "15", padding: "1px 7px", borderRadius: 10 }}>{step.time}</span>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{step.line}</div>
        {step.note && <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 2, fontWeight: 500 }}>{step.note}</div>}
        <a className="gmaps-icon-btn" href={buildGMapsTransitURL(step.from, step.to, CITY)} target="_blank" rel="noopener noreferrer" style={{ marginTop: 6, width: "auto", padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 8, gap: 4 }}>
          <MapPin /> 導航
        </a>
      </div>
    </div>
  );
}

// 路線卡片
function RouteCard({ route }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{route.label}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {route.badge && <span style={{ fontSize: 11, fontWeight: 600, color: "#0ea5e9", background: "#e0f2fe", padding: "2px 8px", borderRadius: 10 }}>{route.badge}</span>}
          {route.cost && <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 10 }}>{route.cost}</span>}
        </div>
      </div>
      {route.steps.map((step, i) => <RouteStep key={i} step={step} isLast={i === route.steps.length - 1} />)}
    </div>
  );
}

// 每日面板
function DayPanel({ data, lang }) {
  if (!data) return null;
  return (
    <div style={{ animation: "fadeSlide .25s ease" }}>
      {/* 摘要 */}
      <div style={{ background: data.color + "12", border: "1.5px solid " + data.color + "30", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: data.color }}>{data.icon} {lang === "zh" ? data.summary : data.summaryEn || data.summary}</div>
      </div>
      {/* 路線 */}
      {data.routes && data.routes.map((r, i) => <RouteCard key={i} route={r} />)}
      {/* 景點列表 */}
      {data.spots && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 10 }}>📍 {lang === "zh" ? "今日景點" : "Today's Spots"}</div>
          {data.spots.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderBottom: i < data.spots.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon || "📌"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{s.name}</div>
                {s.note && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{lang === "zh" ? s.note : s.noteEn || s.note}</div>}
              </div>
              {s.mapsUrl && (
                <a className="gmaps-icon-btn" href={s.mapsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Tips */}
      {data.tips && data.tips.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#92400e", marginBottom: 6 }}>💡 {lang === "zh" ? "小提示" : "Tips"}</div>
          {data.tips.map((tip, i) => <div key={i} style={{ fontSize: 12, color: "#78350f", marginBottom: 3 }}>{tip}</div>)}
        </div>
      )}
    </div>
  );
}

// 交通攻略面板
function TransportPanel({ data, lang }) {
  return (
    <div style={{ animation: "fadeSlide .25s ease" }}>
      {data.recommendation && (
        <div className="transport-card" style={{ borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#7c3aed", marginBottom: 8 }}>🎫 {lang === "zh" ? "推薦票種" : "Recommended Pass"}</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>{data.recommendation.name}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{lang === "zh" ? data.recommendation.reason : data.recommendation.reasonEn || data.recommendation.reason}</div>
          {data.recommendation.saving && <span className="savings-badge" style={{ marginTop: 8, display: "inline-flex" }}>省 {data.recommendation.saving}</span>}
        </div>
      )}
      {data.comparison && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 10 }}>💰 {lang === "zh" ? "費用比較" : "Cost Comparison"}</div>
          {data.comparison.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < data.comparison.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                {item.note && <div style={{ fontSize: 11, color: "#64748b" }}>{item.note}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: item.recommended ? "#7c3aed" : "#1e293b" }}>{item.cost}</div>
                {item.recommended && <span style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600 }}>✓ {lang === "zh" ? "推薦" : "Best"}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {data.notes && (
        <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#92400e", marginBottom: 6 }}>⚠️ {lang === "zh" ? "注意事項" : "Notes"}</div>
          {data.notes.map((note, i) => <div key={i} style={{ fontSize: 12, color: "#78350f", marginBottom: 3 }}>{note}</div>)}
        </div>
      )}
    </div>
  );
}

// 地點清單面板
function SpotListPanel({ spots, title, icon, lang }) {
  const areas = [...new Set(spots.map(s => s.a))];
  return (
    <div style={{ animation: "fadeSlide .25s ease" }}>
      {areas.map(area => (
        <div key={area} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#64748b", letterSpacing: 1, marginBottom: 8, padding: "0 2px" }}>{area}</div>
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            {spots.filter(s => s.a === area).map((spot, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{spot.n}</span>
                <a className="gmaps-icon-btn" href={spot.u || buildGMapsPlaceURL(spot.n, CITY)} target="_blank" rel="noopener noreferrer">
                  <MapPin />
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== 主 App ===== */
const CITY = "{城市名，用於 Google Maps 搜尋}";

function App() {
  const [activeDay, setActiveDay] = useState(1);
  const [showPanel, setShowPanel] = useState(null); // null | "transport" | "food" | "shop"
  const [lang, setLang] = useState("zh");

  const dayTabs = DAYS.map(d => ({ key: d.day, label: "Day " + d.day, sub: d.date, icon: d.icon, color: d.color }));
  const extraTabs = [
    { key: "transport", label: lang === "zh" ? "交通攻略" : "Transport", icon: "🚇", color: "#0ea5e9" },
    { key: "food", label: lang === "zh" ? "美食" : "Food", icon: "🍜", color: "#f59e0b" },
    { key: "shop", label: lang === "zh" ? "購物" : "Shop", icon: "🛍️", color: "#ec4899" },
  ];
  const allTabs = [...dayTabs, ...extraTabs];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", padding: "24px 20px 18px", color: "#fff", position: "relative" }}>
        <button onClick={() => setLang(lang === "zh" ? "en" : "zh")} style={{ position: "absolute", top: 16, right: 16, fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>
          {lang === "zh" ? "EN" : "中"}
        </button>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, opacity: .6, marginBottom: 4 }}>TRAVEL GUIDE</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{lang === "zh" ? T.zh.title : T.en.title}</div>
        <div style={{ fontSize: 12.5, opacity: .7, marginTop: 4 }}>{lang === "zh" ? T.zh.subtitle : T.en.subtitle}</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", overflowX: "auto", background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
        {allTabs.map(t => {
          const isExtra = ["transport","food","shop"].includes(t.key);
          const isActive = isExtra ? showPanel === t.key : (!showPanel && activeDay === t.key);
          return (
            <button key={t.key} onClick={() => { if (isExtra) setShowPanel(showPanel === t.key ? null : t.key); else { setShowPanel(null); setActiveDay(t.key); } }}
              style={{ flex: "1 0 auto", minWidth: 52, padding: "10px 6px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, border: "none", cursor: "pointer", fontFamily: "inherit", background: isActive ? t.color + "10" : "transparent", borderBottom: isActive ? "2.5px solid " + t.color : "2.5px solid transparent", transition: "all .15s" }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontSize: 11, fontWeight: isActive ? 800 : 600, color: isActive ? t.color : "#64748b" }}>{t.label}</span>
              {t.sub && <span style={{ fontSize: 9, color: "#64748b", opacity: .7 }}>{t.sub}</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 40px" }}>
        {showPanel === "transport" ? <TransportPanel data={TRANSPORT_DATA} lang={lang} />
          : showPanel === "food" ? <SpotListPanel spots={FOOD_SPOTS} title="美食" icon="🍜" lang={lang} />
          : showPanel === "shop" ? <SpotListPanel spots={SHOP_SPOTS} title="購物" icon="🛍️" lang={lang} />
          : <DayPanel data={DAYS.find(d => d.day === activeDay)} lang={lang} />}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
</script>
</body>
</html>
```

---

## 資料結構規格

### DayData 物件
```javascript
{
  day: 1,                    // Tab 數字
  date: "04/14（二）",       // 顯示日期
  title: "抵達東京",          // 標題
  icon: "✈️",               // Emoji
  color: "#6366f1",          // Tab / 標題色
  summary: "機場 → 飯店",    // 中文摘要
  summaryEn: "Airport → Hotel", // 英文摘要
  routes: [RouteData],       // 路線陣列
  spots: [SpotData],         // 景點陣列
  tips: ["提示1", "提示2"]   // Tips
}
```

### RouteData 物件
```javascript
{
  label: "機場快線 → JR → 飯店",
  badge: "約54分",
  cost: "¥2,520",
  steps: [
    {
      from: "成田空港",
      to: "京成上野",
      line: "京成スカイライナー",
      lineColor: "#1e40af",  // 官方線路色
      time: "41分",
      note: "⚠️ 步行5分至JR上野站"  // 可省略
    }
  ]
}
```

### SpotData 物件
```javascript
{
  icon: "🏯",
  name: "景點名稱",
  note: "中文說明",
  noteEn: "English note",
  mapsUrl: "https://maps.google.com/..."  // 可省略
}
```

### TransportData 物件
```javascript
const TRANSPORT_DATA = {
  recommendation: {
    name: "東京地鐵72小時券",
    reason: "此行需搭乘地鐵約18次，散票約¥3,600，72小時券¥1,500",
    reasonEn: "~18 metro rides, ¥1,500 vs ¥3,600 scattered",
    saving: "¥2,100"
  },
  comparison: [
    { name: "散票（Suica）", cost: "¥3,600", note: "約18次" },
    { name: "72小時券", cost: "¥1,500", note: "無限次", recommended: true },
    { name: "24小時券×3", cost: "¥1,800", note: "需連續72小時" },
  ],
  notes: [
    "⚠️ 地鐵券不含JR線，需另計費",
    "💡 在機場便利商店或地鐵站售票機購買",
  ]
};
```

---

## Day 色盤建議

```
Day 1: #6366f1（靛紫）
Day 2: #0ea5e9（天藍）
Day 3: #f59e0b（金橙）
Day 4: #10b981（翠綠）
Day 5: #ec4899（玫紅）
Day 6: #8b5cf6（紫羅蘭）
Day 7: #f97316（橙）
Day 8: #06b6d4（青藍）
```

---

## 天氣模組完整實作範本

### 1. 在 `<script type="text/babel">` 資料區頂部加入

```javascript
// ── 天氣設定（Claude 依城市填入） ──────────────────────────
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast" +
  "?latitude=35.6762&longitude=139.6503" +           // ← 依城市替換
  "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode" +
  "&timezone=Asia%2FTokyo" +                         // ← 依時區替換（IANA 格式 URL encode）
  "&start_date=2026-04-14&end_date=2026-04-19";      // ← 依旅程日期替換

// 多城市行程範例（各城市不同日期範圍）：
// const WEATHER_URL_OSAKA = "...latitude=34.6937&longitude=135.5023...&start_date=...&end_date=...";
// const WEATHER_URL_KYOTO = "...latitude=35.0116&longitude=135.7681...&start_date=...&end_date=...";
```

### 2. WMO 代碼解析函式

```javascript
function wmoToEmoji(code) {
  if (code === 0)  return { icon: "☀️", zh: "晴天",    en: "Sunny" };
  if (code <= 3)   return { icon: "⛅", zh: "多雲",    en: "Cloudy" };
  if (code <= 49)  return { icon: "🌫️", zh: "霧/薄霧", en: "Foggy" };
  if (code <= 67)  return { icon: "🌧️", zh: "降雨",    en: "Rain" };
  if (code <= 77)  return { icon: "❄️", zh: "降雪",    en: "Snow" };
  if (code <= 82)  return { icon: "🌦️", zh: "陣雨",    en: "Showers" };
  if (code <= 99)  return { icon: "⛈️", zh: "雷陣雨",  en: "Thunderstorm" };
  return { icon: "🌡️", zh: "未知", en: "Unknown" };
}
```

### 3. 穿衣建議函式

```javascript
function getClothingTip(maxC, minC, precipMm, lang) {
  const zh = lang === "zh";
  let base = maxC >= 28 ? (zh ? "輕薄短袖"    : "Light T-shirt")
           : maxC >= 22 ? (zh ? "短袖 + 薄外套" : "T-shirt + light jacket")
           : maxC >= 16 ? (zh ? "長袖 + 薄外套" : "Long sleeve + jacket")
           : maxC >= 10 ? (zh ? "毛衣 + 厚外套" : "Sweater + coat")
           :              (zh ? "羽絨衣 + 圍巾" : "Down jacket + scarf");
  const tips = [base];
  if (maxC - minC >= 10) tips.push(zh ? "日夜溫差大，建議洋蔥穿搭" : "Big temp swing—layer up");
  if (precipMm >= 1)     tips.push(zh ? `預計降雨 ${precipMm.toFixed(1)}mm，帶摺疊傘` : `Rain ${precipMm.toFixed(1)}mm expected—bring umbrella`);
  return tips.join("，");
}
```

### 4. WeatherCard 元件

```jsx
function WeatherCard({ weather, lang }) {
  if (!weather) return (
    <div style={{ background:"#f8fafc", border:"1px dashed #cbd5e1", borderRadius:12,
                  padding:"12px 14px", marginBottom:12, fontSize:12, color:"#94a3b8", textAlign:"center" }}>
      {lang === "zh" ? "☁️ 天氣資料載入中..." : "☁️ Loading weather..."}
    </div>
  );
  const { icon, max, min, precip, wmoZh, wmoEn, clothingZh, clothingEn } = weather;
  return (
    <div style={{ background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"1.5px solid #bfdbfe",
                  borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
      <div style={{ fontWeight:700, fontSize:13, color:"#1d4ed8", marginBottom:8 }}>
        {icon} {lang === "zh" ? "今日天氣" : "Today's Weather"}
        <span style={{ fontSize:11, fontWeight:500, color:"#3b82f6", marginLeft:8 }}>
          {lang === "zh" ? wmoZh : wmoEn}
        </span>
      </div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:13, color:"#1e40af" }}>
        <span>🌡️ <b>{max}°C</b> / {min}°C</span>
        <span>🌂 {lang === "zh" ? `降雨 ${precip}mm` : `Rain ${precip}mm`}</span>
      </div>
      <div style={{ marginTop:8, fontSize:12, color:"#1e40af", fontWeight:500 }}>
        👕 {lang === "zh" ? `穿搭建議：${clothingZh}` : `Outfit: ${clothingEn}`}
      </div>
    </div>
  );
}
```

### 5. App 元件內 useEffect fetch

```jsx
const [weather, setWeather] = React.useState({});

React.useEffect(() => {
  async function fetchWeather() {
    try {
      const res = await fetch(WEATHER_URL);
      const d   = await res.json();
      const map = {};
      d.daily.time.forEach((date, i) => {
        const wmo   = wmoToEmoji(d.daily.weathercode[i]);
        const maxC  = Math.round(d.daily.temperature_2m_max[i]);
        const minC  = Math.round(d.daily.temperature_2m_min[i]);
        const precip = +(d.daily.precipitation_sum[i] || 0).toFixed(1);
        map[date] = {
          icon: wmo.icon, wmoZh: wmo.zh, wmoEn: wmo.en,
          max: maxC, min: minC, precip,
          clothingZh: getClothingTip(maxC, minC, precip, "zh"),
          clothingEn: getClothingTip(maxC, minC, precip, "en"),
        };
      });
      setWeather(map);
    } catch(e) { console.warn("Weather fetch failed", e); }
  }
  fetchWeather();
}, []);
```

### 6. DayPanel 傳入天氣資料

每個 Day 的資料物件需要有 `date` 欄位（格式 "YYYY-MM-DD"）：

```jsx
// 渲染時傳入對應日期天氣
<DayPanel data={day} lang={lang} weatherData={weather[day.date]} />

// DayPanel 函式簽名更新
function DayPanel({ data, lang, weatherData }) {
  // ... 在 Tips 卡片之前插入：
  <WeatherCard weather={weatherData} lang={lang} />
}
```

### 7. 常用城市經緯度 & 時區速查

| 城市 | 緯度 | 經度 | timezone |
|------|------|------|----------|
| 東京 | 35.6762 | 139.6503 | Asia/Tokyo |
| 大阪 | 34.6937 | 135.5023 | Asia/Tokyo |
| 京都 | 35.0116 | 135.7681 | Asia/Tokyo |
| 河口湖 | 35.5111 | 138.7728 | Asia/Tokyo |
| 首爾 | 37.5665 | 126.9780 | Asia/Seoul |
| 曼谷 | 13.7563 | 100.5018 | Asia/Bangkok |
| 巴黎 | 48.8566 | 2.3522 | Europe/Paris |
| 倫敦 | 51.5074 | -0.1278 | Europe/London |
| 紐約 | 40.7128 | -74.0060 | America/New_York |
| 台北 | 25.0330 | 121.5654 | Asia/Taipei |

---

## 注意事項

1. **所有資料都放在 `<script type="text/babel">` 區塊內**，不要分離 JS 檔案
2. **Google Maps Transit URL 格式**：`https://www.google.com/maps/dir/?api=1&origin=起點+城市&destination=終點+城市&travelmode=transit`
3. **城市名稱**：設定 `const CITY = "城市名"` 供 URL 生成使用（日本用日文，韓國用韓文）
4. **行動裝置優先**：maxWidth 480px，字體最小 11px
5. **Tab 超出時**：自動橫向滾動（`overflowX: auto`）
6. **天氣 API**：Open-Meteo 免費版最多 16 天預報，超出範圍顯示「歷史氣候均值，僅供參考」備注
7. **天氣 fetch 失敗時**：WeatherCard 顯示 loading 狀態即可，不影響其他功能
