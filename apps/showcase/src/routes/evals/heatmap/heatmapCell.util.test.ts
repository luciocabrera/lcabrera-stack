import type { SubjectRun } from '@repo/eval-history/queries/queries.types';

import { describe, expect, it } from 'vite-plus/test';

import { heatmapCell } from './heatmapCell.util';

const CELL: SubjectRun = {
  contentHashes: ['c'.repeat(64)],
  k: 1,
  modelId: 'model-a',
  n: 3,
  runId: '00000000-0000-4000-8000-000000000001',
  startedAt: new Date('2026-10-01T02:00:00Z'),
  subjectKind: 'skill',
  subjectName: 'react-19',
  suite: 'skills',
  taskKeys: ['skills/react-19/trigger-1', 'skills/react-19/near-miss-1'],
  trialId: '5',
  trials: 3,
};

describe('heatmapCell', () => {
  it('links the cell through to its run and its trial, coloured by rate', () => {
    expect(heatmapCell({ cell: CELL, flakyTasks: new Set() })).toEqual({
      column: '00000000-0000-4000-8000-000000000001',
      label: 'react-19, 2026-10-01: 33% (1/3); open trial 5',
      row: 'skill/react-19',
      to: '/evals/runs/00000000-0000-4000-8000-000000000001?trial=5',
      tone: 'error',
    });
  });

  it.each([
    { k: 3, n: 3, tone: 'success' },
    { k: 2, n: 3, tone: 'warning' },
    { k: 1, n: 3, tone: 'error' },
    { k: 0, n: 0, tone: 'neutral' },
  ] as const)('tones a cell at $k of $n as $tone', ({ k, n, tone }) => {
    expect(
      heatmapCell({ cell: { ...CELL, k, n }, flakyTasks: new Set() }).tone,
    ).toBe(tone);
  });

  it('marks the cell flaky when one of its tasks is flaky in its suite', () => {
    const cell = heatmapCell({
      cell: CELL,
      flakyTasks: new Set(['skills\nskills/react-19/near-miss-1']),
    });

    expect(cell.pattern).toBe('hatch');
    expect(cell.label).toContain(', flaky;');
  });

  it('ignores a flaky task of the same key in another suite', () => {
    expect(
      heatmapCell({
        cell: CELL,
        flakyTasks: new Set(['skill-quality\nskills/react-19/near-miss-1']),
      }).pattern,
    ).toBeUndefined();
  });
});
