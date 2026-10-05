import { describe, expect, it } from 'vite-plus/test';

import {
  confusionMatrix,
  formatMatrix,
  trialRecord,
} from './trigger-matrix.mjs';

const result = ({
  error,
  id = 'trigger',
  invoked,
  shouldTrigger = true,
  skill = 'epic',
}) => ({
  error,
  invoked,
  passed: invoked.includes(skill) === shouldTrigger,
  skill,
  task: { id, set: 'regression', shouldTrigger },
});

const trials = [
  result({ invoked: ['epic'] }),
  result({ invoked: ['refactor-verified', 'epic'] }),
  result({ invoked: ['refactor-verified'] }),
  result({ id: 'near-miss', invoked: [], shouldTrigger: false }),
  result({
    id: 'near-miss',
    invoked: ['commit-and-pr'],
    shouldTrigger: false,
  }),
  result({ error: 'the session ended with error_max_turns', invoked: [] }),
].map(trialRecord);

describe('trialRecord', () => {
  it('keeps every skill a trial invoked, once each, in the order it loaded them', () => {
    expect(
      trialRecord(
        result({ invoked: ['refactor-verified', 'epic', 'refactor-verified'] }),
      ),
    ).toStrictEqual({
      error: undefined,
      invoked: ['refactor-verified', 'epic'],
      passed: true,
      set: 'regression',
      shouldTrigger: true,
      skill: 'epic',
      task: 'trigger',
    });
  });
});

describe('confusionMatrix', () => {
  it('counts a trial that loaded two skills in both columns', () => {
    expect(confusionMatrix(trials)).toStrictEqual({
      columns: [
        'commit-and-pr',
        'epic',
        'refactor-verified',
        '(none)',
        '(error)',
      ],
      rows: [
        { cells: [0, 2, 2, 0, 1], expected: 'epic', trials: 4 },
        { cells: [1, 0, 0, 1, 0], expected: 'not epic', trials: 2 },
      ],
    });
  });

  it('keeps one row per skill and expectation across skills', () => {
    const matrix = confusionMatrix([
      trialRecord(result({ invoked: ['epic'] })),
      trialRecord(result({ invoked: ['epic'], skill: 'refactor-verified' })),
    ]);
    expect(matrix.columns).toStrictEqual(['epic']);
    expect(matrix.rows).toStrictEqual([
      { cells: [1], expected: 'epic', trials: 1 },
      { cells: [1], expected: 'refactor-verified', trials: 1 },
    ]);
  });

  it('names no column for an outcome no trial had', () => {
    expect(
      confusionMatrix([trialRecord(result({ invoked: ['epic'] }))]).columns,
    ).toStrictEqual(['epic']);
  });
});

describe('formatMatrix', () => {
  it('prints expected skills down the side and loaded skills across the top', () => {
    expect(formatMatrix(confusionMatrix(trials)).split('\n')).toStrictEqual([
      'expected \\ loaded  commit-and-pr  epic  refactor-verified  (none)  (error)  trials',
      'epic                           .     2                  2       .        1       4',
      'not epic                       1     .                  .       1        .       2',
    ]);
  });
});
