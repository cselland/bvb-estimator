-- D1: structured market data (quotes, series metadata). Vectorize holds embeddings for PDF/URL memory.
CREATE TABLE IF NOT EXISTS market_series (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT,
  currency TEXT DEFAULT 'USD',
  source TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS market_quote (
  series_id TEXT NOT NULL REFERENCES market_series(id),
  as_of TEXT NOT NULL,
  value REAL NOT NULL,
  PRIMARY KEY (series_id, as_of)
);

CREATE INDEX IF NOT EXISTS idx_market_series_symbol ON market_series(symbol);
