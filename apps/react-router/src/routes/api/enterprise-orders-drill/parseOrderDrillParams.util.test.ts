import { describe, expect, it } from 'vite-plus/test';

import { parseOrderDrillGroup } from './parseOrderDrillParams.util';

const params = (group: unknown) =>
  new URLSearchParams(
    group === undefined ? {} : { group: JSON.stringify(group) },
  );

const VALID = {
  isSubtotal: false,
  keys: ['status', 'category'],
  path: [
    { columnKey: 'status', value: 'Cancelled' },
    { columnKey: 'category', value: 'Automotive' },
  ],
};

describe('parseOrderDrillGroup', () => {
  it('narrows a well-formed group descriptor', () => {
    expect(parseOrderDrillGroup(params(VALID))).toStrictEqual({
      groupKeys: ['status', 'category'],
      summary: {
        isSubtotal: false,
        path: [
          { columnKey: 'status', label: '', value: 'Cancelled' },
          { columnKey: 'category', label: '', value: 'Automotive' },
        ],
      },
    });
  });

  it('keeps a null key rather than dropping it', () => {
    // The NULL group is a group, and it is precisely the one a drill would
    // otherwise silently return nothing for (ADR-079).
    // Built from JSON rather than a source literal: a NULL key reaches this
    // parser as the wire value `null`, and that is what the test should send.
    const parsed = parseOrderDrillGroup(
      new URLSearchParams({
        group:
          '{"isSubtotal":false,"keys":["status"],"path":[{"columnKey":"status","value":null}]}',
      }),
    );

    expect(parsed?.summary.path[0]?.value).toBeNull();
  });

  it('refuses an entry carrying no value member at all', () => {
    // Distinct from a null value: this one is malformed, and a drill built from
    // it would query a different set.
    expect(
      parseOrderDrillGroup(
        params({ ...VALID, keys: ['status'], path: [{ columnKey: 'status' }] }),
      ),
    ).toBeUndefined();
  });

  it('refuses the whole descriptor when one entry does not narrow', () => {
    expect(
      parseOrderDrillGroup(
        params({
          ...VALID,
          path: [{ columnKey: 'status', value: 'Cancelled' }, { value: 'x' }],
        }),
      ),
    ).toBeUndefined();
  });

  it('carries the subtotal flag through, so the translation can refuse it', () => {
    expect(
      parseOrderDrillGroup(params({ ...VALID, isSubtotal: true }))?.summary
        .isSubtotal,
    ).toBe(true);
  });

  it('refuses a descriptor missing the subtotal flag', () => {
    // Defaulting it to `false` would make every malformed request drillable.
    expect(
      parseOrderDrillGroup(params({ keys: VALID.keys, path: VALID.path })),
    ).toBeUndefined();
  });

  it('refuses a non-string key', () => {
    expect(
      parseOrderDrillGroup(params({ ...VALID, keys: ['status', 7] })),
    ).toBeUndefined();
  });

  it('refuses a missing or unparseable group param', () => {
    expect(parseOrderDrillGroup(params(undefined))).toBeUndefined();
    expect(
      parseOrderDrillGroup(new URLSearchParams({ group: '{not json' })),
    ).toBeUndefined();
  });

  it('accepts an empty path, leaving the refusal to the translation', () => {
    // A grand total narrows fine and is refused by `toOrderDrillRead` with a
    // reason. Rejecting it here would collapse that answer into "malformed".
    expect(
      parseOrderDrillGroup(params({ ...VALID, keys: [], path: [] })),
    ).toStrictEqual({
      groupKeys: [],
      summary: { isSubtotal: false, path: [] },
    });
  });
});
