import { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ── Data derived from customers.csv + orders.csv + products.csv ───────────────

import monthlyData from "./data/monthlyData.json";
import categoryData from "./data/categoryData.json";
import subcatData from "./data/subcatData.json";
import paymentData from "./data/paymentData.json";
import stateData from "./data/stateData.json";

// ── Palette ───────────────────────────────────────────────────────────────────
const CAT_COLORS = ["#3B82F6", "#10B981", "#F59E0B"];
const PAY_COLORS = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#F43F5E"];
const BLUE  = "#3B82F6";
const GREEN = "#10B981";
const RED   = "#F43F5E";

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000)     return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${abs}`;
};
const fmtFull = (n) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
};

// ── Animated counter ──────────────────────────────────────────────────────────
function useCountUp(target, duration = 950) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const abs = Math.abs(target);
    const sign = target < 0 ? -1 : 1;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(sign * Math.round(abs * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

// ── Mini sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  const w = 72, h = 28;
  const vals = data.map(d => d.revenue);
  const min = Math.min(...vals), range = Math.max(...vals) - min || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const last = pts.split(" ").at(-1).split(",");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={color}/>
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, rawValue, sub, color, icon, showSpark, dark, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const animated = useCountUp(visible ? rawValue : 0);
  const display =
  label === "Orders" || label === "Units Sold"
    ? animated.toLocaleString()
    : fmt(animated);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: dark ? "#1e293b" : "#fff",
        border: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)",
        borderRadius: 16, padding: "20px 22px",
        cursor: "default", position: "relative", overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: hovered ? "translateY(-4px) scale(1.015)" : visible ? "translateY(0)" : "translateY(10px)",
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease, box-shadow 0.3s ease",
        boxShadow: hovered ? `0 14px 36px ${color}28` : dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: color,
        transform: hovered ? "scaleX(1)" : "scaleX(0)",
        transformOrigin: "left",
        transition: "transform 0.35s ease",
        borderRadius: "16px 16px 0 0",
      }}/>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: dark ? "#64748b" : "#94a3b8", margin: "0 0 10px" }}>{label}</p>
          <p style={{ fontSize: 27, fontWeight: 700, color, margin: "0 0 5px", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{display}</p>
          {sub && <p style={{ fontSize: 12, color: dark ? "#94a3b8" : "#64748b", margin: 0 }}>{sub}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{icon}</div>
          {showSpark && <Sparkline data={monthlyData} color={color}/>}
        </div>
      </div>
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null;
  // For pie charts, `label` is empty but payload[0].name is the slice name
  const title = label || payload[0]?.name || "";
  return (
    <div style={{ background: dark ? "#1e293b" : "#fff", border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)" }}>
      {title && <p style={{ fontWeight: 600, margin: "0 0 6px", color: dark ? "#f1f5f9" : "#0f172a" }}>{title}</p>}
      {payload.map((p, i) => {
        const entryColor = p.color ?? p.fill ?? p.stroke ?? "#888";
        const entryName  = label ? p.name : "Revenue"; // pie has no label, just show "Revenue"
        return (
          <p key={i} style={{ margin: "3px 0", color: entryColor }}>
            {entryName}: {typeof p.value === "number" ? fmtFull(p.value) : p.value}
          </p>
        );
      })}
    </div>
  );
}

// ── Chart card ────────────────────────────────────────────────────────────────
function Card({ title, sub, children, dark, span = 1 }) {
  return (
    <div style={{ background: dark ? "#1e293b" : "#fff", border: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: "20px 22px", gridColumn: `span ${span}`, boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "background 0.35s ease" }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: dark ? "#f1f5f9" : "#0f172a", margin: "0 0 2px" }}>{title}</p>
      {sub && <p style={{ fontSize: 11, color: dark ? "#64748b" : "#94a3b8", margin: "0 0 14px" }}>{sub}</p>}
      {!sub && <div style={{ marginBottom: 14 }}/>}
      {children}
    </div>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────────
function Pill({ label, active, onClick, dark, activeColor }) {
  return (
    <button onClick={onClick} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", background: active ? (activeColor || BLUE) : (dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"), color: active ? "#fff" : (dark ? "#94a3b8" : "#475569"), transition: "all 0.2s ease" }}>
      {label}
    </button>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [dark, setDark]           = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeCat, setActiveCat] = useState("All");
  const [metric, setMetric]       = useState("revenue");

  const tabs = ["overview", "products", "geography", "payments"];
  const cats = ["All", "Electronics", "Clothing", "Furniture"];

  const totalRevenue = categoryData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit  = categoryData.reduce((s, d) => s + d.profit, 0);
  const totalQty     = categoryData.reduce((s, d) => s + d.qty, 0);
  const totalOrders  = 500;
  const margin       = ((totalProfit / totalRevenue) * 100).toFixed(1);
  const avgOrder     = Math.round(totalRevenue / totalOrders);

  const filteredSubcat = useMemo(() => {
    const d = activeCat === "All" ? subcatData : subcatData.filter(x => x.cat === activeCat);
    return [...d].sort((a, b) => b[metric] - a[metric]);
  }, [activeCat, metric]);

  const lossItems = subcatData.filter(d => d.profit < 0).sort((a, b) => a.profit - b.profit);

  const bg      = dark ? "#0f172a" : "#f1f5f9";
  const hdr     = dark ? "#1e293b" : "#fff";
  const txtPrim = dark ? "#f1f5f9" : "#0f172a";
  const txtMut  = dark ? "#64748b" : "#94a3b8";
  const gridCol = dark ? "#1e2a3a" : "#f1f5f9";
  const tickCol = dark ? "#475569" : "#94a3b8";
  const tip     = (props) => <ChartTooltip {...props} dark={dark}/>;

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "system-ui, sans-serif", transition: "background 0.35s ease" }}>

      {/* Header */}
      <div style={{ background: hdr, borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", padding: "16px 28px", display: "flex", flexDirection: "column", gap: 12, transition: "background 0.35s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <p style={{ fontSize: 21, fontWeight: 700, color: txtPrim, margin: 0 }}>E-Commerce Analytics</p>
            <p style={{ fontSize: 12, color: txtMut, margin: "3px 0 0" }}>FY 2025 · 500+ Orders · BI Dashboard</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: txtMut }}>{dark ? "Dark" : "Light"}</span>
            <button onClick={() => setDark(d => !d)} style={{ width: 52, height: 28, borderRadius: 14, background: dark ? BLUE : "#cbd5e1", border: "none", cursor: "pointer", position: "relative", transition: "background 0.3s ease" }}>
              <div style={{ position: "absolute", top: 3, left: dark ? 26 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                {dark ? "🌙" : "☀️"}
              </div>
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {tabs.map(t => <Pill key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={activeTab === t} onClick={() => setActiveTab(t)} dark={dark} activeColor={BLUE}/>)}
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))", gap: 14, marginBottom: 20 }}>
          <KPICard label="Total Revenue"   rawValue={totalRevenue} sub="Jan–Jun 2025"            color={BLUE}    icon="💰" showSpark dark={dark} delay={0}/>
          <KPICard label="Total Profit"    rawValue={totalProfit}  sub={`${margin}% net margin`} color={totalProfit < 0 ? RED : GREEN} icon="📊" dark={dark} delay={70}/>
          <KPICard label="Orders"    rawValue={totalOrders}  sub="Unique Orders"     color="#F59E0B" icon="🛒" dark={dark} delay={140}/>
          <KPICard label="Units Sold"      rawValue={totalQty}     sub="Across all categories"   color="#8B5CF6" icon="📦" dark={dark} delay={210}/>
          <KPICard label="Avg Order Value" rawValue={avgOrder}     sub="Revenue per order"       color="#F43F5E" icon="🎯" dark={dark} delay={280}/>
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Monthly Revenue" sub="Jan–Jun 2025 · area trend" dark={dark} span={2}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={BLUE} stopOpacity={0.25}/>
                      <stop offset="100%" stopColor={BLUE} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridCol} vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickCol }} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: tickCol }} axisLine={false} tickLine={false} width={58}/>
                  <Tooltip content={tip}/>
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={BLUE} strokeWidth={3} fill="url(#areaGrad)"
                    dot={{ r: 4, fill: BLUE, strokeWidth: 2, stroke: dark ? "#0f172a" : "#fff" }}
                    activeDot={{ r: 7, fill: BLUE }}/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Revenue & Profit by Category" dark={dark}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridCol} vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickCol }} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: tickCol }} axisLine={false} tickLine={false} width={58}/>
                  <Tooltip content={tip} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", radius: 6 }}/>
                  <Legend wrapperStyle={{ fontSize: 11, color: tickCol }}/>
                  <Bar dataKey="revenue" name="Revenue" fill={BLUE}  radius={[6,6,0,0]} maxBarSize={34}/>
                  <Bar dataKey="profit"  name="Profit"  radius={[6,6,0,0]} maxBarSize={34}>
                    {categoryData.map((d, i) => <Cell key={i} fill={d.profit < 0 ? RED : GREEN}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Revenue by Payment Mode" dark={dark}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <ResponsiveContainer width={150} height={180}>
                  <PieChart>
                    <Pie data={paymentData} cx={68} cy={88} innerRadius={46} outerRadius={68} dataKey="value" paddingAngle={3} startAngle={90} endAngle={450}>
                      {paymentData.map((_, i) => <Cell key={i} fill={PAY_COLORS[i]} stroke="transparent"/>)}
                    </Pie>
                    <Tooltip content={tip}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {paymentData.map((d, i) => {
                    const pct = ((d.value / totalRevenue) * 100).toFixed(0);
                    return (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: PAY_COLORS[i], flexShrink: 0 }}/>
                            <span style={{ fontSize: 12, color: dark ? "#cbd5e1" : "#475569" }}>{d.name}</span>
                          </div>
                          <span style={{ fontSize: 11, color: txtMut }}>{pct}%</span>
                        </div>
                        <div style={{ height: 3, background: dark ? "#334155" : "#e2e8f0", borderRadius: 2 }}>
                          <div style={{ height: 3, background: PAY_COLORS[i], borderRadius: 2, width: `${pct}%`, transition: "width 0.9s ease" }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* PRODUCTS */}
        {activeTab === "products" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: txtMut }}>Category:</span>
              {cats.map(c => <Pill key={c} label={c} active={activeCat === c} onClick={() => setActiveCat(c)} dark={dark} activeColor={BLUE}/>)}
              <span style={{ fontSize: 12, color: txtMut, marginLeft: 8 }}>Metric:</span>
              {["revenue","profit","qty"].map(m => (
                <Pill key={m} label={m === "qty" ? "Quantity" : m.charAt(0).toUpperCase() + m.slice(1)} active={metric === m} onClick={() => setMetric(m)} dark={dark} activeColor={GREEN}/>
              ))}
            </div>

            <Card title={`Sub-Category · ${metric === "qty" ? "Quantity" : metric.charAt(0).toUpperCase() + metric.slice(1)}`} sub="Sorted highest to lowest" dark={dark} span={2}>
              <ResponsiveContainer width="100%" height={Math.max(260, filteredSubcat.length * 34 + 50)}>
                <BarChart data={filteredSubcat} layout="vertical" margin={{ top: 0, right: 64, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridCol} horizontal={false}/>
                  <XAxis type="number" tickFormatter={metric === "qty" ? v => v : fmt} tick={{ fontSize: 10, fill: tickCol }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: dark ? "#cbd5e1" : "#475569" }} axisLine={false} tickLine={false} width={100}/>
                  <Tooltip content={tip} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", radius: 4 }}/>
                  <Bar dataKey={metric} radius={[0,6,6,0]} maxBarSize={20} name={metric === "qty" ? "Units" : metric.charAt(0).toUpperCase() + metric.slice(1)}>
                    {filteredSubcat.map((d, i) => (
                      <Cell key={i} fill={
                        metric === "profit" && d.profit < 0 ? RED :
                        d.cat === "Electronics" ? CAT_COLORS[0] :
                        d.cat === "Clothing"    ? CAT_COLORS[1] : CAT_COLORS[2]
                      }/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Loss-Making Sub-Categories" sub={`${lossItems.length} items with negative profit`} dark={dark}>
              <div style={{ maxHeight: 340, overflowY: "auto" }}>
                {lossItems.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < lossItems.length - 1 ? `0.5px solid ${dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}` : "none" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: dark ? "#e2e8f0" : "#1e293b", margin: 0 }}>{d.name}</p>
                      <p style={{ fontSize: 11, color: txtMut, margin: "2px 0 0" }}>{d.cat} · {d.qty} units</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: RED, margin: 0 }}>{fmtFull(d.profit)}</p>
                      <p style={{ fontSize: 10, color: txtMut, margin: "2px 0 0" }}>Rev: {fmt(d.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Revenue Share by Category" dark={dark}>
              {categoryData.map((d, i) => {
                const pct = Math.round((d.revenue / totalRevenue) * 100);
                return (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: CAT_COLORS[i] }}/>
                        <span style={{ fontSize: 13, fontWeight: 500, color: dark ? "#cbd5e1" : "#475569" }}>{d.name}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: dark ? "#f1f5f9" : "#0f172a" }}>{fmt(d.revenue)}</span>
                        <span style={{ fontSize: 11, color: txtMut, marginLeft: 6 }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: dark ? "#334155" : "#e2e8f0", borderRadius: 3 }}>
                      <div style={{ height: 6, background: CAT_COLORS[i], borderRadius: 3, width: `${pct}%`, transition: "width 1s ease" }}/>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* GEOGRAPHY */}
        {activeTab === "geography" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Revenue & Profit · Top 10 States" sub="All states are loss-making — cost exceeds price × quantity in source data" dark={dark} span={2}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stateData.slice(0, 10)} margin={{ top: 0, right: 10, left: 0, bottom: 0 }} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridCol} vertical={false}/>
                  <XAxis dataKey="state" tick={{ fontSize: 10, fill: tickCol }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50}/>
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: tickCol }} axisLine={false} tickLine={false} width={58}/>
                  <Tooltip content={tip} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", radius: 6 }}/>
                  <Legend wrapperStyle={{ fontSize: 11, color: tickCol }}/>
                  <Bar dataKey="revenue" name="Revenue" fill={BLUE} radius={[6,6,0,0]} maxBarSize={26}/>
                  <Bar dataKey="profit"  name="Profit"  radius={[6,6,0,0]} maxBarSize={26}>
                    {stateData.slice(0,10).map((d, i) => <Cell key={i} fill={d.profit < 0 ? RED : GREEN}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="All States — Full Breakdown" dark={dark} span={2}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>{["#","State","Revenue","Profit","Margin","Status"].map(h => (
                      <th key={h} style={{ padding: "6px 12px", textAlign: "left", color: txtMut, fontWeight: 500, fontSize: 11, borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {stateData.map((d, i) => {
                      const m = ((d.profit / d.revenue) * 100).toFixed(1);
                      const isLoss = d.profit < 0;
                      return (
                        <tr key={i} style={{ background: i % 2 === 1 ? (dark ? "rgba(255,255,255,0.02)" : "#f8fafc") : "transparent" }}>
                          <td style={{ padding: "9px 12px", color: txtMut }}>{i+1}</td>
                          <td style={{ padding: "9px 12px", fontWeight: 500, color: dark ? "#e2e8f0" : "#1e293b" }}>{d.state}</td>
                          <td style={{ padding: "9px 12px", color: BLUE, fontWeight: 600 }}>{fmtFull(d.revenue)}</td>
                          <td style={{ padding: "9px 12px", color: isLoss ? RED : GREEN, fontWeight: 600 }}>{fmtFull(d.profit)}</td>
                          <td style={{ padding: "9px 12px", color: isLoss ? RED : txtMut }}>{m}%</td>
                          <td style={{ padding: "9px 12px" }}>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: isLoss ? "#F43F5E18" : "#10B98118", color: isLoss ? RED : GREEN }}>
                              {isLoss ? "Loss" : "Profit"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* PAYMENTS */}
        {activeTab === "payments" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Revenue by Payment Mode" dark={dark} span={2}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={paymentData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridCol} vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickCol }} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: tickCol }} axisLine={false} tickLine={false} width={58}/>
                  <Tooltip content={tip} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", radius: 6 }}/>
                  <Bar dataKey="value" name="Revenue" radius={[8,8,0,0]} maxBarSize={60}>
                    {paymentData.map((_, i) => <Cell key={i} fill={PAY_COLORS[i]} stroke="transparent"/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {paymentData.map((d, i) => {
              const pct = ((d.value / totalRevenue) * 100).toFixed(1);
              return (
                <div key={i} style={{ background: dark ? "#1e293b" : "#fff", border: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: "18px 22px", transition: "background 0.35s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 12, color: txtMut, margin: "0 0 4px", fontWeight: 500 }}>{d.name}</p>
                      <p style={{ fontSize: 26, fontWeight: 700, color: PAY_COLORS[i], margin: "0 0 4px" }}>{fmt(d.value)}</p>
                      <p style={{ fontSize: 11, color: txtMut, margin: 0 }}>{pct}% of total revenue</p>
                    </div>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: PAY_COLORS[i] + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 14, height: 14, borderRadius: 4, background: PAY_COLORS[i] }}/>
                    </div>
                  </div>
                  <div style={{ height: 5, background: dark ? "#334155" : "#e2e8f0", borderRadius: 3 }}>
                    <div style={{ height: 5, background: PAY_COLORS[i], borderRadius: 3, width: `${pct}%`, transition: "width 1s ease" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
