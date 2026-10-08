import { describe, expect, it } from 'vite-plus/test';

import { issueField } from './issueField.util.ts';

describe('issueField', () => {
  it('joins a path with dots', () => {
    expect(issueField(['trials', 0, 'detail'])).toBe('trials.0.detail');
  });

  it('names the root when the path is empty', () => {
    expect(issueField([])).toBe('(root)');
  });
});
