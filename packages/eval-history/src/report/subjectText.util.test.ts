import { describe, expect, it } from 'vite-plus/test';

import { subjectText } from './subjectText.util.ts';

describe('subjectText', () => {
  it('names a subject by kind and name', () => {
    expect(subjectText({ kind: 'skill', name: 'react-19' })).toBe(
      'skill `react-19`',
    );
  });

  it('names the suite when there is no subject', () => {
    expect(subjectText(undefined)).toBe('the suite as a whole');
  });
});
