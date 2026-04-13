import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { useMemo, useState, useEffect } from "react";

export default function SimulationChart({ result }) {
  if (!result) return null;

  const [view, setView] = useState("paths"); // "paths" or "bands"
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const chartHeight = isMobile ? 260 : 420;
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const { sample_paths, time_axis, current_price, confidence_bands } = result;
  const isINR = result.ticker.endsWith(".NS") || result.ticker.endsWith(".BO");
  const cur = isINR ? "\u20B9" : "$";

  // Transform data for paths view
  const pathData = useMemo(() => {
    return time_axis.map((day, i) => {
      const point = { day };
      sample_paths.forEach((path, pathIdx) => {
        point[`p${pathIdx}`] = path[i];
      });
      return point;
    });
  }, [time_axis, sample_paths]);

  // Transform data for confidence bands view
  const bandData = useMemo(() => {
    return time_axis.map((day, i) => ({
      day,
      p5: confidence_bands.p5[i],
      p25: confidence_bands.p25[i],
      p50: confidence_bands.p50[i],
      p75: confidence_bands.p75[i],
      p95: confidence_bands.p95[i],
    }));
  }, [time_axis, confidence_bands]);

  const getPathColor = (idx, total) => {
    const ratio = idx / (total - 1);
    if (ratio < 0.15) return "var(--danger)";
    if (ratio < 0.35) return "var(--warning)";
    if (ratio < 0.65) return "var(--accent)";
    if (ratio < 0.85) return "#22d3ee";
    return "var(--success)";
  };

  const tooltipStyle = {
    backgroundColor: "var(--chart-tooltip-bg)",
    border: "1px solid var(--chart-tooltip-border)",
    borderRadius: "12px",
    fontSize: 12,
    padding: "8px 12px",
    boxShadow: "var(--shadow-lg)",
    color: "var(--text-primary)",
  };

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h3 className="text-sm sm:text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Price Simulation
          </h3>
          <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {view === "paths"
              ? `${sample_paths.length} representative paths`
              : "Confidence bands (5th-95th percentile)"}
          </p>
        </div>
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border-primary)" }}
        >
          {["paths", "bands"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: view === v ? "var(--accent)" : "transparent",
                color: view === v ? "#fff" : "var(--text-secondary)",
              }}
            >
              {v === "paths" ? "Paths" : "Bands"}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={chartHeight}>
          {view === "paths" ? (
            <LineChart data={pathData} margin={{ left: isMobile ? 0 : 5, right: isMobile ? 5 : 10, top: 5, bottom: isMobile ? 0 : 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
              <XAxis
                dataKey="day"
                stroke="var(--text-muted)"
                tick={{ fontSize: isMobile ? 9 : 11, fill: "var(--text-muted)" }}
                axisLine={{ stroke: "var(--border-primary)" }}
                tickLine={{ stroke: "var(--border-primary)" }}
                label={isMobile ? undefined : { value: "Trading Days", position: "insideBottom", offset: -5, fill: "var(--text-muted)", fontSize: 11 }}
              />
              <YAxis
                stroke="var(--text-muted)"
                tick={{ fontSize: isMobile ? 9 : 11, fill: "var(--text-muted)" }}
                axisLine={{ stroke: "var(--border-primary)" }}
                tickLine={{ stroke: "var(--border-primary)" }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => isMobile ? `${v.toFixed(0)}` : `${cur}${v.toFixed(0)}`}
                width={isMobile ? 40 : 65}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${cur}${value.toFixed(2)}`, ""]}
                labelFormatter={(label) => `Day ${label}`}
                cursor={false}
              />
              <ReferenceLine
                y={current_price}
                stroke="var(--text-muted)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
              />
              {sample_paths.map((_, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={`p${idx}`}
                  stroke={getPathColor(idx, sample_paths.length)}
                  dot={false}
                  activeDot={false}
                  strokeWidth={1.2}
                  opacity={0.35}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          ) : (
            <ComposedChart data={bandData} margin={{ left: isMobile ? 0 : 5, right: isMobile ? 5 : 10, top: 5, bottom: isMobile ? 0 : 5 }}>
              <defs>
                <linearGradient id="band95" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="band75" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
              <XAxis
                dataKey="day"
                stroke="var(--text-muted)"
                tick={{ fontSize: isMobile ? 9 : 11, fill: "var(--text-muted)" }}
                axisLine={{ stroke: "var(--border-primary)" }}
                label={isMobile ? undefined : { value: "Trading Days", position: "insideBottom", offset: -5, fill: "var(--text-muted)", fontSize: 11 }}
              />
              <YAxis
                stroke="var(--text-muted)"
                tick={{ fontSize: isMobile ? 9 : 11, fill: "var(--text-muted)" }}
                axisLine={{ stroke: "var(--border-primary)" }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => isMobile ? `${v.toFixed(0)}` : `${cur}${v.toFixed(0)}`}
                width={isMobile ? 40 : 65}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => {
                  const labels = { p5: "5th %ile", p25: "25th %ile", p50: "Median", p75: "75th %ile", p95: "95th %ile" };
                  return [`${cur}${value.toFixed(2)}`, labels[name] || name];
                }}
                labelFormatter={(label) => `Day ${label}`}
                cursor={false}
              />
              <ReferenceLine y={current_price} stroke="var(--text-muted)" strokeDasharray="6 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="p95" stroke="none" fill="url(#band95)" activeDot={false} />
              <Area type="monotone" dataKey="p5" stroke="none" fill="var(--bg-card)" activeDot={false} />
              <Area type="monotone" dataKey="p75" stroke="none" fill="url(#band75)" activeDot={false} />
              <Area type="monotone" dataKey="p25" stroke="none" fill="var(--bg-card)" activeDot={false} />
              <Line type="monotone" dataKey="p95" stroke="var(--accent)" strokeWidth={1} strokeDasharray="4 2" dot={false} activeDot={false} opacity={0.6} />
              <Line type="monotone" dataKey="p75" stroke="var(--accent)" strokeWidth={1} strokeDasharray="4 2" dot={false} activeDot={false} opacity={0.4} />
              <Line type="monotone" dataKey="p50" stroke="var(--accent)" strokeWidth={2.5} dot={false} activeDot={false} />
              <Line type="monotone" dataKey="p25" stroke="var(--accent)" strokeWidth={1} strokeDasharray="4 2" dot={false} activeDot={false} opacity={0.4} />
              <Line type="monotone" dataKey="p5" stroke="var(--accent)" strokeWidth={1} strokeDasharray="4 2" dot={false} activeDot={false} opacity={0.6} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {view === "paths" && (
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
          {[
            { color: "var(--danger)", label: "Worst" },
            { color: "var(--warning)", label: "Below Avg" },
            { color: "var(--accent)", label: "Average" },
            { color: "#22d3ee", label: "Above Avg" },
            { color: "var(--success)", label: "Best" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ background: l.color }} />
              <span className="text-[10px] sm:text-[11px]" style={{ color: "var(--text-muted)" }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
