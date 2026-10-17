import { describe, expect, it } from 'vite-plus/test';

import { changedInputs } from './changedInputs.util';
import { comparisonRow } from './comparisonRow.fixtures';

const RUN = {
  catalogHash: 'c'.repeat(64),
  harnessVersion: 'abc',
  modelId: 'model-a',
  sdkVersion: '1.0.0',
};

const UNCHANGED = [comparisonRow({})];

const CONTENT_CHANGED = [comparisonRow({ contentHashB: 'd'.repeat(64) })];

const FIXTURE_CHANGED = [
  comparisonRow({ fixtureHashB: 'e'.repeat(64), taskKey: 't' }),
];

describe('changedInputs', () => {
  it('finds nothing when every input matches', () => {
    expect(changedInputs({ a: RUN, b: RUN, rows: UNCHANGED })).toEqual({
      kind: 'none',
    });
  });

  it('names the one input that changed', () => {
    expect(
      changedInputs({
        a: RUN,
        b: RUN,
        rows: CONTENT_CHANGED,
      }),
    ).toEqual({ changed: 'skill react-19 content', kind: 'single' });
  });

  it('names every input when a run setting and a task both changed', () => {
    expect(
      changedInputs({
        a: RUN,
        b: { ...RUN, modelId: 'model-b' },
        rows: FIXTURE_CHANGED,
      }),
    ).toEqual({ changed: ['model', 't fixture'], kind: 'multiple' });
  });
});
