import { describe, expect, it } from 'vite-plus/test';

import routes from '@/routes';

import { evalsRouteEntries } from './evalsRouteEntries.util';

describe('evalsRouteEntries', () => {
  it('keeps the routes under /evals, nested ones joined to their parent', () => {
    expect(
      evalsRouteEntries({
        routes: [
          { file: 'a.ts', path: 'evalsx' },
          {
            children: [
              { file: 'c.ts', path: 'runs/:runId' },
              { file: 'd.ts', index: true },
            ],
            file: 'b.ts',
            path: 'evals',
          },
          { file: 'e.ts', path: 'settings' },
        ],
      }),
    ).toEqual([
      { file: 'b.ts', path: 'evals' },
      { file: 'c.ts', path: 'evals/runs/:runId' },
      { file: 'd.ts', path: 'evals' },
    ]);
  });

  it('finds the dashboard routes in the app route config', () => {
    expect(evalsRouteEntries({ routes }).map(({ path }) => path)).toEqual([
      'evals',
      'evals/runs/:runId',
      'evals/runs/:runId/trials',
    ]);
  });
});
