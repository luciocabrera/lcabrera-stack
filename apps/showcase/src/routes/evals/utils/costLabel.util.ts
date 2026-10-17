const USD = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 4,
  minimumFractionDigits: 2,
  style: 'currency',
});

export const costLabel = (costUsd: number | undefined) =>
  costUsd === undefined ? 'not reported' : USD.format(costUsd);
