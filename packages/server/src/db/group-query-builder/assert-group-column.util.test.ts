import { describe, expect, it } from 'vite-plus/test';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { toSerializableDbError } from '../../errors/to-serializable-db-error.util.ts';
import { assertGroupColumn } from './assert-group-column.util.ts';

const ALLOWED = ['order_status', 'shipping_country'];

const assert = (column: string) =>
  assertGroupColumn({ allowedColumns: ALLOWED, column });

const refusalOf = (column: string) => {
  try {
    assert(column);

    return 'accepted';
  } catch (error) {
    return error;
  }
};

describe('assertGroupColumn', () => {
  it('accepts an allowed column', () => {
    expect(() => assert('order_status')).not.toThrow();
  });

  it('refuses a column outside the allowlist, keeping the message', () => {
    expect(() => assert('secret')).toThrow('not in the allowed list');
  });

  it('refuses a malformed identifier, keeping the message', () => {
    expect(() => assert('Order_Status')).toThrow('Unsafe identifier');
  });

  it.each(['secret', 'Order_Status'])(
    'raises a typed refusal naming %s, not a bare Error',
    (column) => {
      const refusal = refusalOf(column);

      expect(refusal).toBeInstanceOf(GroupingRefusedError);
      expect(refusal).toMatchObject({ column, reason: 'unknown-column' });
    },
  );

  it('survives the loader edge as grouping-refused rather than unexpected', () => {
    const mapped = toSerializableDbError(refusalOf('secret'));

    expect(mapped.kind).toBe('grouping-refused');
    expect(mapped.message).toContain('not in the allowed list');
  });

  it('keeps the original rejection on cause for a server log', () => {
    const refusal = refusalOf('secret');

    expect((refusal as GroupingRefusedError).cause).toBeInstanceOf(Error);
  });
});
