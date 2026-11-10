export const EVALS_INTERVAL = {
  minTrialsForRate: 6,
  z: 1.96,
} as const;

export const EVALS_SCORED = {
  sigma: 2,
} as const;

export const EVALS_FLAKY = {
  disagreeFraction: 0.2,
  window: 10,
} as const;

export const EVALS_REGRESSION = {
  baseline: { defaultRuns: 5 },
  binary: { flip: { failAtLeast: 2, ofTrials: 3 } },
  flaky: EVALS_FLAKY,
  minTrialsForRate: EVALS_INTERVAL.minTrialsForRate,
  scored: EVALS_SCORED,
  z: EVALS_INTERVAL.z,
} as const;

export const EVALS_RUNS_PER_SUITE = 30;

export const EVALS_CHART_TRIALS = 500;

export const EVALS_TRIALS_PAGE_LIMIT = 500;

export const EVALS_TREND_RUNS = 120;

export const EVALS_HEATMAP_RUNS = 30;

export const EVALS_COST_RUNS = 30;

export const EVALS_CONFUSION_RUNS = 10;

export const EVALS_QUALITY_RUNS = 30;

export const EVALS_HEALTH_RUNS = 30;

export const EVALS_COMPARE_CHOICES = 10;

export const EVALS_MAIN_BRANCH = 'main';

export const EVALS_SUBJECT_KINDS = [
  'skill',
  'rule',
  'agent',
  'prompt',
] as const;

export const EVALS_COST_LABELS = {
  computed: 'Computed from model prices',
  reported: 'Reported by the SDK',
} as const;
