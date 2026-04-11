import { useState } from "react";

export default function InputPanel({
  onFetchStock,
  onSimulate,
  loading,
  stockLoading,
  stockInfo,
}) {
  const [ticker, setTicker] = useState("");
  const [numSimulations, setNumSimulations] = useState(1000);
  const [predictionDays, setPredictionDays] = useState(252);
  const [initialInvestment, setInitialInvestment] = useState(100000);
  const [lookbackDays, setLookbackDays] = useState(365);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [riskFreeRate, setRiskFreeRate] = useState(0.05);
  const [model, setModel] = useState("gbm");
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Jump diffusion params
  const [jumpIntensity, setJumpIntensity] = useState(1.0);
  const [jumpMean, setJumpMean] = useState(-0.05);
  const [jumpVolatility, setJumpVolatility] = useState(0.1);

  const handleTickerSubmit = (e) => {
    e.preventDefault();
    if (ticker.trim()) {
      onFetchStock(ticker.trim().toUpperCase());
    }
  };

  const handleSimulate = () => {
    const params = {
      ticker: stockInfo.ticker,
      num_simulations: numSimulations,
      prediction_days: predictionDays,
      initial_investment: initialInvestment,
      lookback_days: lookbackDays,
      confidence_level: confidenceLevel,
      risk_free_rate: riskFreeRate,
      model,
    };
    if (model === "jump_diffusion") {
      params.jump_intensity = jumpIntensity;
      params.jump_mean = jumpMean;
      params.jump_volatility = jumpVolatility;
    }
    onSimulate(params);
  };

  const SliderField = ({ label, value, onChange, min, max, step, format }) => (
    <div>
      <label className="flex justify-between text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        <span>{label}</span>
        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
          {format ? format(value) : value}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );

  return (
    <div className="card p-5">
      <h2 className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
        Configuration
      </h2>

      {/* Ticker Input */}
      <form onSubmit={handleTickerSubmit} className="mb-5">
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Stock Ticker
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="AAPL, TCS.NS, INFY.NS"
            className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-primary)")}
          />
          <button
            type="submit"
            disabled={stockLoading || !ticker.trim()}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "var(--accent)",
              color: "#fff",
            }}
            onMouseEnter={(e) => { if (!e.target.disabled) e.target.style.background = "var(--accent-hover)"; }}
            onMouseLeave={(e) => (e.target.style.background = "var(--accent)")}
          >
            {stockLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Fetch"}
          </button>
        </div>
      </form>

      {/* Model Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Simulation Model
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "gbm", label: "GBM", desc: "Standard" },
            { id: "jump_diffusion", label: "Jump Diffusion", desc: "Merton" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: model === m.id ? "var(--accent-subtle)" : "var(--bg-input)",
                border: `2px solid ${model === m.id ? "var(--accent)" : "transparent"}`,
              }}
            >
              <p className="text-xs font-semibold" style={{ color: model === m.id ? "var(--accent)" : "var(--text-primary)" }}>
                {m.label}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {m.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4 mb-4">
        <SliderField
          label="Simulations"
          value={numSimulations}
          onChange={setNumSimulations}
          min={100} max={10000} step={100}
          format={(v) => v.toLocaleString()}
        />
        <SliderField
          label="Prediction Horizon"
          value={predictionDays}
          onChange={setPredictionDays}
          min={30} max={756} step={1}
          format={(v) => `${v} days`}
        />
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Initial Investment
          </label>
          <input
            type="number"
            min={0}
            value={initialInvestment}
            onChange={(e) => setInitialInvestment(Number(e.target.value))}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-primary)")}
          />
        </div>
        <SliderField
          label="Historical Lookback"
          value={lookbackDays}
          onChange={setLookbackDays}
          min={30} max={1825} step={30}
          format={(v) => `${v} days`}
        />
      </div>

      {/* Advanced Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between text-xs font-medium py-2 mb-3"
        style={{ color: "var(--text-muted)" }}
      >
        <span>Advanced Parameters</span>
        <svg
          className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showAdvanced && (
        <div className="space-y-4 mb-4 p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
          <SliderField
            label="Confidence Level"
            value={confidenceLevel}
            onChange={setConfidenceLevel}
            min={0.8} max={0.99} step={0.01}
            format={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <SliderField
            label="Risk-Free Rate"
            value={riskFreeRate}
            onChange={setRiskFreeRate}
            min={0} max={0.15} step={0.005}
            format={(v) => `${(v * 100).toFixed(1)}%`}
          />
          {model === "jump_diffusion" && (
            <>
              <div className="pt-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
                <p className="text-[11px] font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
                  JUMP DIFFUSION PARAMETERS
                </p>
              </div>
              <SliderField
                label="Jump Intensity (per year)"
                value={jumpIntensity}
                onChange={setJumpIntensity}
                min={0} max={10} step={0.5}
                format={(v) => v.toFixed(1)}
              />
              <SliderField
                label="Jump Mean"
                value={jumpMean}
                onChange={setJumpMean}
                min={-0.5} max={0.5} step={0.01}
                format={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <SliderField
                label="Jump Volatility"
                value={jumpVolatility}
                onChange={setJumpVolatility}
                min={0} max={0.5} step={0.01}
                format={(v) => `${(v * 100).toFixed(0)}%`}
              />
            </>
          )}
        </div>
      )}

      {/* Run Button */}
      <button
        onClick={handleSimulate}
        disabled={loading || !stockInfo}
        className="w-full py-3.5 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: loading ? "var(--text-muted)" : "var(--success)",
          color: "#fff",
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Running...
          </span>
        ) : (
          "Run Simulation"
        )}
      </button>
    </div>
  );
}
