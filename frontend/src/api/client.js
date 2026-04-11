const API_BASE = "/api";

export async function getStockInfo(ticker) {
  const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(ticker)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch stock info");
  }
  return res.json();
}

export async function runSimulation(params) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Simulation failed");
  }
  return res.json();
}
