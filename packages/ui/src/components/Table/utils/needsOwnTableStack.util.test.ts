import { describe, expect, it } from 'vite-plus/test';

import { needsOwnTableStack } from './needsOwnTableStack.util';

describe('needsOwnTableStack', () => {
  it('mounts a stack when no table config is above', () => {
    expect(
      needsOwnTableStack({
        hasConfig: false,
        isInOwnStack: false,
        isRowsResponse: false,
      }),
    ).toBe(true);
  });

  it('mounts a stack for a rows response under another grid’s config', () => {
    expect(
      needsOwnTableStack({
        hasConfig: true,
        isInOwnStack: false,
        isRowsResponse: true,
      }),
    ).toBe(true);
  });

  it('uses the stack it was just given for a rows response', () => {
    expect(
      needsOwnTableStack({
        hasConfig: true,
        isInOwnStack: true,
        isRowsResponse: true,
      }),
    ).toBe(false);
  });

  it('uses the enclosing stack for a selected response', () => {
    expect(
      needsOwnTableStack({
        hasConfig: true,
        isInOwnStack: false,
        isRowsResponse: false,
      }),
    ).toBe(false);
  });
});
