import yfinance as yf
import numpy as np
from scipy import stats as sp_stats
from datetime import datetime, timedelta


def fetch_stock_data(ticker: str, lookback_days: int = 365) -> dict:
    """Fetch historical stock data and compute comprehensive GBM parameters."""
    stock = yf.Ticker(ticker)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=lookback_days)

    hist = stock.history(start=start_date, end=end_date)

    if hist.empty or len(hist) < 30:
        raise ValueError(
            f"Insufficient historical data for ticker '{ticker}'. "
            f"Got {len(hist)} days, need at least 30."
        )

    close_prices = hist["Close"].values

    # Log returns: r_t = ln(S_t / S_{t-1})
    log_returns = np.log(close_prices[1:] / close_prices[:-1])

    # Annualized volatility: sigma = std(daily_log_returns) * sqrt(252)
    daily_vol = np.std(log_returns, ddof=1)
    annual_vol = daily_vol * np.sqrt(252)

    # Annualized drift: The mean of log returns estimates (mu - sigma^2/2),
    # so to recover the true drift mu we add back sigma^2/2
    daily_mean = np.mean(log_returns)
    annual_drift = daily_mean * 252 + (annual_vol ** 2) / 2

    # Higher-order moments for return distribution analysis
    skewness = float(sp_stats.skew(log_returns))
    kurtosis = float(sp_stats.kurtosis(log_returns))  # excess kurtosis

    current_price = float(close_prices[-1])

    info = stock.info
    name = info.get("longName", info.get("shortName", ticker))
    currency = info.get("currency", "USD")
    exchange = info.get("exchange", "Unknown")
    # yfinance's dividendYield can be unreliable (e.g. 0.4 for 0.4%).
    # Prefer trailingAnnualDividendYield which is the actual ratio.
    dividend_yield = info.get("trailingAnnualDividendYield", None)
    if dividend_yield is None or dividend_yield > 0.25:
        # Fallback: compute from dividendRate / price
        div_rate = info.get("dividendRate", 0.0) or 0.0
        dividend_yield = div_rate / current_price if current_price > 0 else 0.0
    beta = info.get("beta", None)
    fifty_two_week_high = info.get("fiftyTwoWeekHigh", None)
    fifty_two_week_low = info.get("fiftyTwoWeekLow", None)
    market_cap = info.get("marketCap", None)
    sector = info.get("sector", None)

    return {
        "ticker": ticker,
        "name": name,
        "current_price": current_price,
        "currency": currency,
        "exchange": exchange,
        "annual_volatility": round(float(annual_vol), 6),
        "annual_drift": round(float(annual_drift), 6),
        "dividend_yield": round(float(dividend_yield), 6),
        "beta": round(float(beta), 4) if beta else None,
        "fifty_two_week_high": float(fifty_two_week_high) if fifty_two_week_high else None,
        "fifty_two_week_low": float(fifty_two_week_low) if fifty_two_week_low else None,
        "market_cap": float(market_cap) if market_cap else None,
        "sector": sector,
        "skewness": round(skewness, 4),
        "kurtosis": round(kurtosis, 4),
    }
