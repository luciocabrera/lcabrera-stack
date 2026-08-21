import { describe, expect, it } from 'vite-plus/test';

import {
  TABLE_DRILL_ROW_FIELD,
  TABLE_GROUP_ROW_FIELD,
} from '../Table.constants';
import { hasTableStructuralMarker } from './hasTableStructuralMarker.util';

describe('hasTableStructuralMarker', () => {
  it('recognises a group row by its marker field', () => {
    expect(
      hasTableStructuralMarker({ [TABLE_GROUP_ROW_FIELD]: { count: 4 } }),
    ).toBe(true);
  });

  it('recognises a drill row by its marker field', () => {
    // The other half of the `||`, which the grid-level test does not reach:
    // there a drill row narrows successfully and never gets this far.
    expect(
      hasTableStructuralMarker({
        [TABLE_DRILL_ROW_FIELD]: { kind: 'loading' },
      }),
    ).toBe(true);
  });

  it('answers false for an ordinary data row', () => {
    // The load-bearing negative. If this were ever true the fail-closed branch
    // would blank every row in the grid.
    expect(
      hasTableStructuralMarker({ customer_type: 'Business', order_id: 7 }),
    ).toBe(false);
  });

  it('answers false for an empty row', () => {
    expect(hasTableStructuralMarker({})).toBe(false);
  });

  it('recognises a marker that is present but unreadable', () => {
    // The whole point of asking this separately from the narrowing readers:
    // they answer `undefined` for a marker they cannot parse, and this must
    // still say the row claims to be chrome. A string rather than a summary
    // object, so no validator would accept it.
    expect(
      hasTableStructuralMarker({ [TABLE_GROUP_ROW_FIELD]: 'not a summary' }),
    ).toBe(true);
  });

  it('does not read an inherited property as a marker', () => {
    // Why `Object.hasOwn` rather than `in`. A row reaching the grid is
    // ordinary data, and `in` walks the prototype chain — so a prototype
    // carrying the marker name would blank a real data row, and every row
    // sharing that prototype with it.
    const row = Object.create({
      [TABLE_GROUP_ROW_FIELD]: { count: 1 },
    }) as Record<string, unknown>;
    row.order_id = 7;

    // The prototype really does carry the name — asserted through the
    // prototype itself rather than with `in`, which is the operator this util
    // deliberately does not use.
    expect(
      Object.hasOwn(
        Object.getPrototypeOf(row) as object,
        TABLE_GROUP_ROW_FIELD,
      ),
    ).toBe(true);
    expect(hasTableStructuralMarker(row)).toBe(false);
  });
});
