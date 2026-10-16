import type { SubjectRun } from '@repo/eval-history/queries/queries.types';
import type { LoaderFunctionArgs } from 'react-router';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import {
  selectAnnotations,
  selectSubjectRuns,
} from '../.server/evalsHistory.service';
import { routeLoaderArgs } from '../utils/routeLoaderArgs.util';
import { loader } from './evals-subject-trend.loader';

vi.mock('../.server/evalsHistory.service', () => ({
  selectAnnotations: vi.fn(),
  selectSubjectRuns: vi.fn(),
}));

const run = (overrides: Partial<SubjectRun>): SubjectRun => ({
  contentHash: 'a'.repeat(64),
  k: 3,
  modelId: 'model-a',
  n: 3,
  runId: '00000000-0000-4000-8000-000000000001',
  startedAt: new Date('2026-10-01T02:00:00Z'),
  subjectKind: 'skill',
  subjectName: 'react-19',
  suite: 'skills',
  taskKeys: ['skills/react-19/trigger-1'],
  trialId: '4',
  trials: 3,
  ...overrides,
});

const NEWEST = run({
  contentHash: 'b'.repeat(64),
  runId: '00000000-0000-4000-8000-000000000002',
  startedAt: new Date('2026-10-02T02:00:00Z'),
});

const OLDEST = run({});

type SubjectParams = {
  readonly kind: string;
  readonly name: string;
};

const invoke = ({ kind, name }: SubjectParams) =>
  loader(
    routeLoaderArgs({
      params: { kind, name },
      path: 'evals/subjects/:kind/:name',
    }) as LoaderFunctionArgs,
  );

const statusOf = async (params: SubjectParams) => {
  try {
    await invoke(params);

    return 'answered';
  } catch (error) {
    return error instanceof Response ? error.status : 'not a response';
  }
};

beforeEach(() => {
  vi.stubEnv('EVALS_DASHBOARD', '1');
  vi.mocked(selectSubjectRuns).mockResolvedValue([NEWEST, OLDEST]);
  vi.mocked(selectAnnotations).mockResolvedValue([
    {
      annotationId: '9',
      at: new Date('2026-10-01T12:00:00Z'),
      kind: 'model-change',
    },
  ]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe('the subject trend loader', () => {
  it('answers 404 for a kind no envelope records, before any query', async () => {
    expect(await statusOf({ kind: 'task', name: 'react-19' })).toBe(404);
    expect(selectSubjectRuns).not.toHaveBeenCalled();
  });

  it('answers 404 for a subject with no runs', async () => {
    vi.mocked(selectSubjectRuns).mockResolvedValue([]);

    expect(await statusOf({ kind: 'skill', name: 'missing' })).toBe(404);
  });

  it('reads the annotations across the span of the runs it plots', async () => {
    await invoke({ kind: 'skill', name: 'react-19' });

    expect(selectAnnotations).toHaveBeenCalledWith({
      from: OLDEST.startedAt,
      to: NEWEST.startedAt,
    });
  });

  it('plots the runs oldest first with a mark for each change', async () => {
    const data = await invoke({ kind: 'skill', name: 'react-19' });

    expect(data.points.map(({ key }) => key)).toEqual([
      OLDEST.runId,
      NEWEST.runId,
    ]);
    expect(data.marks.map(({ kind }) => kind)).toEqual([
      'content',
      'annotation',
    ]);
  });
});
