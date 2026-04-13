import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { useMemo, useState, useEffect } from "react";

export default function DistributionChart({ result }) {
  if (!result) return null;

  const { distribution_bins, current_price, final_prices } = result;
  const isINR = result.ticker.endsWith(".NS") || result.ticker.endsWith(".BO");
  const cur = isINR ? "\u20B9" : "$";
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const chartHeight = isMobile ? 220 : 320;
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const chartData = useMemo(() => {
    return distribution_bins.counts.map((count, i) => {
      const midPrice = (distribution_bins.edges[i] + distribution_bins.edges[i + 1]) / 2;
      return {
        price: Math.round(midPrice),
        count,
        isAboveCurrent: midPrice >= current_price,
      };
    });
  }, [distribution_bins, current_price]);

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
      <div className="flex items-start justify-between mb-4 sm:mb-5">
        <div>
          <h3 className="text-sm sm:text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Price Distribution
          </h3>
          <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Final price frequency after {result.simulation_params.prediction_days} trading days
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "var(--danger)", opacity: 0.75 }} />
            <span className="text-[10px] sm:text-[11px]" style={{ color: "var(--text-muted)" }}>Loss</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "var(--success)", opacity: 0.75 }} />
            <span className="text-[10px] sm:text-[11px]" style={{ color: "var(--text-muted)" }}>Profit</span>
          </div>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} barCategoryGap="1%" margin={{ left: isMobile ? 0 : 5, right: isMobile ? 5 : 10, top: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} vertical={false} />
            <XAxis
              dataKey="price"
              stroke="var(--text-muted)"
              tick={{ fontSize: isMobile ? 8 : 10, fill: "var(--text-muted)" }}
              axisLine={{ stroke: "var(--border-primary)" }}
              tickLine={{ stroke: "var(--border-primary)" }}
              tickFormatter={(v) => isMobile ? `${v}` : `${cur}${v}`}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fontSize: isMobile ? 9 : 11, fill: "var(--text-muted)" }}
              axisLine={{ stroke: "var(--border-primary)" }}
              tickLine={{ stroke: "var(--border-primary)" }}
              width={isMobile ? 30 : 50}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [value, "Simulations"]}
              labelFormatter={(label) => `Price: ${cur}${label}`}
              cursor={false}
            />
            <ReferenceLine
              x={Math.round(current_price)}
              stroke="var(--warning)"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={isMobile ? undefined : {
                value: `Current: ${cur}${current_price.toFixed(0)}`,
                fill: "var(--warning)",
                fontSize: 11,
                fontWeight: 600,
                position: "top",
              }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.isAboveCurrent ? "var(--success)" : "var(--danger)"}
                  opacity={0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Probability of Loss vs Gain bar */}
      {result.investment_analysis && (() => {
        const profitPct = (result.investment_analysis.probability_of_profit * 100);
        const lossPct = 100 - profitPct;
        return (
          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4" style={{ borderTop: "1px solid var(--border-primary)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] sm:text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                Outcome Probability
              </p>
              <p className="text-[10px] sm:text-[11px]" style={{ color: "var(--text-muted)" }}>
                based on {result.simulation_params.num_simulations.toLocaleString()} simulations
              </p>
            </div>
            {/* Bar */}
            <div className="flex rounded-lg overflow-hidden h-8 sm:h-9">
              <div
                className="flex items-center justify-center transition-all duration-700"
                style={{
                  width: `${Math.max(lossPct, 2)}%`,
                  background: "var(--danger)",
                  opacity: 0.85,
                }}
              >
                {lossPct >= 10 && (
                  <span className="text-[10px] sm:text-[11px] font-bold text-white">
                    {lossPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <div
                className="flex items-center justify-center transition-all duration-700"
                style={{
                  width: `${Math.max(profitPct, 2)}%`,
                  background: "var(--success)",
                  opacity: 0.85,
                }}
              >
                {profitPct >= 10 && (
                  <span className="text-[10px] sm:text-[11px] font-bold text-white">
                    {profitPct.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            {/* Labels below bar */}
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--danger)" }} />
                <span className="text-[10px] sm:text-[11px] font-medium" style={{ color: "var(--danger)" }}>
                  Loss {lossPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-medium" style={{ color: "var(--success)" }}>
                  Profit {profitPct.toFixed(1)}%
                </span>
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--success)" }} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Distribution stats footer */}
      <div
        className="grid grid-cols-5 gap-1 sm:gap-2 mt-3 sm:mt-4 pt-3 text-center"
        style={{ borderTop: "1px solid var(--border-primary)" }}
      >
        {[
          { label: "5th", value: final_prices.percentiles.p5 },
          { label: "25th", value: final_prices.percentiles.p25 },
          { label: "Median", value: final_prices.percentiles.p50 },
          { label: "75th", value: final_prices.percentiles.p75 },
          { label: "95th", value: final_prices.percentiles.p95 },
        ].map((p) => (
          <div key={p.label}>
            <p className="text-[10px] sm:text-[11px]" style={{ color: "var(--text-muted)" }}>{p.label}</p>
            <p className="text-[11px] sm:text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              {cur}{p.value.toFixed(0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
