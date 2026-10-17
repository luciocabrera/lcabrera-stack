import { describe, expect, it } from 'vite-plus/test';

import { subjectKey } from './subjectKey.util.ts';

describe('subjectKey', () => {
  it('keys a subject by its kind and name', () => {
    expect(subjectKey({ kind: 'skill', name: 'react-19' })).toBe(
      'skill:react-19',
    );
  });
});
