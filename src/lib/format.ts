export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value)}`;
}

export function formatSaasCost(value: number): string {
  return `$${(value / 1000).toFixed(0)}K`;
}

export function formatMonths(months: number): string {
  if (months < 12) return `${months} month${months > 1 ? "s" : ""}`;
  if (months % 12 === 0) return `${months / 12} yr${months / 12 > 1 ? "s" : ""}`;
  return `${Math.floor(months / 12)}y ${months % 12}m`;
}
