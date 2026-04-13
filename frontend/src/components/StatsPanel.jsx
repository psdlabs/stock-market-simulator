import { useMemo } from "react";

export default function StatsPanel({ result }) {
  if (!result) return null;

  const { current_price, final_prices, investment_analysis, simulation_params } = result;
  const pctChange = ((final_prices.mean - current_price) / current_price) * 100;
  const isINR = result.ticker.endsWith(".NS") || result.ticker.endsWith(".BO");
  const cur = isINR ? "\u20B9" : "$";
  const days = simulation_params.prediction_days;
  const months = Math.round(days / 21);

  const fmt = (v) => {
    if (Math.abs(v) >= 1e6) return `${cur}${(v / 1e6).toFixed(2)}M`;
    return `${cur}${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const profitPct = (investment_analysis.probability_of_profit * 100).toFixed(1);
  const gainPct = (investment_analysis.probability_of_10pct_gain * 100).toFixed(1);
  const lossPct = (investment_analysis.probability_of_20pct_loss * 100).toFixed(1);
  const sharpe = investment_analysis.sharpe_ratio;
  const sharpeLabel = sharpe >= 1.5 ? "Excellent" : sharpe >= 1 ? "Good" : sharpe >= 0.5 ? "Average" : sharpe >= 0 ? "Below Avg" : "Poor";

  const sections = [
    {
      title: "Price Forecast",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      subtitle: `Where the price could land in ~${months}mo`,
      rows: [
        {
          label: "Expected Price",
          caption: "Average predicted price across all simulations",
          value: `${cur}${final_prices.mean.toFixed(2)}`,
          badge: `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(1)}%`,
          badgeColor: pctChange >= 0 ? "var(--success)" : "var(--danger)",
          badgeBg: pctChange >= 0 ? "var(--success-subtle)" : "var(--danger-subtle)",
        },
        {
          label: "Median Price",
          caption: "Half ended above, half below this",
          value: `${cur}${final_prices.median.toFixed(2)}`,
        },
        {
          label: "Std Deviation",
          caption: "How spread out the predicted prices are",
          value: `${cur}${final_prices.std.toFixed(2)}`,
        },
        {
          label: "95% Range",
          caption: "19 out of 20 scenarios land here",
          value: `${cur}${final_prices.percentiles.p5.toFixed(0)} — ${cur}${final_prices.percentiles.p95.toFixed(0)}`,
        },
        {
          label: "90% Range",
          caption: "Tighter confidence interval",
          value: `${cur}${final_prices.percentiles.p10.toFixed(0)} — ${cur}${final_prices.percentiles.p90.toFixed(0)}`,
        },
      ],
    },
    {
      title: "Probabilities",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      subtitle: "Chances of different outcomes",
      rows: [
        {
          label: "Making Money",
          caption: "Chance of selling higher than today",
          value: `${profitPct}%`,
          color: investment_analysis.probability_of_profit >= 0.5 ? "var(--success)" : "var(--danger)",
          bar: investment_analysis.probability_of_profit,
        },
        {
          label: "10%+ Gain",
          caption: "Stock grows more than 10%",
          value: `${gainPct}%`,
          color: "var(--accent)",
          bar: investment_analysis.probability_of_10pct_gain,
        },
        {
          label: "20%+ Drop",
          caption: "Lose more than 20% of investment",
          value: `${lossPct}%`,
          color: "var(--danger)",
          bar: investment_analysis.probability_of_20pct_loss,
        },
      ],
    },
    {
      title: "Risk Metrics",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      subtitle: "Lower risk = safer investment",
      rows: [
        {
          label: `VaR (${(simulation_params.confidence_level * 100).toFixed(0)}%)`,
          caption: `Worst ${((1 - simulation_params.confidence_level) * 100).toFixed(0)}% scenario portfolio value`,
          value: fmt(investment_analysis.value_at_risk),
          color: "var(--warning)",
        },
        {
          label: "Worst-Case Avg",
          caption: "Average of the worst outcomes",
          value: fmt(investment_analysis.conditional_var),
          color: "var(--danger)",
        },
        {
          label: "Sharpe Ratio",
          caption: "Reward per unit of risk",
          value: sharpe.toFixed(3),
          badge: sharpeLabel,
          badgeColor: sharpe >= 0.5 ? "var(--success)" : "var(--danger)",
          badgeBg: sharpe >= 0.5 ? "var(--success-subtle)" : "var(--danger-subtle)",
          color: sharpe > 0 ? "var(--success)" : "var(--danger)",
        },
        {
          label: "Avg Max Dip",
          caption: "Biggest drop from peak before recovery",
          value: `${(investment_analysis.max_drawdown_mean * 100).toFixed(1)}%`,
          color: "var(--danger)",
        },
      ],
    },
    {
      title: "Your Investment",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
      subtitle: `Your ${fmt(investment_analysis.initial_investment)} after ~${months}mo`,
      rows: [
        {
          label: "Expected Value",
          caption: "Most likely portfolio value",
          value: fmt(investment_analysis.expected_value),
          color: "var(--accent)",
          highlight: true,
        },
        {
          label: "Best Case (95th)",
          caption: "If things go really well",
          value: fmt(investment_analysis.best_case),
          color: "var(--success)",
        },
        {
          label: "Annualized Return",
          caption: "Yearly return if trend continues",
          value: `${(investment_analysis.annualized_return * 100).toFixed(1)}%`,
          color: investment_analysis.annualized_return >= 0 ? "var(--success)" : "var(--danger)",
        },
      ],
      hasDistribution: true,
    },
  ];

  // Mini distribution chart data — portfolio values
  const distData = useMemo(() => {
    if (!result.distribution_bins) return null;
    const { counts, edges } = result.distribution_bins;
    const scale = investment_analysis.initial_investment / current_price;
    const maxCount = Math.max(...counts);
    const svgW = 300;
    const svgH = 64;
    const barCount = counts.length;
    const barW = svgW / barCount;
    const initialInv = investment_analysis.initial_investment;

    // Build bar data
    const bars = counts.map((count, i) => {
      const midPrice = (edges[i] + edges[i + 1]) / 2;
      const portfolioVal = midPrice * scale;
      const h = maxCount > 0 ? (count / maxCount) * svgH : 0;
      return {
        x: i * barW,
        w: barW,
        h,
        y: svgH - h,
        isProfit: portfolioVal >= initialInv,
        portfolioVal,
      };
    });

    // Find the x position where initial investment line falls
    const initialX = bars.find((b) => b.portfolioVal >= initialInv)?.x ?? svgW / 2;

    return { bars, svgW, svgH, initialX, barW };
  }, [result.distribution_bins, investment_analysis, current_price]);

  return (
    <div className="card p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Simulation Results
          </h3>
          <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {simulation_params.num_simulations.toLocaleString()} scenarios &middot; {days} trading days
          </p>
        </div>
        <div
          className="text-[10px] sm:text-[11px] font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg"
          style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}
        >
          {simulation_params.model === "jump_diffusion" ? "Jump-Diffusion" : "GBM"}
        </div>
      </div>

      {/* 2x2 Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl p-3 sm:p-4"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)" }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-1">
              {section.icon}
              <h4 className="text-xs sm:text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {section.title}
              </h4>
            </div>
            <p className="text-[10px] sm:text-[11px] mb-2.5 sm:mb-3" style={{ color: "var(--text-muted)" }}>
              {section.subtitle}
            </p>

            {/* Table Rows */}
            <div className="space-y-0">
              {section.rows.map((row, idx) => (
                <div key={row.label}>
                  <div
                    className="flex items-center justify-between py-2 sm:py-2.5"
                    style={{
                      borderTop: idx > 0 ? "1px solid var(--border-primary)" : "none",
                    }}
                  >
                    {/* Left: label + caption */}
                    <div className="flex-1 min-w-0 pr-2 sm:pr-3">
                      <p className="text-[11px] sm:text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        {row.label}
                      </p>
                      <p className="text-[9px] sm:text-[10px] leading-snug mt-0.5 hidden sm:block" style={{ color: "var(--text-muted)" }}>
                        {row.caption}
                      </p>
                    </div>

                    {/* Right: value + badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-xs sm:text-sm font-bold"
                        style={{ color: row.color || "var(--text-primary)" }}
                      >
                        {row.value}
                      </span>
                      {row.badge && (
                        <span
                          className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ color: row.badgeColor, background: row.badgeBg }}
                        >
                          {row.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for probability items */}
                  {row.bar !== undefined && (
                    <div className="pb-2">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-primary)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(row.bar * 100, 100)}%`, background: row.color }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mini distribution graph for Investment section */}
            {section.hasDistribution && distData && (
              <div
                className="mt-3 pt-3"
                style={{ borderTop: "1px solid var(--border-primary)" }}
              >
                <p className="text-[10px] sm:text-[11px] font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                  PORTFOLIO VALUE DISTRIBUTION
                </p>
                <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-card)" }}>
                  <svg
                    viewBox={`0 0 ${distData.svgW} ${distData.svgH + 2}`}
                    width="100%"
                    preserveAspectRatio="none"
                    style={{ display: "block" }}
                  >
                    {distData.bars.map((bar, i) => (
                      <rect
                        key={i}
                        x={bar.x}
                        y={bar.y}
                        width={Math.max(bar.w - 0.5, 0.5)}
                        height={bar.h}
                        rx={1}
                        fill={bar.isProfit ? "var(--success)" : "var(--danger)"}
                        opacity={0.7}
                      />
                    ))}
                    {/* Initial investment reference line */}
                    <line
                      x1={distData.initialX}
                      y1={0}
                      x2={distData.initialX}
                      y2={distData.svgH}
                      stroke="var(--text-muted)"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                  </svg>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--danger)" }} />
                    <span className="text-[9px] sm:text-[10px]" style={{ color: "var(--text-muted)" }}>Loss</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px]" style={{ color: "var(--text-muted)" }}>
                    ← {fmt(investment_analysis.initial_investment)} →
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] sm:text-[10px]" style={{ color: "var(--text-muted)" }}>Profit</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimer Footer */}
      <div
        className="mt-3 sm:mt-4 pt-3 flex items-start gap-2"
        style={{ borderTop: "1px solid var(--border-primary)" }}
      >
        <svg className="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-[9px] sm:text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Mathematical simulation only — <strong>not financial advice</strong>. Consult a qualified advisor before investing.
        </p>
      </div>
    </div>
  );
}
