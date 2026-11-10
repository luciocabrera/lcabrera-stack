import { describe, expect, it } from 'vite-plus/test';

import { truthLabel } from './truthLabel.util';

describe('truthLabel', () => {
  it('names the true answer and where it came from', () => {
    expect(truthLabel({ truth: 'REAL', truthSource: 'reopened' })).toBe(
      'REAL (reopened)',
    );
  });

  it('says none yet for a case with no true answer', () => {
    expect(truthLabel({ truth: undefined, truthSource: undefined })).toBe(
      'none yet',
    );
  });
});
