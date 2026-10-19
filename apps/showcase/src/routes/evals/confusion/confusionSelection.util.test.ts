import { describe, expect, it } from 'vite-plus/test';

import { confusionSelection } from './confusionSelection.util';

describe('confusionSelection', () => {
  it('reads the recent runs without a run', () => {
    expect(confusionSelection(new URLSearchParams())).toEqual({
      kind: 'recent',
    });
  });

  it('reads one run by its id', () => {
    expect(confusionSelection(new URLSearchParams({ run: 'abc' }))).toEqual({
      kind: 'run',
      runId: 'abc',
    });
  });
});
