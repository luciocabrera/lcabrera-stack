import { describe, expect, it } from 'vite-plus/test';

import { ReportInputError } from './reportInput.error.ts';

describe('ReportInputError', () => {
  it('is an Error carrying its message and its own name', () => {
    const error = new ReportInputError('no runs');

    expect(error).toBeInstanceOf(Error);
    expect([error.name, error.message]).toEqual([
      'ReportInputError',
      'no runs',
    ]);
  });
});
