import { describe, expect, it } from 'vite-plus/test';

import { isRunId } from './isRunId.util.ts';

describe('isRunId', () => {
  it('reads a uuid as a run id and a path as not one', () => {
    expect(isRunId('00000000-0000-4000-8000-000000000001')).toBe(true);
    expect(isRunId('runs/a.json')).toBe(false);
  });
});
