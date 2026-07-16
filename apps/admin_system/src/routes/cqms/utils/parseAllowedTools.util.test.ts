import { describe, expect, it } from 'vitest';

import { parseAllowedTools } from './parseAllowedTools.util';

describe('parseAllowedTools', () => {
  it('splits a comma-separated list and trims each tool', () => {
    expect(parseAllowedTools({ allowedTools: 'Read, Grep ,Bash' })).toEqual([
      'Read',
      'Grep',
      'Bash',
    ]);
  });

  it('returns a single-tool list unchanged', () => {
    expect(parseAllowedTools({ allowedTools: 'Read' })).toEqual(['Read']);
  });

  it('returns undefined for a blank field, meaning "no restriction"', () => {
    expect(parseAllowedTools({ allowedTools: '' })).toBeUndefined();
  });
});
