import { describe, expect, it } from 'vitest';

import { parseCliFlags } from './parseCliFlags.util.ts';

describe('parseCliFlags', () => {
  it('parses --key=value flags into a record', () => {
    expect(parseCliFlags(['--project-id=abc', '--root=/x'])).toEqual({
      'project-id': 'abc',
      root: '/x',
    });
  });

  it('keeps empty values and ignores non-matching args', () => {
    expect(parseCliFlags(['--url=', 'positional', '-x'])).toEqual({ url: '' });
  });

  it('preserves = signs inside the value', () => {
    expect(parseCliFlags(['--token=a=b=c'])).toEqual({ token: 'a=b=c' });
  });
});
