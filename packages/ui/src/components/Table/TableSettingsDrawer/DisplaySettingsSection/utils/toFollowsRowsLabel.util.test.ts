import { describe, expect, it } from 'vite-plus/test';

import { toFollowsRowsLabel } from './toFollowsRowsLabel.util';

describe('toFollowsRowsLabel', () => {
  it('reads Same as rows when no default names a level', () => {
    expect(toFollowsRowsLabel(undefined)).toBe('Same as rows');
  });

  it('names the default level when one is set', () => {
    expect(toFollowsRowsLabel('dense')).toBe('Default (Dense)');
    expect(toFollowsRowsLabel('spacious')).toBe('Default (Spacious)');
  });
});
