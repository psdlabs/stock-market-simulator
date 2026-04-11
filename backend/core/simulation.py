import numpy as np
from scipy import stats as sp_stats


def run_gbm(
    current_price: float,
    drift: float,
    volatility: float,
    dividend_yield: float,
    prediction_days: int,
    num_simulations: int,
    rng: np.random.Generator,
) -> np.ndarray:
    """Standard Geometric Brownian Motion."""
    dt = 1.0 / 252.0
    # Adjust drift for dividend yield
    adjusted_drift = drift - dividend_yield
    drift_component = (adjusted_drift - 0.5 * volatility ** 2) * dt
    diffusion_component = volatility * np.sqrt(dt)

    Z = rng.standard_normal((num_simulations, prediction_days))
    daily_log_returns = drift_component + diffusion_component * Z
    cumulative = np.cumsum(daily_log_returns, axis=1)
    cumulative = np.concatenate(
        [np.zeros((num_simulations, 1)), cumulative], axis=1
    )
    return current_price * np.exp(cumulative)


def run_jump_diffusion(
    current_price: float,
    drift: float,
    volatility: float,
    dividend_yield: float,
    prediction_days: int,
    num_simulations: int,
    jump_intensity: float,
    jump_mean: float,
    jump_volatility: float,
    rng: np.random.Generator,
) -> np.ndarray:
    """Merton Jump-Diffusion Model: GBM + Poisson-driven jumps."""
    dt = 1.0 / 252.0
    adjusted_drift = drift - dividend_yield

    # Compensator to keep the process martingale-like
    jump_compensator = jump_intensity * (np.exp(jump_mean + 0.5 * jump_volatility ** 2) - 1)
    drift_component = (adjusted_drift - 0.5 * volatility ** 2 - jump_compensator) * dt
    diffusion_component = volatility * np.sqrt(dt)

    # Diffusion shocks
    Z = rng.standard_normal((num_simulations, prediction_days))

    # Jump component: number of jumps per day ~ Poisson(lambda * dt)
    num_jumps = rng.poisson(jump_intensity * dt, (num_simulations, prediction_days))
    # Jump sizes: sum of N(jump_mean, jump_vol) for each jump event
    jump_sizes = np.zeros((num_simulations, prediction_days))
    max_jumps = int(num_jumps.max()) if num_jumps.max() > 0 else 0
    for j in range(1, max_jumps + 1):
        mask = num_jumps >= j
        jump_sizes += mask * rng.normal(jump_mean, jump_volatility, (num_simulations, prediction_days))

    daily_log_returns = drift_component + diffusion_component * Z + jump_sizes
    cumulative = np.cumsum(daily_log_returns, axis=1)
    cumulative = np.concatenate(
        [np.zeros((num_simulations, 1)), cumulative], axis=1
    )
    return current_price * np.exp(cumulative)


def compute_max_drawdown(price_paths: np.ndarray) -> np.ndarray:
    """Compute max drawdown for each simulation path."""
    running_max = np.maximum.accumulate(price_paths, axis=1)
    drawdowns = (price_paths - running_max) / running_max
    return np.min(drawdowns, axis=1)  # most negative drawdown per path


