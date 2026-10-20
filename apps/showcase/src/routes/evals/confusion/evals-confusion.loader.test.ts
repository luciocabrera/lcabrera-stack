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
  selectRunSummaries,
  selectTriggerConfusion,
} from '../.server/evalsHistory.service';
import { runSummary } from '../types/runSummary.fixtures';
import { routeLoaderArgs } from '../utils/routeLoaderArgs.util';
import { loader } from './evals-confusion.loader';

vi.mock('../.server/evalsHistory.service', () => ({
  selectRunSummaries: vi.fn(),
  selectTriggerConfusion: vi.fn(() =>
    Promise.resolve([
      {
        errored: false,
        expectedSkill: 'react-19',
        invoked: ['react-19'],
        taskKind: 'trigger',
        trials: 3,
      },
    ]),
  ),
}));

const SKILLS = '00000000-0000-4000-8000-00000000000a';
const QUALITY = '00000000-0000-4000-8000-00000000000b';

const invoke = (search = '') =>
  loader(
    routeLoaderArgs({
      params: {},
      path: 'evals/confusion',
      search,
    }) as LoaderFunctionArgs,
  );

beforeEach(() => {
  vi.stubEnv('EVALS_DASHBOARD', '1');
  vi.mocked(selectRunSummaries).mockImplementation(({ scope }) =>
    Promise.resolve(
      scope.kind === 'run'
        ? [
            runSummary({
              runId: scope.runId,
              suite: scope.runId === QUALITY ? 'skill-quality' : 'skills',
            }),
          ]
        : [
            runSummary({ runId: QUALITY, suite: 'skill-quality' }),
            runSummary({ runId: SKILLS }),
          ],
    ),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('the confusion loader', () => {
  it("lays out the recent skills runs' trials", async () => {
    const data = await invoke();

    expect(selectRunSummaries).toHaveBeenCalledWith({
      scope: { kind: 'recent', perSuite: 10 },
    });
    expect(selectTriggerConfusion).toHaveBeenCalledWith({ runIds: [SKILLS] });
    expect(data).toMatchObject({
      choices: [{ label: '2026-10-01 02:00 on main', runId: SKILLS }],
      matrix: { columns: ['react-19'] },
      runs: [{ runId: SKILLS }],
      selectedRunId: undefined,
    });
  });

  it('lays out one skills run', async () => {
    const data = await invoke(`?run=${SKILLS}`);

    expect(selectTriggerConfusion).toHaveBeenCalledWith({ runIds: [SKILLS] });
    expect(data.selectedRunId).toBe(SKILLS);
  });

  it.each([
    { name: 'a run id that is no uuid', search: '?run=nope' },
    { name: 'a run of another suite', search: `?run=${QUALITY}` },
  ])('answers 404 for $name', async ({ search }) => {
    await expect(invoke(search)).rejects.toMatchObject({ status: 404 });
    expect(selectTriggerConfusion).not.toHaveBeenCalled();
  });
});
