import asyncio

import numpy as np
from fastapi import APIRouter, HTTPException

from core.simulation import run_monte_carlo
from core.stock_data import fetch_stock_data
from models.schemas import (
    SimulationRequest,
    SimulationResponse,
    StockInfoResponse,
)

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok"}


@router.get("/stock/{ticker}", response_model=StockInfoResponse)
async def get_stock_info(ticker: str):
    try:
        data = await asyncio.to_thread(fetch_stock_data, ticker)
    except Exception as e:
        err = str(e).lower()
        if "rate" in err or "too many" in err or "429" in err:
            raise HTTPException(
                status_code=429,
                detail=f"Yahoo Finance rate limit hit. Please wait 30 seconds and try again.",
            )
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch data for '{ticker}': {str(e)}",
        )

    return StockInfoResponse(
        ticker=data["ticker"],
        name=data["name"],
        current_price=data["current_price"],
        currency=data["currency"],
        exchange=data["exchange"],
        historical_volatility_annual=data["annual_volatility"],
        historical_drift_annual=data["annual_drift"],
        dividend_yield=data["dividend_yield"],
        beta=data["beta"],
        fifty_two_week_high=data["fifty_two_week_high"],
        fifty_two_week_low=data["fifty_two_week_low"],
        market_cap=data["market_cap"],
        sector=data["sector"],
        daily_return_skewness=data["skewness"],
        daily_return_kurtosis=data["kurtosis"],
    )


@router.post("/simulate", response_model=SimulationResponse)
async def simulate(request: SimulationRequest):
    try:
        stock_data = await asyncio.to_thread(
            fetch_stock_data, request.ticker, request.lookback_days
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = run_monte_carlo(
        current_price=stock_data["current_price"],
        drift=stock_data["annual_drift"],
        volatility=stock_data["annual_volatility"],
        dividend_yield=stock_data["dividend_yield"],
        prediction_days=request.prediction_days,
        num_simulations=request.num_simulations,
        confidence_level=request.confidence_level,
        risk_free_rate=request.risk_free_rate,
        model=request.model,
        jump_intensity=request.jump_intensity,
        jump_mean=request.jump_mean,
        jump_volatility=request.jump_volatility,
    )

    current_price = stock_data["current_price"]
    initial_investment = request.initial_investment or 100000
    num_shares = initial_investment / current_price
    final_prices_arr = result["all_final_prices"]

    portfolio_finals = num_shares * final_prices_arr
    prob_profit = float((final_prices_arr > current_price).mean())
    prob_10pct_gain = float((final_prices_arr > current_price * 1.10).mean())
    prob_20pct_loss = float((final_prices_arr < current_price * 0.80).mean())

    return SimulationResponse(
        ticker=request.ticker,
        current_price=current_price,
        simulation_params={
            "model": request.model,
            "drift_annual": stock_data["annual_drift"],
            "volatility_annual": stock_data["annual_volatility"],
            "risk_free_rate": request.risk_free_rate,
            "dividend_yield": stock_data["dividend_yield"],
            "dt": 1.0 / 252.0,
            "num_simulations": request.num_simulations,
            "prediction_days": request.prediction_days,
            "confidence_level": request.confidence_level,
        },
        sample_paths=result["sample_paths"],
        time_axis=result["time_axis"],
        final_prices=result["final_prices"],
        distribution_bins=result["distribution_bins"],
        confidence_bands=result["confidence_bands"],
        investment_analysis={
            "initial_investment": initial_investment,
            "expected_value": round(float(portfolio_finals.mean()), 2),
            "probability_of_profit": round(prob_profit, 4),
            "probability_of_10pct_gain": round(prob_10pct_gain, 4),
            "probability_of_20pct_loss": round(prob_20pct_loss, 4),
            "value_at_risk": round(float(num_shares * result["var_threshold"]), 2),
            "conditional_var": round(float(num_shares * result["conditional_var"]), 2),
            "best_case": round(float(num_shares * result["best_case"]), 2),
            "sharpe_ratio": result["sharpe_ratio"],
            "max_drawdown_mean": result["max_drawdown_mean"],
            "annualized_return": result["annualized_return"],
        },
    )
