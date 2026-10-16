import { describe, expect, it } from 'vite-plus/test';

import { requireEvalsDashboard } from './requireEvalsDashboard.service';

const statusOf = (env: NodeJS.ProcessEnv) => {
  try {
    requireEvalsDashboard(env);
  } catch (error) {
    return error instanceof Response ? error.status : 'not a response';
  }

  return 'passed';
};

describe('requireEvalsDashboard', () => {
  it('lets a request through when EVALS_DASHBOARD is 1', () => {
    expect(statusOf({ EVALS_DASHBOARD: '1' })).toBe('passed');
  });

  it.each([undefined, '', '0', 'true', 'yes'])(
    'answers 404 when EVALS_DASHBOARD is %j',
    (value) => {
      expect(statusOf({ EVALS_DASHBOARD: value })).toBe(404);
    },
  );
});
