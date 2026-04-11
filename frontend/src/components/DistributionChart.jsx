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
import { useMemo } from "react";

export default function DistributionChart({ result }) {
  if (!result) return null;

  const { distribution_bins, current_price, final_prices } = result;
  const isINR = result.ticker.endsWith(".NS") || result.ticker.endsWith(".BO");
  const cur = isINR ? "\u20B9" : "$";

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
    <div className="card p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Price Distribution
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Final price frequency after {result.simulation_params.prediction_days} trading days
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "var(--danger)", opacity: 0.75 }} />
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Loss</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "var(--success)", opacity: 0.75 }} />
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Profit</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} barCategoryGap="1%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} vertical={false} />
          <XAxis
            dataKey="price"
            stroke="var(--text-muted)"
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--border-primary)" }}
            tickLine={{ stroke: "var(--border-primary)" }}
            tickFormatter={(v) => `${cur}${v}`}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--border-primary)" }}
            tickLine={{ stroke: "var(--border-primary)" }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [value, "Simulations"]}
            labelFormatter={(label) => `Price: ${cur}${label}`}
            cursor={{ fill: "var(--bg-hover)", opacity: 0.3 }}
          />
          <ReferenceLine
            x={Math.round(current_price)}
            stroke="var(--warning)"
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
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

      {/* Distribution stats footer */}
      <div
        className="grid grid-cols-5 gap-2 mt-4 pt-3 text-center"
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
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{p.label}</p>
            <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              {cur}{p.value.toFixed(0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
