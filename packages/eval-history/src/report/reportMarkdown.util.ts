import type { RunComparison } from './report.types.ts';

import { comparisonMarkdown } from './comparisonMarkdown.util.ts';
import { refusalMarkdown } from './refusalMarkdown.util.ts';

export const reportMarkdown = (comparisons: readonly RunComparison[]) =>
  comparisons
    .map((comparison) =>
      comparison.kind === 'comparison'
        ? comparisonMarkdown(comparison)
        : refusalMarkdown(comparison),
    )
    .join('\n\n');
