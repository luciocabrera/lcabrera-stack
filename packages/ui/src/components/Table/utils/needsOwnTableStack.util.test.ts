import { describe, expect, it } from 'vite-plus/test';

import { needsOwnTableStack } from './needsOwnTableStack.util';

describe('needsOwnTableStack', () => {
  it('mounts a stack when no table config is above', () => {
    expect(
      needsOwnTableStack({
        hasConfig: false,
        hasRows: false,
        isInOwnStack: false,
      }),
    ).toBe(true);
  });

  it('mounts a stack for rows under another grid’s config', () => {
    expect(
      needsOwnTableStack({
        hasConfig: true,
        hasRows: true,
        isInOwnStack: false,
      }),
    ).toBe(true);
  });

  it('uses the stack it was just given for rows', () => {
    expect(
      needsOwnTableStack({
        hasConfig: true,
        hasRows: true,
        isInOwnStack: true,
      }),
    ).toBe(false);
  });

  it('uses the enclosing stack for a response', () => {
    expect(
      needsOwnTableStack({
        hasConfig: true,
        hasRows: false,
        isInOwnStack: false,
      }),
    ).toBe(false);
  });
});
