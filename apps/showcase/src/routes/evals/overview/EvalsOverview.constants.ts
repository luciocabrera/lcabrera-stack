export const EVALS_VIEWS = [
  { label: 'Compare runs', to: '/evals/compare' },
  { label: 'Heatmap', to: '/evals/heatmap' },
  { label: 'Cost and latency', to: '/evals/cost' },
  { label: 'Flaky tasks', to: '/evals/flaky' },
  { label: 'Trigger confusion', to: '/evals/confusion' },
  { label: 'Quality dimensions', to: '/evals/quality' },
  { label: 'Run health', to: '/evals/health' },
  { label: 'False-positive panel', to: '/evals/adjudications' },
] as const;

export const OVERVIEW_SPARKLINE = { height: 48, width: 240 } as const;
