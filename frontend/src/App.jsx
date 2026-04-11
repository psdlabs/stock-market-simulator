import { useSimulation } from "./hooks/useSimulation";
import { useTheme } from "./hooks/useTheme";
import InputPanel from "./components/InputPanel";
import StockInfo from "./components/StockInfo";
import StatsPanel from "./components/StatsPanel";
import SimulationChart from "./components/SimulationChart";
import DistributionChart from "./components/DistributionChart";
import LoadingSpinner from "./components/LoadingSpinner";

function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
      style={{
        background: "var(--bg-input)",
        border: "1px solid var(--border-primary)",
        color: "var(--text-secondary)",
      }}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function App() {
  const {
    loading,
    stockLoading,
    error,
    result,
    stockInfo,
    fetchStockInfo,
    runSimulation,
    setError,
  } = useSimulation();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-primary)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0"
              style={{ background: "var(--success)", color: "#fff" }}
            >
              SS
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                Stock Market Simulator
              </h1>
              <p className="text-[10px] sm:text-[11px] hidden sm:block" style={{ color: "var(--text-muted)" }}>
                Price Prediction &amp; Risk Analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {result && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--success-subtle)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--success)" }}>
                  Simulation Complete
                </span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-5 py-4 sm:py-6">
        {/* Error Banner */}
        {error && (
          <div
            className="mb-5 rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: "var(--danger-subtle)", border: "1px solid var(--danger)", borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)" }}
          >
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--danger)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Left Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4 sm:space-y-5">
            <InputPanel
              onFetchStock={fetchStockInfo}
              onSimulate={runSimulation}
              loading={loading}
              stockLoading={stockLoading}
              stockInfo={stockInfo}
            />
            <StockInfo stockInfo={stockInfo} />
          </div>

          {/* Right Content */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4 sm:space-y-5">
            {loading && <LoadingSpinner simCount={1000} />}

            {!loading && !result && (
              <div
                className="card flex flex-col items-center justify-center py-14 sm:py-24 px-5 sm:px-8 text-center"
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 pulse-glow"
                  style={{ background: "var(--accent-subtle)" }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  Ready to Simulate
                </h3>
                <p className="text-xs sm:text-sm max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Pick a stock from the sidebar, tweak parameters, and hit Run to see predicted price paths with full risk analytics.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4 sm:mt-5">
                  {["AAPL", "TCS.NS", "GOOGL", "INFY.NS", "MSFT", "TSLA"].map((t) => (
                    <span
                      key={t}
                      className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-primary)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!loading && result && (
              <>
                <SimulationChart result={result} />
                <DistributionChart result={result} />
              </>
            )}
          </div>
        </div>

        {/* Results Panel — full width below the grid */}
        {!loading && result && (
          <div className="mt-5">
            <StatsPanel result={result} />
          </div>
        )}
      </main>

      {/* Disclaimer + Footer */}
      <footer className="mt-8 sm:mt-12 py-5 sm:py-6" style={{ borderTop: "1px solid var(--border-primary)" }}>
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5">
          <div
            className="rounded-xl p-4 mb-4 flex gap-3"
            style={{ background: "var(--warning-subtle)", border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)" }}
          >
            <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--warning)" }}>Disclaimer</p>
              <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
                This tool is a <strong>mathematical simulation only</strong> and does <strong>not constitute financial advice</strong>.
                All results are based on statistical models using historical data and random sampling.
                Stock markets are inherently unpredictable and past performance does not guarantee future results.
                Always consult a qualified financial advisor before making investment decisions.
                The creators of this tool are not responsible for any financial losses incurred from decisions based on these simulations.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
            Stock Market Simulator &middot; Mathematical Simulation Engine &middot; For Educational Purposes Only
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
