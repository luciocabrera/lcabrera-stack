import { describe, expect, it } from 'vitest';

import { getSerializedOperator } from './getSerializedOperator.util';

describe('getSerializedOperator', () => {
  it('maps a known operator to its short code', () => {
    expect(getSerializedOperator('contains')).toBe('ct');
  });

  it('returns the operator unchanged when not in the map', () => {
    expect(getSerializedOperator('unknownOp')).toBe('unknownOp');
  });

  it('maps equals to its short code', () => {
    expect(getSerializedOperator('equals')).toBe('eq');
  });
});
