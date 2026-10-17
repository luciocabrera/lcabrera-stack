import { describe, expect, it } from 'vite-plus/test';

import { compareRuns } from './compareRuns.util.ts';
import {
  AGREEMENT_HEADING,
  AGREEMENT_NEEDS_DATABASE,
} from './report.constants.ts';
import { reportMarkdown } from './reportMarkdown.util.ts';
import { reportRunFixture } from './reportRunFixture.util.ts';

const run = reportRunFixture();

const thresholds = { minTrialsForRate: 6, z: 1.96 };

const comparison = compareRuns({
  a: run,
  b: { ...run, branch: 'feat/x' },
  thresholds,
});

describe('reportMarkdown', () => {
  it('renders a comparison, a refusal and the agreement as sections in order', () => {
    const markdown = reportMarkdown({
      agreement: { kind: 'needs-database' },
      comparisons: [
        comparison,
        compareRuns({
          a: run,
          b: { ...run, branch: 'feat/y', modelId: 'model-b' },
          thresholds,
        }),
      ],
      thresholds,
    });

    expect(
      markdown.split('\n').filter((line) => line.startsWith('### ')),
    ).toEqual([
      '### skills: main → feat/x (model-a)',
      '### skills: main → feat/y: not compared',
      '### Judge agreement (all recorded hand grades, by judge model and prompt hash)',
    ]);
  });

  it('leaves the comparisons the same whichever agreement follows them', () => {
    const fromFiles = reportMarkdown({
      agreement: { kind: 'needs-database' },
      comparisons: [comparison],
      thresholds,
    });
    const fromDatabase = reportMarkdown({
      agreement: { judges: [], kind: 'read' },
      comparisons: [comparison],
      thresholds,
    });
    const shared = fromFiles.slice(0, fromFiles.indexOf(AGREEMENT_HEADING));

    expect(shared).toMatch(/^### skills: main → feat\/x/u);
    expect(fromFiles).toBe(
      `${shared}${AGREEMENT_HEADING}\n\n${AGREEMENT_NEEDS_DATABASE}`,
    );
    expect(fromDatabase.startsWith(`${shared}${AGREEMENT_HEADING}\n\n`)).toBe(
      true,
    );
    expect(fromDatabase).not.toContain(AGREEMENT_NEEDS_DATABASE);
  });
});
