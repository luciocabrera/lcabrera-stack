import { describe, expect, it } from 'vite-plus/test';

import { isSubjectKind } from './isSubjectKind.util';

describe('isSubjectKind', () => {
  it('accepts a kind of subject an envelope records', () => {
    expect(isSubjectKind('skill')).toBe(true);
    expect(isSubjectKind('agent')).toBe(true);
  });

  it('refuses anything else', () => {
    expect(isSubjectKind('task')).toBe(false);
    expect(isSubjectKind(undefined)).toBe(false);
  });
});
