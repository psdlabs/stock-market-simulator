from pydantic import BaseModel, Field
from typing import Optional


class StockInfoResponse(BaseModel):
    ticker: str
    name: str
    current_price: float
    currency: str
    exchange: str
    historical_volatility_annual: float
    historical_drift_annual: float
    dividend_yield: float
    beta: Optional[float]
    fifty_two_week_high: Optional[float]
    fifty_two_week_low: Optional[float]
    market_cap: Optional[float]
    sector: Optional[str]
    daily_return_skewness: float
    daily_return_kurtosis: float


class SimulationRequest(BaseModel):
    ticker: str
    num_simulations: int = Field(default=1000, ge=100, le=10000)
    prediction_days: int = Field(default=252, ge=1, le=756)
    initial_investment: Optional[float] = Field(default=100000, ge=0)
    lookback_days: int = Field(default=365, ge=30, le=1825)
    confidence_level: float = Field(default=0.95, ge=0.8, le=0.99)
    risk_free_rate: float = Field(default=0.05, ge=0.0, le=0.25)
    model: str = Field(default="gbm", pattern="^(gbm|jump_diffusion)$")
    # Jump diffusion (Merton) parameters
    jump_intensity: float = Field(default=1.0, ge=0.0, le=10.0)
    jump_mean: float = Field(default=-0.05, ge=-0.5, le=0.5)
    jump_volatility: float = Field(default=0.1, ge=0.0, le=1.0)


class PercentileData(BaseModel):
    p5: float
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float
    p95: float


class SimulationParams(BaseModel):
    model: str
    drift_annual: float
    volatility_annual: float
    risk_free_rate: float
    dividend_yield: float
    dt: float
    num_simulations: int
    prediction_days: int
    confidence_level: float


class FinalPriceStats(BaseModel):
    mean: float
    median: float
    std: float
    min: float
    max: float
    skewness: float
    kurtosis: float
    percentiles: PercentileData


class DistributionBins(BaseModel):
    edges: list[float]
    counts: list[int]


class InvestmentAnalysis(BaseModel):
    initial_investment: float
    expected_value: float
    probability_of_profit: float
    probability_of_10pct_gain: float
    probability_of_20pct_loss: float
    value_at_risk: float
    conditional_var: float
    best_case: float
    sharpe_ratio: float
    max_drawdown_mean: float
    annualized_return: float


class TimeSeriesStats(BaseModel):
    """Percentile bands over time for confidence envelope chart."""
    p5: list[float]
    p25: list[float]
    p50: list[float]
    p75: list[float]
    p95: list[float]


class SimulationResponse(BaseModel):
    ticker: str
    current_price: float
    simulation_params: SimulationParams
    sample_paths: list[list[float]]
    time_axis: list[int]
    final_prices: FinalPriceStats
    distribution_bins: DistributionBins
    investment_analysis: InvestmentAnalysis
    confidence_bands: TimeSeriesStats
