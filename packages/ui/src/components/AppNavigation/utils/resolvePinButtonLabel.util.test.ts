import { describe, expect, it } from 'vitest';

import { resolvePinButtonLabel } from './resolvePinButtonLabel.util';

describe('resolvePinButtonLabel', () => {
  it('returns "Unpin navigation" when pinned', () => {
    expect(resolvePinButtonLabel(true)).toBe('Unpin navigation');
  });

  it('returns "Pin navigation" when unpinned', () => {
    expect(resolvePinButtonLabel(false)).toBe('Pin navigation');
  });
});
