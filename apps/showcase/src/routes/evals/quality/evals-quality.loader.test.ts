import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  selectQualityBaselines,
  selectQualityScores,
  selectRunSummaries,
} from '../.server/evalsHistory.service';
import { runSummary } from '../types/runSummary.fixtures';
import { loader } from './evals-quality.loader';

const QUALITY = '00000000-0000-4000-8000-00000000000a';
const BASELINE = '00000000-0000-4000-8000-00000000000b';

vi.mock('../.server/evalsHistory.service', () => ({
  selectQualityBaselines: vi.fn(() =>
    Promise.resolve([
      {
        baselineId: '00000000-0000-4000-8000-0000000000ff',
        modelId: 'model-a',
        runIds: [BASELINE, QUALITY],
        subjectKind: 'skill',
        subjectName: 'react-19',
      },
    ]),
  ),
  selectQualityScores: vi.fn(() => Promise.resolve([])),
  selectRunSummaries: vi.fn(() =>
    Promise.resolve([
      runSummary({ runId: QUALITY, suite: 'skill-quality' }),
      runSummary({ suite: 'skills' }),
    ]),
  ),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('the quality loader', () => {
  it('scores the recent quality runs and every baseline run once', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');

    const data = await loader();

    expect(selectRunSummaries).toHaveBeenCalledWith({
      scope: { kind: 'recent', perSuite: 30 },
    });
    expect(selectQualityBaselines).toHaveBeenCalledOnce();
    expect(selectQualityScores).toHaveBeenCalledWith({
      runIds: [QUALITY, BASELINE],
    });
    expect(data.runs).toEqual([QUALITY]);
    expect(data.skills.map(({ name }) => name)).toEqual(['react-19']);
  });
});
