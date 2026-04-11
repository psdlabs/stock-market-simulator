import { useState } from "react";
import { getStockInfo, runSimulation as apiRunSimulation } from "../api/client";

export function useSimulation() {
  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);

  const fetchStockInfo = async (ticker) => {
    setStockLoading(true);
    setError(null);
    try {
      const data = await getStockInfo(ticker);
      setStockInfo(data);
      return data;
    } catch (err) {
      setError(err.message);
      setStockInfo(null);
      return null;
    } finally {
      setStockLoading(false);
    }
  };

  const runSimulation = async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRunSimulation(params);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    stockLoading,
    error,
    result,
    stockInfo,
    fetchStockInfo,
    runSimulation,
    setError,
  };
}
