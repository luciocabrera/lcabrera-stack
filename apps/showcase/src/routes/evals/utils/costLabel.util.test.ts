import { describe, expect, it } from 'vite-plus/test';

import { costLabel } from './costLabel.util';

describe('costLabel', () => {
  it('writes a cost in dollars', () => {
    expect(costLabel(0.12345)).toBe('$0.1235');
    expect(costLabel(3)).toBe('$3.00');
  });

  it('says when no cost was reported', () => {
    expect(costLabel(undefined)).toBe('not reported');
  });
});
