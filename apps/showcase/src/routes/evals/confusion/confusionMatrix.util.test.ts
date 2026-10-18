import { describe, expect, it } from 'vite-plus/test';

import { confusionMatrix } from './confusionMatrix.util';

const row = (
  overrides: Partial<Parameters<typeof confusionMatrix>[0][number]>,
) => ({
  errored: false,
  expectedSkill: 'react-19',
  invoked: ['react-19'],
  taskKind: 'trigger' as const,
  trials: 1,
  ...overrides,
});

describe('confusionMatrix', () => {
  it('lays the loaded skills against each expectation, unloaded columns last', () => {
    expect(
      confusionMatrix([
        row({ trials: 4 }),
        row({ invoked: ['store-pattern'], trials: 2 }),
        row({ invoked: [], trials: 1 }),
        row({ errored: true, invoked: [], trials: 1 }),
        row({ invoked: [], taskKind: 'near-miss', trials: 3 }),
      ]),
    ).toEqual({
      columns: ['react-19', 'store-pattern', '(none)', '(error)'],
      rows: [
        {
          cells: [
            { column: 'react-19', count: 0, isMisload: false, label: '·' },
            { column: 'store-pattern', count: 0, isMisload: false, label: '·' },
            { column: '(none)', count: 3, isMisload: false, label: '3' },
            { column: '(error)', count: 0, isMisload: false, label: '·' },
          ],
          expected: 'not react-19',
          trials: 3,
        },
        {
          cells: [
            { column: 'react-19', count: 4, isMisload: false, label: '4' },
            { column: 'store-pattern', count: 2, isMisload: true, label: '2' },
            { column: '(none)', count: 1, isMisload: true, label: '1' },
            { column: '(error)', count: 1, isMisload: false, label: '1' },
          ],
          expected: 'react-19',
          trials: 8,
        },
      ],
    });
  });

  it('counts a trial that loaded two skills in both columns, once in its row', () => {
    const { rows } = confusionMatrix([
      row({ invoked: ['react-19', 'store-pattern', 'react-19'], trials: 2 }),
    ]);

    expect(rows).toEqual([
      {
        cells: [
          { column: 'react-19', count: 2, isMisload: false, label: '2' },
          { column: 'store-pattern', count: 2, isMisload: true, label: '2' },
        ],
        expected: 'react-19',
        trials: 2,
      },
    ]);
  });

  it('marks the skill loading on its own near-miss task', () => {
    const { rows } = confusionMatrix([row({ taskKind: 'near-miss' })]);

    expect(rows[0]?.cells).toEqual([
      { column: 'react-19', count: 1, isMisload: true, label: '1' },
    ]);
  });
});
