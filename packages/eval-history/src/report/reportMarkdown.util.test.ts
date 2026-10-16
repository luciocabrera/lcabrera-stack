import { describe, expect, it } from 'vite-plus/test';

import { compareRuns } from './compareRuns.util.ts';
import { reportMarkdown } from './reportMarkdown.util.ts';
import { reportRunFixture } from './reportRunFixture.util.ts';

const run = reportRunFixture();

const thresholds = { minTrialsForRate: 6, z: 1.96 };

describe('reportMarkdown', () => {
  it('renders a comparison and a refusal as sections in order', () => {
    const markdown = reportMarkdown([
      compareRuns({ a: run, b: { ...run, branch: 'feat/x' }, thresholds }),
      compareRuns({
        a: run,
        b: { ...run, branch: 'feat/y', modelId: 'model-b' },
        thresholds,
      }),
    ]);

    expect(
      markdown.split('\n').filter((line) => line.startsWith('### ')),
    ).toEqual([
      '### skills: feat/x vs main (model-a)',
      '### skills: feat/y vs main: not compared',
    ]);
  });
});
