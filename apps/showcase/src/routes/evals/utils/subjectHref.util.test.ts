import { describe, expect, it } from 'vite-plus/test';

import { subjectHref } from './subjectHref.util';

describe('subjectHref', () => {
  it('links to one subject trend', () => {
    expect(subjectHref({ kind: 'skill', name: 'react-19' })).toBe(
      '/evals/subjects/skill/react-19',
    );
  });

  it('encodes a name that is not a plain path segment', () => {
    expect(subjectHref({ kind: 'rule', name: 'a/b c' })).toBe(
      '/evals/subjects/rule/a%2Fb%20c',
    );
  });
});
