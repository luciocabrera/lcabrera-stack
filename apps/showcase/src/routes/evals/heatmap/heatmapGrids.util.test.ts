import type { SubjectRun } from '@repo/eval-history/queries/queries.types';

import { describe, expect, it } from 'vite-plus/test';

import { heatmapGrids } from './heatmapGrids.util';

const RUN_1 = '00000000-0000-4000-8000-000000000001';
const RUN_2 = '00000000-0000-4000-8000-000000000002';

const cell = (overrides: Partial<SubjectRun>): SubjectRun => ({
  contentHash: 'c'.repeat(64),
  k: 3,
  modelId: 'model-a',
  n: 3,
  runId: RUN_1,
  startedAt: new Date('2026-10-01T02:00:00Z'),
  subjectKind: 'skill',
  subjectName: 'react-19',
  suite: 'skills',
  taskKeys: ['t1'],
  trialId: '1',
  trials: 3,
  ...overrides,
});

describe('heatmapGrids', () => {
  it('draws one grid per suite, runs oldest first and subjects by name', () => {
    const [grid, other] = heatmapGrids({
      cells: [
        cell({ runId: RUN_2, startedAt: new Date('2026-10-02T02:00:00Z') }),
        cell({ subjectName: 'epic' }),
        cell({}),
        cell({ suite: 'skill-quality' }),
      ],
      flaky: [],
    });

    expect(grid?.suite).toBe('skill-quality');
    expect(other?.runs.map(({ runId }) => runId)).toEqual([RUN_1, RUN_2]);
    expect(other?.subjects.map(({ label }) => label)).toEqual([
      'epic',
      'react-19',
    ]);
  });

  it('leaves a gap where a subject did not run and links each subject to its trend', () => {
    const [grid] = heatmapGrids({
      cells: [
        cell({ runId: RUN_2, startedAt: new Date('2026-10-02T02:00:00Z') }),
        cell({ subjectName: 'epic' }),
      ],
      flaky: [{ suite: 'skills', taskKey: 't1' }],
    });
    const epic = grid?.subjects[0];

    expect(epic?.href).toBe('/evals/subjects/skill/epic');
    expect(epic?.cells.map((entry) => entry?.isFlaky ?? 'gap')).toEqual([
      true,
      'gap',
    ]);
  });
});
