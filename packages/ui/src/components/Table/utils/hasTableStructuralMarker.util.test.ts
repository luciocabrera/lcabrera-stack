import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';
import { hasTableStructuralMarker } from './hasTableStructuralMarker.util';

describe('hasTableStructuralMarker', () => {
  it('recognises a group row by its marker field', () => {
    expect(
      hasTableStructuralMarker({ [TABLE_GROUP_ROW_FIELD]: { count: 4 } }),
    ).toBe(true);
  });

  it('answers false for an ordinary data row', () => {
    expect(
      hasTableStructuralMarker({ customer_type: 'Business', order_id: 7 }),
    ).toBe(false);
  });

  it('answers false for an empty row', () => {
    expect(hasTableStructuralMarker({})).toBe(false);
  });

  it('recognises a marker that is present but unreadable', () => {
    expect(
      hasTableStructuralMarker({ [TABLE_GROUP_ROW_FIELD]: 'not a summary' }),
    ).toBe(true);
  });

  it('does not read an inherited property as a marker', () => {
    const row = Object.create({
      [TABLE_GROUP_ROW_FIELD]: { count: 1 },
    }) as Record<string, unknown>;
    row.order_id = 7;

    expect(
      Object.hasOwn(
        Object.getPrototypeOf(row) as object,
        TABLE_GROUP_ROW_FIELD,
      ),
    ).toBe(true);
    expect(hasTableStructuralMarker(row)).toBe(false);
  });
});
