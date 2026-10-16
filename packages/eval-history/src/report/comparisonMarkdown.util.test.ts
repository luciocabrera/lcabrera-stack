import { describe, expect, it } from 'vite-plus/test';

import type { Comparison, ReportRun } from './report.types.ts';

import { compareRuns } from './compareRuns.util.ts';
import { comparisonMarkdown } from './comparisonMarkdown.util.ts';
import { reportRunFixture } from './reportRunFixture.util.ts';

const run = reportRunFixture();

const thresholds = { minTrialsForRate: 6, z: 1.96 };

const comparisonOf = (b: ReportRun) => {
  const comparison = compareRuns({ a: run, b, thresholds });

  if (comparison.kind !== 'comparison') {
    throw new Error('expected the two runs to compare');
  }

  return comparison satisfies Comparison;
};

describe('comparisonMarkdown', () => {
  it('prints the heading, flips, rates, cost and duration, then the changes', () => {
    const sections = comparisonMarkdown(
      comparisonOf({ ...run, branch: 'feat/x', catalogHash: 'cat2' }),
    ).split('\n\n');

    expect(sections).toEqual([
      '### skills: feat/x vs main (model-a)',
      'No task changed outcome.',
      expect.stringContaining('Pass rate, Wilson interval at z=1.96'),
      'Cost: $1.00 reported → $1.00 reported. Duration p50: 2.0 s → 2.0 s.',
      'Changed: skill catalog hash. That is one cause.',
    ]);
  });

  it('says when a side has no cost or duration, and when it is partial', () => {
    const markdown = comparisonMarkdown(
      comparisonOf({
        ...run,
        branch: 'feat/x',
        costUsdReported: undefined,
        durationsMs: [],
        status: 'partial',
      }),
    );

    expect(markdown).toContain(
      'Cost: $1.00 reported → not reported. Duration p50: 2.0 s → not recorded.',
    );
    expect(markdown).toContain(
      'feat/x is a partial run, so it holds only the trials that finished.',
    );
  });
});
