import type { LoaderFunctionArgs } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { loader } from './root.loader';

const invokeLoader = () =>
  loader({
    request: new Request('http://localhost/'),
  } as LoaderFunctionArgs);

describe('root loader', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('marks the eval dashboard on only when the flag is 1', () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');

    expect(invokeLoader().isEvalsDashboardEnabled).toBe(true);

    vi.stubEnv('EVALS_DASHBOARD', '0');

    expect(invokeLoader().isEvalsDashboardEnabled).toBe(false);
  });
});
