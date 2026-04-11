export default function StockInfo({ stockInfo }) {
  if (!stockInfo) return null;

  const currency = stockInfo.currency === "INR" ? "\u20B9" : "$";

  const formatMarketCap = (cap) => {
    if (!cap) return "N/A";
    if (cap >= 1e12) return `${currency}${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `${currency}${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `${currency}${(cap / 1e6).toFixed(2)}M`;
    return `${currency}${cap.toLocaleString()}`;
  };

  const metrics = [
    { label: "Volatility", value: `${(stockInfo.historical_volatility_annual * 100).toFixed(1)}%`, color: "var(--warning)" },
    { label: "Drift", value: `${(stockInfo.historical_drift_annual * 100).toFixed(1)}%`, color: "var(--accent)" },
    { label: "Div Yield", value: `${(stockInfo.dividend_yield * 100).toFixed(2)}%`, color: "var(--success)" },
    { label: "Beta", value: stockInfo.beta ? stockInfo.beta.toFixed(2) : "N/A", color: "var(--purple)" },
  ];

  return (
    <div className="card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
            <span
              className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
            >
              {stockInfo.ticker}
            </span>
            {stockInfo.sector && (
              <span
                className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--purple-subtle)", color: "var(--purple)" }}
              >
                {stockInfo.sector}
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {stockInfo.name}
          </h3>
          <span className="text-[11px] sm:text-xs" style={{ color: "var(--text-muted)" }}>
            {stockInfo.exchange}
          </span>
        </div>
        <div className="text-right pl-2 sm:pl-3">
          <p className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {currency}{stockInfo.current_price.toFixed(2)}
          </p>
          <span className="text-[11px] sm:text-xs" style={{ color: "var(--text-muted)" }}>{stockInfo.currency}</span>
        </div>
      </div>

      {/* 52-week range */}
      {stockInfo.fifty_two_week_low && stockInfo.fifty_two_week_high && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            <span>52W Low: {currency}{stockInfo.fifty_two_week_low.toFixed(2)}</span>
            <span>52W High: {currency}{stockInfo.fifty_two_week_high.toFixed(2)}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${((stockInfo.current_price - stockInfo.fifty_two_week_low) / (stockInfo.fifty_two_week_high - stockInfo.fifty_two_week_low)) * 100}%`,
                background: "linear-gradient(90deg, var(--danger), var(--warning), var(--success))",
              }}
            />
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-2.5 sm:p-3"
            style={{ background: "var(--bg-input)" }}
          >
            <p className="text-[10px] sm:text-[11px] font-medium mb-0.5" style={{ color: "var(--text-muted)" }}>
              {m.label}
            </p>
            <p className="text-xs sm:text-sm font-bold" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Market Cap & Distribution Stats */}
      <div
        className="mt-3 pt-3 grid grid-cols-3 gap-2 text-center"
        style={{ borderTop: "1px solid var(--border-primary)" }}
      >
        <div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Mkt Cap</p>
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            {formatMarketCap(stockInfo.market_cap)}
          </p>
        </div>
        <div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Skewness</p>
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            {stockInfo.daily_return_skewness.toFixed(3)}
          </p>
        </div>
        <div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Kurtosis</p>
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            {stockInfo.daily_return_kurtosis.toFixed(3)}
          </p>
        </div>
      </div>
    </div>
  );
}
