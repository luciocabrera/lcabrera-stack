import { describe, expect, it } from 'vitest';

import { computeFanOutCount } from './computeFanOutCount.util';

describe('computeFanOutCount', () => {
  it('treats zero workspaces as a single whole-repo scope per scanner', () => {
    expect(computeFanOutCount({ scannerCount: 3, workspaceCount: 0 })).toBe(3);
  });

  it('multiplies scanners by workspaces when workspaces are selected', () => {
    expect(computeFanOutCount({ scannerCount: 2, workspaceCount: 15 })).toBe(
      30,
    );
  });

  it('returns 0 when no scanners are selected', () => {
    expect(computeFanOutCount({ scannerCount: 0, workspaceCount: 5 })).toBe(0);
  });
});