def run_monte_carlo(
    current_price: float,
    drift: float,
    volatility: float,
    dividend_yield: float,
    prediction_days: int,
    num_simulations: int,
    confidence_level: float = 0.95,
    risk_free_rate: float = 0.05,
    model: str = "gbm",
    jump_intensity: float = 1.0,
    jump_mean: float = -0.05,
    jump_volatility: float = 0.1,
) -> dict:
    """
    Run Monte Carlo simulation with comprehensive risk analytics.

    Models:
        - gbm: Geometric Brownian Motion (standard)
        - jump_diffusion: Merton Jump-Diffusion (GBM + crash events)
    """
    rng = np.random.default_rng()
    dt = 1.0 / 252.0

    if model == "jump_diffusion":
        price_paths = run_jump_diffusion(
            current_price, drift, volatility, dividend_yield,
            prediction_days, num_simulations,
            jump_intensity, jump_mean, jump_volatility, rng,
        )
    else:
        price_paths = run_gbm(
            current_price, drift, volatility, dividend_yield,
            prediction_days, num_simulations, rng,
        )

    # Final prices
    final_prices = price_paths[:, -1]

    # --- Final price statistics ---
    percentiles = np.percentile(final_prices, [5, 10, 25, 50, 75, 90, 95])
    final_log_returns = np.log(final_prices / current_price)
    skewness = float(sp_stats.skew(final_prices))
    kurtosis = float(sp_stats.kurtosis(final_prices))

    # --- Histogram ---
    counts, bin_edges = np.histogram(final_prices, bins=60)

    # --- Confidence bands over time ---
    p5_band = np.percentile(price_paths, 5, axis=0)
    p25_band = np.percentile(price_paths, 25, axis=0)
    p50_band = np.percentile(price_paths, 50, axis=0)
    p75_band = np.percentile(price_paths, 75, axis=0)
    p95_band = np.percentile(price_paths, 95, axis=0)

    # --- Max drawdown ---
    max_drawdowns = compute_max_drawdown(price_paths)
    mean_max_drawdown = float(np.mean(max_drawdowns))

    # --- Investment analysis ---
    total_returns = (final_prices - current_price) / current_price
    T = prediction_days / 252.0
    annualized_returns = (1 + total_returns) ** (1.0 / T) - 1 if T > 0 else total_returns

    # Sharpe ratio: (mean_annualized_return - risk_free_rate) / std_annualized_return
    mean_ann_return = float(np.mean(annualized_returns))
    std_ann_return = float(np.std(annualized_returns))
    sharpe_ratio = (mean_ann_return - risk_free_rate) / std_ann_return if std_ann_return > 0 else 0.0

    # VaR and CVaR (Conditional VaR / Expected Shortfall)
    var_percentile = (1 - confidence_level) * 100
    var_threshold = np.percentile(final_prices, var_percentile)
    cvar_mask = final_prices <= var_threshold
    conditional_var = float(np.mean(final_prices[cvar_mask])) if cvar_mask.any() else float(var_threshold)

    best_case_percentile = confidence_level * 100
    best_case = float(np.percentile(final_prices, best_case_percentile))

    # --- Downsample paths for display ---
    num_display_paths = min(50, num_simulations)
    sorted_indices = np.argsort(final_prices)
    sample_indices = sorted_indices[
        np.linspace(0, num_simulations - 1, num_display_paths, dtype=int)
    ]
    sample_paths = price_paths[sample_indices]

    # Downsample time axis if too many days
    if prediction_days > 500:
        time_indices = np.linspace(0, prediction_days, 500, dtype=int)
        sample_paths = sample_paths[:, time_indices]
        p5_band = p5_band[time_indices]
        p25_band = p25_band[time_indices]
        p50_band = p50_band[time_indices]
        p75_band = p75_band[time_indices]
        p95_band = p95_band[time_indices]
        time_axis = time_indices.tolist()
    else:
        time_axis = list(range(prediction_days + 1))

    return {
        "sample_paths": np.round(sample_paths, 2).tolist(),
        "time_axis": time_axis,
        "final_prices": {
            "mean": round(float(np.mean(final_prices)), 2),
            "median": round(float(np.median(final_prices)), 2),
            "std": round(float(np.std(final_prices)), 2),
            "min": round(float(np.min(final_prices)), 2),
            "max": round(float(np.max(final_prices)), 2),
            "skewness": round(skewness, 4),
            "kurtosis": round(kurtosis, 4),
            "percentiles": {
                "p5": round(float(percentiles[0]), 2),
                "p10": round(float(percentiles[1]), 2),
                "p25": round(float(percentiles[2]), 2),
                "p50": round(float(percentiles[3]), 2),
                "p75": round(float(percentiles[4]), 2),
                "p90": round(float(percentiles[5]), 2),
                "p95": round(float(percentiles[6]), 2),
            },
        },
        "distribution_bins": {
            "edges": np.round(bin_edges, 2).tolist(),
            "counts": counts.tolist(),
        },
        "confidence_bands": {
            "p5": np.round(p5_band, 2).tolist(),
            "p25": np.round(p25_band, 2).tolist(),
            "p50": np.round(p50_band, 2).tolist(),
            "p75": np.round(p75_band, 2).tolist(),
            "p95": np.round(p95_band, 2).tolist(),
        },
        "all_final_prices": final_prices,
        "sharpe_ratio": round(sharpe_ratio, 4),
        "max_drawdown_mean": round(mean_max_drawdown, 4),
        "annualized_return": round(mean_ann_return, 4),
        "var_threshold": round(float(var_threshold), 2),
        "conditional_var": round(conditional_var, 2),
        "best_case": round(best_case, 2),
    }
