import { describe, expect, it } from 'vite-plus/test';

import { isRunId } from './isRunId.util';

describe('isRunId', () => {
  it('accepts a uuid', () => {
    expect(isRunId('6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50')).toBe(true);
  });

  it.each([undefined, '', 'run-a', "6f1d4c4e' or 1=1"])(
    'refuses %j',
    (value) => {
      expect(isRunId(value)).toBe(false);
    },
  );
});
