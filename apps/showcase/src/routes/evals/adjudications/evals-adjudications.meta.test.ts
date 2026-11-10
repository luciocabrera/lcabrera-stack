import { describe, expect, it } from 'vite-plus/test';

import { meta } from './evals-adjudications.meta';

describe('the adjudications meta', () => {
  it('titles the page and describes it', () => {
    expect(meta()).toEqual([
      { title: 'False-positive panel - Data Dashboard' },
      {
        content:
          "Every false-positive panel case with its verdicts and true answer, and each model's accuracy, cost and time against the true answer",
        name: 'description',
      },
    ]);
  });
});
