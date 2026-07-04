import { describe, expect, it } from 'vitest';

import { resolveExpandButtonLabel } from './resolveExpandButtonLabel.util';

describe('resolveExpandButtonLabel', () => {
  it('returns "Collapse navigation" when expanded', () => {
    expect(resolveExpandButtonLabel(true)).toBe('Collapse navigation');
  });

  it('returns "Expand navigation" when collapsed', () => {
    expect(resolveExpandButtonLabel(false)).toBe('Expand navigation');
  });
});
