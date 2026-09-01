import { describe, expect, it } from 'vite-plus/test';

import type { OlapDrillRequest } from './olap.types';

import { encodeDrillGroup } from './encode-drill-group.util';
import { OLAP_DRILL_GROUP_PARAM } from './olap.constants';
import { parseDrillGroup } from './parse-drill-group.util';

const params = (value: string) =>
  new URLSearchParams({ [OLAP_DRILL_GROUP_PARAM]: value });

const rawParams = (payload: unknown) => params(JSON.stringify(payload));

const roundTrip = (request: OlapDrillRequest) =>
  parseDrillGroup(
    new URLSearchParams({
      [OLAP_DRILL_GROUP_PARAM]: encodeDrillGroup(request),
    }),
  );

describe('the drill-group codec round trip', () => {
  it('returns what it was given', () => {
    const request: OlapDrillRequest = {
      group: {
        isSubtotal: false,
        path: [
          { columnKey: 'status', value: 'Cancelled' },
          { columnKey: 'category', value: 'Automotive' },
        ],
      },
      groupKeys: ['status', 'category'],
    };

    expect(roundTrip(request)).toStrictEqual(request);
  });

  it('survives a key with no value, which JSON would otherwise erase', () => {
    const parsed = roundTrip({
      group: {
        isSubtotal: false,
        path: [{ columnKey: 'status', value: undefined }],
      },
      groupKeys: ['status'],
    });

    expect(parsed?.group.path[0]?.value).toBeNull();
  });

  it('preserves key order, because depth is read from position', () => {
    const groupKeys = ['region', 'status', 'category'];
    const parsed = roundTrip({
      group: {
        isSubtotal: false,
        path: groupKeys.map((columnKey) => ({ columnKey, value: columnKey })),
      },
      groupKeys,
    });

    expect(parsed?.group.path.map((entry) => entry.columnKey)).toStrictEqual(
      groupKeys,
    );
    expect(parsed?.groupKeys).toStrictEqual(groupKeys);
  });

  it('drops a display label rather than sending it into a query', () => {
    const gridRow: {
      readonly isSubtotal: boolean;
      readonly path: readonly {
        readonly columnKey: string;
        readonly label: string;
        readonly value: unknown;
      }[];
    } = {
      isSubtotal: false,
      path: [{ columnKey: 'total', label: '1,204.00 EUR', value: 1204 }],
    };

    const encoded = encodeDrillGroup({ group: gridRow, groupKeys: ['total'] });

    expect(encoded).not.toContain('EUR');
    expect(encoded).toContain('1204');
  });

  it('carries the subtotal flag, which decides whether a drill is refused', () => {
    const parsed = roundTrip({
      group: {
        isSubtotal: true,
        path: [{ columnKey: 'status', value: 'Open' }],
      },
      groupKeys: ['status'],
    });

    expect(parsed?.group.isSubtotal).toBe(true);
  });
});

describe('the granularity map', () => {
  it('round-trips through the codec', () => {
    const request = {
      group: {
        isSubtotal: false,
        path: [{ columnKey: 'order_date', value: '2021-03-01' }],
      },
      groupKeys: ['order_date'],
      periods: { order_date: 'month' },
    } as const;

    expect(roundTrip(request)).toStrictEqual(request);
  });

  it('omits an empty map, so an untruncated drill is the param it always was', () => {
    const encoded = encodeDrillGroup({
      group: {
        isSubtotal: false,
        path: [{ columnKey: 'city', value: 'Rome' }],
      },
      groupKeys: ['city'],
      periods: {},
    });

    expect(encoded).not.toContain('periods');
    expect(parseDrillGroup(params(encoded))).not.toHaveProperty('periods');
  });

  it('refuses the whole descriptor for a period outside the vocabulary', () => {
    expect(
      parseDrillGroup(
        rawParams({
          isSubtotal: false,
          keys: ['order_date'],
          path: [{ columnKey: 'order_date', value: '2021-03-01' }],
          periods: { order_date: 'fortnight' },
        }),
      ),
    ).toBeUndefined();
  });

  it('refuses a granularity naming a column that is not a group key', () => {
    expect(
      parseDrillGroup(
        rawParams({
          isSubtotal: false,
          keys: ['order_date'],
          path: [{ columnKey: 'order_date', value: '2021-03-01' }],
          periods: { shipped_date: 'month' },
        }),
      ),
    ).toBeUndefined();
  });

  it('refuses a granularity map that is not a map', () => {
    expect(
      parseDrillGroup(
        rawParams({
          isSubtotal: false,
          keys: ['order_date'],
          path: [{ columnKey: 'order_date', value: '2021-03-01' }],
          periods: ['month'],
        }),
      ),
    ).toBeUndefined();
  });
});
