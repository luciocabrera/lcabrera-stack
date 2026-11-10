import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  selectAdjudicationAccuracy,
  selectAdjudicationCases,
  selectAdjudicationVerdicts,
} from '../.server/evalsHistory.service';
import { ACCURACY, CASES, VERDICTS } from './adjudications.fixtures';
import { adjudicationsView } from './adjudicationsView.util';
import { loader } from './evals-adjudications.loader';

vi.mock('../.server/evalsHistory.service', () => ({
  selectAdjudicationAccuracy: vi.fn(() => Promise.resolve(ACCURACY)),
  selectAdjudicationCases: vi.fn(() => Promise.resolve(CASES)),
  selectAdjudicationVerdicts: vi.fn(() => Promise.resolve(VERDICTS)),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('the adjudications loader', () => {
  it('reads the accuracy view, the cases and the verdicts, and derives the page', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');

    expect(await loader()).toEqual(
      adjudicationsView({
        accuracy: ACCURACY,
        cases: CASES,
        verdicts: VERDICTS,
      }),
    );
    expect(selectAdjudicationAccuracy).toHaveBeenCalledWith();
    expect(selectAdjudicationCases).toHaveBeenCalledWith();
    expect(selectAdjudicationVerdicts).toHaveBeenCalledWith();
  });

  it('answers 404 and reads nothing while the dashboard is off', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '');

    await expect(loader()).rejects.toMatchObject({ status: 404 });
    expect(selectAdjudicationCases).not.toHaveBeenCalled();
  });
});
